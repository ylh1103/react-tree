import { buildDirectoryDestinations } from './directoryDestinations';
import { MoveDirectoryContent, DeleteDirectoryContent } from './DirectoryDialogs';
import { useCallback, useReducer, useRef, useState, type ReactNode } from 'react';
import { App, Input, Modal } from 'antd';
import type { TreeNode, DropPosition } from './types';
import {
  buildTreeIndex,
  areTreesEqual,
  moveNodeToDirectory,
  updateNodeTitle,
  deleteBranchAndPromoteChildren,
  generateKey,
  moveNode,
} from './treeUtils';

// 编辑状态：已提交数据、草稿及取消时的回退基线。
interface State {
  // 最近接收的外部数据引用，用于区分父组件重渲染与真正的数据替换。
  sourceTree: TreeNode[];
  // committed 是取消编辑的回退基线；draft 通过不可变操作承载未保存修改。
  committed: TreeNode[];
  draft: TreeNode[];
  isEditing: boolean;
  isDirty: boolean;
  editingKey: string | null;
}

type Action =
  | { type: 'REPLACE_TREE'; tree: TreeNode[] }
  | { type: 'ENTER_EDIT' }
  | { type: 'ADD_BRANCH'; title?: string }
  | { type: 'START_RENAME'; key: string }
  | { type: 'RENAME_BRANCH'; key: string; title: string }
  | { type: 'CANCEL_RENAME' }
  | { type: 'DELETE_BRANCH'; key: string; destinationKey?: string | null }
  | { type: 'MOVE_NODE'; dragKey: string; overKey: string; position: DropPosition }
  | { type: 'QUICK_MOVE'; key: string; destinationKey: string | null }
  | { type: 'COMMIT_TREE'; tree: TreeNode[] }
  | { type: 'CANCEL' };

function reducer(state: State, action: Action): State {
  const next = applyAction(state, action);
  if (next.draft === state.draft && next.committed === state.committed) return next;
  // 按最终内容判断脏状态，允许用户将节点移回原位后恢复为无修改。
  return { ...next, isDirty: !areTreesEqual(next.draft, next.committed) };
}

function applyAction(state: State, action: Action): State {
  switch (action.type) {
    case 'REPLACE_TREE':
      return {
        ...state,
        sourceTree: action.tree,
        committed: action.tree,
        draft: action.tree,
        isDirty: false,
        editingKey: null,
      };
    case 'ENTER_EDIT':
      return {
        ...state,
        isEditing: true,
        draft: state.committed,
        isDirty: false,
        editingKey: null,
      };

    case 'ADD_BRANCH': {
      const key = generateKey('branch');
      const newBranch: TreeNode = {
        key,
        type: 'branch',
        title: action.title ?? '新分组',
        children: [],
      };
      return {
        ...state,
        draft: [newBranch, ...state.draft],
        editingKey: key,
      };
    }

    case 'START_RENAME':
      return { ...state, editingKey: action.key };

    case 'RENAME_BRANCH': {
      const title = action.title.trim();
      if (!title) return state;
      return {
        ...state,
        draft: updateNodeTitle(state.draft, action.key, title),
        editingKey: null,
      };
    }

    case 'CANCEL_RENAME':
      return { ...state, editingKey: null };

    case 'DELETE_BRANCH': {
      const draft = deleteBranchAndPromoteChildren(state.draft, action.key, action.destinationKey);
      if (draft === state.draft) return state;
      return {
        ...state,
        draft,
      };
    }

    case 'QUICK_MOVE': {
      if (!state.isEditing) return state;
      const draft = moveNodeToDirectory(state.draft, action.key, action.destinationKey);
      if (draft === state.draft) return state;
      return { ...state, draft };
    }

    case 'MOVE_NODE': {
      if (!state.isEditing) return state;
      const draft = moveNode(state.draft, action.dragKey, action.overKey, action.position);
      return draft === state.draft ? state : { ...state, draft };
    }

    case 'COMMIT_TREE':
      return {
        ...state,
        committed: action.tree,
        draft: action.tree,
        isEditing: false,
        isDirty: false,
        editingKey: null,
      };

    case 'CANCEL':
      return {
        ...state,
        draft: state.committed,
        isEditing: false,
        isDirty: false,
        editingKey: null,
      };

    default:
      return state;
  }
}

export function useTreeReducer(treeData: TreeNode[]) {
  const [state, dispatch] = useReducer(reducer, {
    sourceTree: treeData,
    committed: treeData,
    draft: treeData,
    isEditing: false,
    isDirty: false,
    editingKey: null,
  });

  // 在同一组件的下一次渲染前更新数据，避免 effect 带来一帧过时内容。
  // 编辑态保留草稿；取消或提交后再接收外部数据。
  if (treeData !== state.sourceTree && !state.isEditing) {
    dispatch({ type: 'REPLACE_TREE', tree: treeData });
  }
  return { state, dispatch };
}

// 编辑操作：分组弹窗、保存失败重试与取消确认。
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
  onSave: (tree: TreeNode[], baseline: TreeNode[]) => Promise<TreeNode[]>;
  expandPath: (keys: string[]) => void;
}

/** 统一处理草稿提交、即时操作弹窗和失败重试。 */
export function useTreeActions({
  state,
  dispatch,
  treeIndex,
  disabled,
  onSave,
  expandPath,
}: TreeActionsOptions) {
  const { modal } = App.useApp();
  const { draft, isEditing, isDirty } = state;
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const persistTree = useCallback(
    async (nextTree: TreeNode[]) => {
      if (savingRef.current || disabled) throw new Error('正在处理，请稍候');
      savingRef.current = true;
      setIsSaving(true);
      try {
        // 保存成功后才更新提交基线；失败时保留草稿，使用户可以继续修改或重试。
        const savedTree = areTreesEqual(state.committed, nextTree)
          ? nextTree
          : await onSave(nextTree, state.committed);
        dispatch({ type: 'COMMIT_TREE', tree: savedTree });
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
      } finally {
        dialog.update({
          cancelButtonProps: { disabled: false },
          keyboard: true,
          content: renderContent(),
        });
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
      const renameModal = modal.confirm({
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
    [modal, treeIndex, isEditing, draft, commitImmediateChange, dispatch],
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
        <MoveDirectoryContent
          node={node}
          treeData={treeData}
          value={destinationKeys.indexOf(destinationKey)}
          currentPath={currentPath}
          onChange={(value) => {
            destinationKey = destinationKeys[value];
          }}
        />
      );
      const moveModal = modal.confirm({
        title: '快速移动',
        icon: <span aria-hidden="true" className="i-lucide-folder-input text-5.5 mr-3" />,
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
    [modal, treeIndex, isEditing, draft, commitImmediateChange, dispatch, expandPath],
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
          <DeleteDirectoryContent
            node={node}
            treeData={treeData}
            value={destinationKeys.indexOf(destinationKey)}
            directoryPath={directoryPath}
            onChange={(value) => {
              destinationKey = destinationKeys[value];
            }}
          />
        );
        const deleteModal = modal.confirm({
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
        const deleteModal = modal.confirm({
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
    [modal, treeIndex, isEditing, draft, commitImmediateChange, dispatch, expandPath],
  );

  const handleSave = async () => {
    if (savingRef.current || disabled || !isEditing) return;
    try {
      await persistTree(draft);
    } catch {
      // useGroupedList 已展示错误弹窗；保留草稿和编辑状态供用户继续处理。
    }
  };

  const handleCancel = () => {
    if (savingRef.current) return;
    if (isDirty) {
      modal.confirm({
        title: '放弃更改',
        content: '有未保存的更改，确定放弃吗？',
        okText: '放弃',
        okType: 'danger',
        cancelText: '继续编辑',
        onOk: () => {
          dispatch({ type: 'CANCEL' });
        },
      });
    } else {
      dispatch({ type: 'CANCEL' });
    }
  };

  return {
    isSaving,
    handleStartRename,
    handleQuickMove,
    handleDelete,
    handleSave,
    handleCancel,
  };
}
