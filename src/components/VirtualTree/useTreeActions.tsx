import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Alert, Input, Modal, TreeSelect } from 'antd';
import type { TreeNode, VirtualTreeProps } from './types';
import type { useTreeReducer } from './useTreeReducer';
import {
  buildTreeIndex,
  areTreesEqual,
  moveNodeToDirectory,
  updateNodeTitle,
  deleteBranchAndPromoteChildren,
} from './utils';

function buildDirectoryDestinations(tree: TreeNode[], excludedKey: string) {
  // 用数字值区分根节点与业务 key，并排除整个源子树。
  const destinationKeys: (string | null)[] = [null];
  type DirectoryOption = { title: string; value: number; children: DirectoryOption[] };
  const walk = (nodes: TreeNode[]): DirectoryOption[] =>
    nodes.flatMap((node) => {
      if (node.type !== 'branch' || node.key === excludedKey) return [];
      const value = destinationKeys.push(node.key) - 1;
      return [{ title: node.title || '未命名分组', value, children: walk(node.children) }];
    });
  const treeData = [{ title: '根节点', value: 0, children: walk(tree) }];
  return { destinationKeys, treeData };
}

// 静态 confirm 对拒绝的 onOk Promise 会再次抛出异常。使用显式关闭回调，
// 让已在弹窗展示的保存错误保持可重试，不产生未处理的 Promise 拒绝。
async function runDialogAction(
  dialog: ReturnType<typeof Modal.confirm>,
  action: () => Promise<void>,
  close: () => void,
) {
  dialog.update({ okButtonProps: { loading: true } });
  try {
    await action();
    close();
  } catch {
    // commitImmediateChange 已显示错误并恢复输入，保留弹窗供用户重试。
  } finally {
    dialog.update({ okButtonProps: { loading: false } });
  }
}

interface TreeActionsOptions {
  state: ReturnType<typeof useTreeReducer>['state'];
  dispatch: ReturnType<typeof useTreeReducer>['dispatch'];
  treeIndex: ReturnType<typeof buildTreeIndex>;
  disabled: boolean;
  onSave: VirtualTreeProps['onSave'];
  onCancel: VirtualTreeProps['onCancel'];
  expandPath: (keys: string[]) => void;
}

/** 统一处理草稿提交、即时操作弹窗和失败重试。 */
export function useTreeActions({
  state,
  dispatch,
  treeIndex,
  disabled,
  onSave,
  onCancel,
  expandPath,
}: TreeActionsOptions) {
  const { draft, isEditing, isDirty } = state;
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);
  const persistTree = useCallback(
    async (nextTree: TreeNode[]) => {
      if (savingRef.current || disabled) throw new Error('正在处理，请稍候');
      savingRef.current = true;
      setIsSaving(true);
      setSaveError('');
      try {
        // 保存成功后才更新提交基线；失败时保留草稿，使用户可以继续修改或重试。
        if (!areTreesEqual(state.committed, nextTree)) await onSave?.(nextTree);
        dispatch({ type: 'COMMIT_TREE', tree: nextTree });
      } finally {
        savingRef.current = false;
        setIsSaving(false);
      }
    },
    [disabled, state.committed, onSave, dispatch],
  );

  const commitImmediateChange = useCallback(
    async (
      nextTree: TreeNode[],
      dialog: ReturnType<typeof Modal.confirm>,
      renderContent: () => ReactNode,
    ) => {
      if (savingRef.current || disabled) throw new Error('正在处理，请稍候');
      if (areTreesEqual(draft, nextTree)) return;
      dialog.update({
        cancelButtonProps: { disabled: true },
        keyboard: false,
        content: <div inert>{renderContent()}</div>,
      });
      try {
        await persistTree(nextTree);
      } catch (error) {
        dialog.update({
          content: (
            <>
              <Alert
                type="error"
                showIcon
                title={error instanceof Error ? error.message : '保存失败，请重试'}
              />
              {renderContent()}
            </>
          ),
        });
        throw error;
      } finally {
        dialog.update({ cancelButtonProps: { disabled: false }, keyboard: true });
      }
    },
    [disabled, draft, persistTree],
  );

  const handleStartRename = useCallback(
    (key: string) => {
      const node = treeIndex.nodeByKey.get(key);
      if (node?.type !== 'branch' || savingRef.current) return;
      if (isEditing) {
        dispatch({ type: 'START_RENAME', key });
        return;
      }
      let title = node.title;
      const renderContent = () => (
        <div className="pt-3">
          <Input
            aria-label="分组名称"
            autoFocus
            defaultValue={title}
            placeholder="请输入分组名称"
            onChange={(event) => {
              title = event.target.value;
              renameModal.update({ okButtonProps: { disabled: !title.trim() } });
            }}
          />
        </div>
      );
      const renameModal = Modal.confirm({
        title: '重命名分组',
        centered: true,
        content: renderContent(),
        okText: '保存名称',
        cancelText: '取消',
        okButtonProps: { disabled: !title.trim() },
        onOk: (close) => {
          void runDialogAction(
            renameModal,
            async () => {
              if (!title.trim()) throw new Error('分组名称不能为空');
              await commitImmediateChange(
                updateNodeTitle(draft, key, title.trim()),
                renameModal,
                renderContent,
              );
            },
            close,
          );
        },
      });
    },
    [treeIndex, isEditing, draft, commitImmediateChange, dispatch],
  );

  const handleQuickMove = useCallback(
    (key: string) => {
      const node = treeIndex.nodeByKey.get(key);
      if (!node || savingRef.current) return;
      const ancestors = treeIndex.ancestors(key);
      let destinationKey: string | null = ancestors[0] ?? null;
      const { destinationKeys, treeData } = buildDirectoryDestinations(draft, key);
      const currentPath = [
        '根节点',
        ...[...ancestors]
          .reverse()
          .map((ancestor) => treeIndex.nodeByKey.get(ancestor)?.title || '未命名分组'),
      ].join(' / ');
      const renderMoveContent = () => (
        <div className="flex min-w-0 flex-col gap-4 pt-3 text-sm">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="break-words font-medium text-gray-900 [overflow-wrap:anywhere]">
              <span
                aria-hidden="true"
                className={node.type === 'branch' ? 'i-lucide-folder' : 'i-lucide-file'}
              />{' '}
              {node.title}
            </div>
            <div className="mt-2 max-h-20 overflow-y-auto break-words text-xs text-gray-500 [overflow-wrap:anywhere]">
              当前位置：{currentPath}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium text-gray-900">移动到</span>
            <TreeSelect
              aria-label="移动到"
              className="w-full"
              size="large"
              treeData={treeData}
              defaultValue={destinationKeys.indexOf(destinationKey)}
              treeDefaultExpandedKeys={[0]}
              showSearch
              treeNodeFilterProp="title"
              onChange={(value: number) => {
                destinationKey = destinationKeys[value];
              }}
            />
            <p className="m-0 text-xs leading-5 text-gray-500">
              移动到所选位置的末尾。分组内的所有内容将一起移动。
            </p>
          </div>
        </div>
      );
      const moveModal = Modal.confirm({
        title: '快速移动',
        icon: <span aria-hidden="true" className="i-lucide-folder text-5.5 mr-3" />,
        width: 560,
        centered: true,
        content: renderMoveContent(),
        okText: isEditing ? '确认移动' : '移动并保存',
        cancelText: '取消',
        onOk: (close) => {
          void runDialogAction(
            moveModal,
            async () => {
              const targetKey = destinationKey;
              if (savingRef.current) throw new Error('正在保存，请稍候');
              if (isEditing) {
                dispatch({ type: 'QUICK_MOVE', key, destinationKey: targetKey });
              } else {
                await commitImmediateChange(
                  moveNodeToDirectory(draft, key, targetKey),
                  moveModal,
                  renderMoveContent,
                );
              }
              // 展开目标及其祖先，让移动后的节点可见。
              if (targetKey !== null) {
                expandPath([targetKey, ...treeIndex.ancestors(targetKey)]);
              }
            },
            close,
          );
        },
      });
    },
    [treeIndex, isEditing, draft, commitImmediateChange, dispatch, expandPath],
  );

  const handleDelete = useCallback(
    (key: string) => {
      const node = treeIndex.nodeByKey.get(key);
      if (node?.type !== 'branch' || savingRef.current) return;
      if (node.children.length > 0) {
        const ancestors = treeIndex.ancestors(key);
        let destinationKey: string | null = ancestors[0] ?? null;
        const { destinationKeys, treeData } = buildDirectoryDestinations(draft, key);
        const directoryPath = [...ancestors]
          .reverse()
          .map((ancestor) => treeIndex.nodeByKey.get(ancestor)?.title || '未命名分组');
        directoryPath.push(node.title || '未命名分组');
        const renderDeleteContent = () => (
          <div className="flex min-w-0 flex-col gap-5 pt-3 text-sm">
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg text-gray-500">
                <span aria-hidden="true" className="i-lucide-folder" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-xs text-gray-500">即将删除的分组</div>
                <div className="break-words font-medium text-gray-900 [overflow-wrap:anywhere]">
                  {node.title || '未命名分组'}
                </div>
                <div className="mt-2 max-h-20 overflow-y-auto break-words text-xs leading-5 text-gray-500 [overflow-wrap:anywhere]">
                  <span className="sr-only">分组路径：</span>
                  根节点 / {directoryPath.join(' / ')}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-900">子节点移动到</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  {node.children.length} 个直接子节点
                </span>
              </div>
              <TreeSelect
                aria-label="子节点移动到"
                className="w-full"
                size="large"
                treeData={treeData}
                defaultValue={destinationKeys.indexOf(destinationKey)}
                treeDefaultExpandedKeys={[0]}
                showSearch
                treeNodeFilterProp="title"
                onChange={(value: number) => {
                  destinationKey = destinationKeys[value];
                }}
              />
              <p className="m-0 text-xs leading-5 text-gray-500">
                默认选择父分组，可搜索并选择其他分组或根节点。
              </p>
            </div>

            <div className="rounded-md border-l-2 border-amber-400 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
              仅删除该分组，子节点及其内容会保留，并按原顺序追加到目标末尾。
            </div>
          </div>
        );
        const deleteModal = Modal.confirm({
          title: '删除分组',
          width: 560,
          centered: true,
          content: renderDeleteContent(),
          okText: isEditing ? '删除并移动' : '删除并保存',
          okType: 'danger',
          cancelText: '取消',
          onOk: (close) => {
            void runDialogAction(
              deleteModal,
              async () => {
                if (isEditing) {
                  dispatch({ type: 'DELETE_BRANCH', key, destinationKey });
                } else {
                  await commitImmediateChange(
                    deleteBranchAndPromoteChildren(draft, key, destinationKey),
                    deleteModal,
                    renderDeleteContent,
                  );
                }
                if (destinationKey !== null) {
                  expandPath([destinationKey, ...treeIndex.ancestors(destinationKey)]);
                }
              },
              close,
            );
          },
        });
      } else if (isEditing) {
        dispatch({ type: 'DELETE_BRANCH', key });
      } else {
        const renderContent = () => <p>确定删除空分组「{node.title || '未命名分组'}」？</p>;
        const deleteModal = Modal.confirm({
          title: '删除分组',
          centered: true,
          content: renderContent(),
          okText: '删除并保存',
          okType: 'danger',
          cancelText: '取消',
          onOk: (close) => {
            void runDialogAction(
              deleteModal,
              () =>
                commitImmediateChange(
                  deleteBranchAndPromoteChildren(draft, key),
                  deleteModal,
                  renderContent,
                ),
              close,
            );
          },
        });
      }
    },
    [treeIndex, isEditing, draft, commitImmediateChange, dispatch, expandPath],
  );

  const handleSave = async () => {
    if (savingRef.current || disabled || !isEditing) return;
    try {
      await persistTree(draft);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '保存失败，请重试');
    }
  };

  const handleCancel = () => {
    if (savingRef.current) return;
    setSaveError('');
    if (isDirty) {
      Modal.confirm({
        title: '放弃更改',
        content: '有未保存的更改，确定放弃吗？',
        okText: '放弃',
        okType: 'danger',
        cancelText: '继续编辑',
        onOk: () => {
          dispatch({ type: 'CANCEL' });
          onCancel?.();
        },
      });
    } else {
      dispatch({ type: 'CANCEL' });
      onCancel?.();
    }
  };

  return {
    isSaving,
    saveError,
    handleStartRename,
    handleQuickMove,
    handleDelete,
    handleSave,
    handleCancel,
  };
}
