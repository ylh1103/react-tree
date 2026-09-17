import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, DragOverlay, type Modifier } from '@dnd-kit/core';
import { Alert, Button, Input, Modal, Space, Tooltip, TreeSelect } from 'antd';
import type { LeafNode, TreeNode, VirtualTreeProps } from './types';
import {
  flattenTree,
  buildTreeIndex,
  deriveTreeView,
  findNode,
  moveNodeToDirectory,
  areTreesEqual,
  updateNodeTitle,
  deleteBranchAndPromoteChildren,
} from './utils';
import { useTreeReducer } from './useTreeReducer';
import { useDragDrop } from './useDragDrop';
import { TreeRow } from './TreeRow';
import { useTreeTheme } from './useTreeTheme';
import './VirtualTree.css';

// translateY 是虚拟行的布局位置，测量时必须保留，不能作为拖拽位移扣除。
const dragMeasuring = {
  draggable: {
    measure: (element: HTMLElement) => element.getBoundingClientRect(),
  },
};

const DRAG_EXPAND_DELAY = 600;

// 仅偏移预览，不改变指针命中位置。为上方的目标提示预留空间。
const offsetDragPreview: Modifier = ({ activatorEvent, activeNodeRect, transform, windowRect }) => {
  if (!activeNodeRect || !activatorEvent || !('clientX' in activatorEvent)) return transform;
  const pointer = activatorEvent as PointerEvent;
  const pointerX = pointer.clientX + transform.x;
  const pointerY = pointer.clientY + transform.y;
  const width = Math.min(208, (windowRect?.width ?? 240) - 24);
  const left =
    windowRect && pointerX + 24 + width > windowRect.width
      ? Math.max(8, pointerX - width - 24)
      : pointerX + 24;
  const top = windowRect ? Math.min(pointerY + 72, windowRect.height - 40) : pointerY + 72;
  return { ...transform, x: left - activeNodeRect.left, y: Math.max(64, top) - activeNodeRect.top };
};
const dragPreviewModifiers = [offsetDragPreview];

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

export function VirtualTree({
  className = '',
  searchPlaceholder = '搜索叶子节点',
  getSearchText,
  getLeafCategory,
  filterLeaf,
  onClearFilter,
  renderToolbar,
  defaultTreeData,
  treeData,
  disabled = false,
  renderLeafContent,
  getLeafMenuItems,
  renderBranchContent,
  onSelect,
  onSave,
  onCancel,
  height,
  rowHeight = 36,
  emptyText = '暂无数据',
  newGroupTitle = '新分组',
}: VirtualTreeProps) {
  const treeTheme = useTreeTheme();
  const { state, dispatch } = useTreeReducer(defaultTreeData, treeData);
  const { draft, isEditing, isDirty, editingKey } = state;
  const treeIndex = useMemo(() => buildTreeIndex(draft, getLeafCategory), [draft, getLeafCategory]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  if (selectedKey !== null && !treeIndex.nodeByKey.has(selectedKey)) {
    setSelectedKey(null);
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCollapse, setSearchCollapse] = useState<{
    query: string;
    keys: Set<string>;
  }>({ query: '', keys: new Set() });
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [previousDraft, setPreviousDraft] = useState(draft);
  if (previousDraft !== draft) {
    setPreviousDraft(draft);
    const isGroup = (key: string) => treeIndex.nodeByKey.get(key)?.type === 'branch';
    if ([...expandedKeys].some((key) => !isGroup(key))) {
      setExpandedKeys(new Set([...expandedKeys].filter(isGroup)));
    }
    if ([...searchCollapse.keys].some((key) => !isGroup(key))) {
      setSearchCollapse({
        ...searchCollapse,
        keys: new Set([...searchCollapse.keys].filter(isGroup)),
      });
    }
  }

  const parentScrollRef = useRef<HTMLDivElement | null>(null);

  // 超过指针移动阈值才开始拖拽；结束或取消时 activeDragKey 会清空。
  const {
    sensors,
    activeDragKey,
    dropIndicator,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useDragDrop(treeIndex, (dragKey, overKey, position) =>
    dispatch({ type: 'MOVE_NODE', dragKey, overKey, position }),
  );

  const normalizedSearchQuery = searchQuery.trim();

  const {
    filteredTree,
    leafCount: filteredLeafCount,
    leafCountsByCategory: filteredLeafCountsByCategory,
    ancestorKeys: searchAncestorKeys,
    branchKeys: visibleBranchKeys,
  } = useMemo(
    () =>
      deriveTreeView(
        draft,
        normalizedSearchQuery,
        getSearchText,
        filterLeaf,
        isEditing,
        getLeafCategory,
      ),
    [draft, normalizedSearchQuery, getSearchText, filterLeaf, isEditing, getLeafCategory],
  );
  const totalLeafCount = treeIndex.leafCount;
  const isFiltered = Boolean(normalizedSearchQuery || filterLeaf);

  // 搜索命中的祖先分组叠加展示，但不写回 expandedKeys 本身，
  // 这样清空搜索词后能恢复到用户手动展开/折叠的状态，而不会把搜索期间的展开也保留下来。
  const effectiveExpandedKeys = useMemo(() => {
    if (!normalizedSearchQuery && activeDragKey === null) return expandedKeys;
    const merged = new Set(expandedKeys);
    if (normalizedSearchQuery) {
      const manuallyCollapsed =
        searchCollapse.query === normalizedSearchQuery ? searchCollapse.keys : new Set<string>();
      searchAncestorKeys.forEach((key) => {
        if (!manuallyCollapsed.has(key)) merged.add(key);
      });
      manuallyCollapsed.forEach((key) => merged.delete(key));
    }
    // 仅临时隐藏被拖分组的子树，保留原始展开状态（包括子分组）。
    // 在搜索自动展开之后移除，确保搜索状态下也能收起；拖拽结束后自动恢复。
    if (activeDragKey !== null) merged.delete(activeDragKey);
    return merged;
  }, [expandedKeys, searchAncestorKeys, normalizedSearchQuery, searchCollapse, activeDragKey]);

  const allExpanded = useMemo(
    () =>
      visibleBranchKeys.size > 0 &&
      [...visibleBranchKeys].every((key) => effectiveExpandedKeys.has(key)),
    [visibleBranchKeys, effectiveExpandedKeys],
  );

  const setAllExpanded = (expand: boolean) => {
    if (normalizedSearchQuery) {
      // 搜索内的批量操作与单组折叠一致，不覆盖搜索前的展开状态。
      setSearchCollapse({
        query: normalizedSearchQuery,
        keys: expand ? new Set() : new Set(visibleBranchKeys),
      });
      return;
    }
    setExpandedKeys((previous) => {
      const next = new Set(previous);
      visibleBranchKeys.forEach((key) => {
        if (expand) next.add(key);
        else next.delete(key);
      });
      return next;
    });
  };

  const hoverExpandKey =
    activeDragKey !== null &&
    dropIndicator !== null &&
    dropIndicator.position === 'inside' &&
    !effectiveExpandedKeys.has(dropIndicator.overKey) &&
    treeIndex.nodeByKey.get(dropIndicator.overKey)?.type === 'branch'
      ? dropIndicator.overKey
      : null;

  useEffect(() => {
    if (hoverExpandKey === null) return;
    const timer = setTimeout(() => {
      setSearchCollapse((prev) => {
        if (!prev.keys.has(hoverExpandKey)) return prev;
        const keys = new Set(prev.keys);
        keys.delete(hoverExpandKey);
        return { ...prev, keys };
      });
      setExpandedKeys((prev) => {
        if (prev.has(hoverExpandKey)) return prev;
        const next = new Set(prev);
        next.add(hoverExpandKey);
        return next;
      });
    }, DRAG_EXPAND_DELAY);
    // 同一分组的 inside 区域内移动不重置计时；移到 before/after、离开或结束拖拽时取消。
    return () => clearTimeout(timer);
  }, [hoverExpandKey]);

  const flat = useMemo(
    () => flattenTree(filteredTree, effectiveExpandedKeys),
    [filteredTree, effectiveExpandedKeys],
  );

  // 排序、搜索会改变行索引，使用业务 key 保持虚拟行与节点身份一致。
  const getItemKey = useCallback((index: number) => flat[index].node.key, [flat]);
  const virtualizer = useVirtualizer({
    count: flat.length,
    getItemKey,
    getScrollElement: () => parentScrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  const toggleExpand = useCallback(
    (key: string) => {
      if (normalizedSearchQuery && searchAncestorKeys.has(key)) {
        setSearchCollapse((prev) => {
          const keys =
            prev.query === normalizedSearchQuery ? new Set(prev.keys) : new Set<string>();
          if (effectiveExpandedKeys.has(key)) keys.add(key);
          else keys.delete(key);
          return { query: normalizedSearchQuery, keys };
        });
        return;
      }
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [effectiveExpandedKeys, normalizedSearchQuery, searchAncestorKeys],
  );

  const handleSelect = useCallback(
    (key: string, node: LeafNode) => {
      setSelectedKey(key);
      onSelect?.(key, node);
    },
    [onSelect],
  );

  // 定位是“先展开、再滚动”两步：展开祖先节点触发 flat 重新计算是异步的（要等下一次渲染），
  // 所以这里用 ref 记一个“待定位”标记，在下面的 effect 里等 flat 更新后再去查找目标行的
  // 索引并滚动，避免用旧的 flat 数据算出错误的 index。
  const pendingLocateRef = useRef(false);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 高亮计时独立于 flat，避免展开、搜索或拖拽更新提前清理计时器。
  useEffect(
    () => () => {
      if (highlightTimerRef.current !== null) clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  const handleLocate = () => {
    if (!selectedKey || !treeIndex.nodeByKey.get(selectedKey)) return;
    // 被过滤的选中节点需要先恢复可见；命中节点则仅重新展开路径。
    if (!findNode(filteredTree, selectedKey)) {
      setSearchQuery('');
      const selectedNode = treeIndex.nodeByKey.get(selectedKey);
      if (selectedNode?.type === 'leaf' && filterLeaf && !filterLeaf(selectedNode)) {
        onClearFilter?.();
      }
    }
    const ancestors = treeIndex.ancestors(selectedKey);
    setSearchCollapse((prev) => {
      const keys = new Set(prev.keys);
      ancestors.forEach((key) => keys.delete(key));
      return { ...prev, keys };
    });
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      ancestors.forEach((a) => next.add(a));
      return next;
    });
    pendingLocateRef.current = true;
  };

  useEffect(() => {
    if (!pendingLocateRef.current || !selectedKey) return;
    const idx = flat.findIndex((f) => f.node.key === selectedKey);
    if (idx === -1) return;
    pendingLocateRef.current = false;
    virtualizer.scrollToIndex(idx, { align: 'center' });
    setHighlightedKey(selectedKey);
    if (highlightTimerRef.current !== null) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedKey(null);
      highlightTimerRef.current = null;
    }, 1400);
  }, [flat, selectedKey, virtualizer]);

  const handleEnterEdit = () => dispatch({ type: 'ENTER_EDIT' });
  const handleAddBranch = () => dispatch({ type: 'ADD_BRANCH', title: newGroupTitle });
  const commitRename = useCallback(
    (key: string, title: string) => dispatch({ type: 'RENAME_BRANCH', key, title }),
    [dispatch],
  );
  const cancelRename = useCallback(() => dispatch({ type: 'CANCEL_RENAME' }), [dispatch]);

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
                const targetKeys = [targetKey, ...treeIndex.ancestors(targetKey)];
                setExpandedKeys((prev) => new Set([...prev, ...targetKeys]));
                setSearchCollapse((prev) => {
                  const keys = new Set(prev.keys);
                  targetKeys.forEach((targetKey) => keys.delete(targetKey));
                  return { ...prev, keys };
                });
              }
            },
            close,
          );
        },
      });
    },
    [treeIndex, isEditing, draft, commitImmediateChange, dispatch],
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
                  const targetKeys = [destinationKey, ...treeIndex.ancestors(destinationKey)];
                  setExpandedKeys((prev) => new Set([...prev, ...targetKeys]));
                  setSearchCollapse((prev) => {
                    const keys = new Set(prev.keys);
                    targetKeys.forEach((targetKey) => keys.delete(targetKey));
                    return { ...prev, keys };
                  });
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
    [treeIndex, isEditing, draft, commitImmediateChange, dispatch],
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

  const activeDragNode = activeDragKey ? treeIndex.nodeByKey.get(activeDragKey) : null;
  const dropTarget = dropIndicator ? treeIndex.nodeByKey.get(dropIndicator.overKey) : null;
  const dropParentKey = dropTarget ? treeIndex.parentByKey.get(dropTarget.key) : null;
  const dropParentTitle = dropParentKey ? treeIndex.nodeByKey.get(dropParentKey)?.title : '根目录';
  const dropDescription =
    dropTarget && dropIndicator
      ? dropIndicator.position === 'inside'
        ? '移入「' + dropTarget.title + '」· 成为子节点'
        : '与「' +
          dropTarget.title +
          '」同级 · 放在其' +
          (dropIndicator.position === 'before' ? '前' : '后') +
          '方（' +
          dropParentTitle +
          '）'
      : '移动到分组中部以移入，上下边缘以同级插入';

  return (
    <div
      className={`virtual-tree flex flex-col border border-gray-200 rounded-md overflow-hidden ${className}`}
      style={{ ...treeTheme, height: height ?? '100%' }}
      aria-busy={isSaving || disabled}
      inert={isSaving || disabled}
    >
      {saveError && <Alert type="error" showIcon title={saveError} />}
      {renderToolbar?.({
        totalLeafCount,
        filteredLeafCount,
        totalLeafCountsByCategory: treeIndex.leafCountsByCategory,
        filteredLeafCountsByCategory,
        isFiltered,
        isSaving,
        selectedKey,
        locateSelected: handleLocate,
        allExpanded,
        hasGroups: visibleBranchKeys.size > 0,
        toggleAllExpanded: () => setAllExpanded(!allExpanded),
        isEditing,
        enterEdit: handleEnterEdit,
        addBranch: handleAddBranch,
        save: handleSave,
        cancel: handleCancel,
      })}
      <div className="tree-search flex items-center gap-2 p-2 border-b border-gray-200 bg-white">
        <Input.Search
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          allowClear
          value={searchQuery}
          onChange={(e) => {
            const query = e.target.value;
            setSearchQuery(query);
            if (query.trim() !== normalizedSearchQuery) {
              setSearchCollapse({ query: query.trim(), keys: new Set() });
            }
          }}
          className="max-w-xs"
        />
        {!renderToolbar && (
          <>
            <Button
              icon={<span aria-hidden="true" className="i-lucide-locate-fixed" />}
              disabled={!selectedKey}
              onClick={handleLocate}
            >
              定位
            </Button>
            <Tooltip title={allExpanded ? '全部折叠' : '全部展开'}>
              <Button
                aria-label={allExpanded ? '全部折叠' : '全部展开'}
                disabled={visibleBranchKeys.size === 0}
                onClick={() => setAllExpanded(!allExpanded)}
                icon={
                  <span
                    aria-hidden="true"
                    className={
                      allExpanded ? 'i-lucide:chevrons-down-up' : 'i-lucide:chevrons-up-down'
                    }
                  />
                }
              />
            </Tooltip>
            <div className="flex-1" />
            {isEditing ? (
              <Space>
                <Button
                  icon={<span aria-hidden="true" className="i-lucide-folder-plus" />}
                  onClick={handleAddBranch}
                >
                  新增分组
                </Button>
                <Button
                  type="primary"
                  loading={isSaving}
                  icon={<span aria-hidden="true" className="i-lucide-save" />}
                  onClick={handleSave}
                >
                  保存
                </Button>
                <Button
                  icon={<span aria-hidden="true" className="i-lucide-x" />}
                  onClick={handleCancel}
                >
                  取消
                </Button>
              </Space>
            ) : (
              <Button
                icon={<span aria-hidden="true" className="i-lucide-pencil" />}
                onClick={handleEnterEdit}
              >
                编辑
              </Button>
            )}
          </>
        )}
      </div>

      <div
        ref={parentScrollRef}
        className="tree-scroll-viewport min-h-0 min-w-0 flex-1 overflow-auto relative"
      >
        {flat.length === 0 && (
          <div
            className="tree-empty px-4 py-10 text-center text-[13px] text-[#75838d]"
            role="status"
          >
            {normalizedSearchQuery || filterLeaf ? '未找到匹配的结果' : emptyText}
          </div>
        )}
        <DndContext
          sensors={sensors}
          measuring={dragMeasuring}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const flatNode = flat[virtualItem.index];
              const { node } = flatNode;
              // 分组之后表示整个子树之后，避免在目录与首个子节点之间画线。
              let afterIndex = virtualItem.index + 1;
              if (dropIndicator?.overKey === node.key && dropIndicator.position === 'after') {
                while (afterIndex < flat.length && flat[afterIndex].depth > flatNode.depth)
                  afterIndex++;
              }
              return (
                <TreeRow
                  key={node.key}
                  flatNode={flatNode}
                  virtualStart={virtualItem.start}
                  isExpanded={effectiveExpandedKeys.has(node.key)}
                  isSelected={selectedKey === node.key}
                  isRenaming={editingKey === node.key}
                  isHighlighted={highlightedKey === node.key}
                  isEditing={isEditing}
                  isDragging={activeDragKey === node.key}
                  isDragActive={activeDragKey !== null}
                  searchQuery={normalizedSearchQuery}
                  dropIndicator={dropIndicator?.overKey === node.key ? dropIndicator : null}
                  rowHeight={rowHeight}
                  dropAfterOffset={(afterIndex - virtualItem.index) * rowHeight}
                  renderLeafContent={renderLeafContent}
                  getLeafMenuItems={getLeafMenuItems}
                  renderBranchContent={renderBranchContent}
                  onToggleExpand={toggleExpand}
                  onSelect={handleSelect}
                  onStartRename={handleStartRename}
                  onCommitRename={commitRename}
                  onCancelRename={cancelRename}
                  onDelete={handleDelete}
                  onQuickMove={handleQuickMove}
                />
              );
            })}
          </div>
          <DragOverlay
            modifiers={dragPreviewModifiers}
            dropAnimation={null}
            style={{ pointerEvents: 'none', width: 'max-content' }}
          >
            {activeDragNode ? (
              <div
                aria-hidden="true"
                className="tree-drag-preview relative flex items-center gap-1.75 w-52 max-w-[calc(100vw-24px)] h-7.5 px-2.25 py-0 border border-solid border-[var(--accent-border)] rounded-[5px] bg-[#ffffffe6] text-[#536873] shadow-[0_2px_6px_#2038460d] text-[12px] pointer-events-none select-none"
              >
                <div className="tree-drag-hint absolute bottom-[calc(100%+5px)] left-0 w-52 max-w-[calc(100vw-24px)] px-2 py-1.25 border border-solid border-[var(--accent-border)] rounded-[5px] text-[var(--accent-text)] bg-[var(--accent-bg)] text-[11px] leading-[17px] line-clamp-2 [overflow-wrap:anywhere] pointer-events-none">
                  {dropDescription}
                </div>
                <span className="tree-drag-preview-icon flex shrink-0 text-[var(--accent)] text-[14px]">
                  {activeDragNode.type === 'branch' ? (
                    <span aria-hidden="true" className="i-lucide-folder" />
                  ) : (
                    <span aria-hidden="true" className="i-lucide-file" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {activeDragNode.title || '未命名分组'}
                </span>
                {activeDragNode.type === 'branch' && (
                  <span className="tree-drag-preview-count shrink-0 px-1.25 py-0.25 rounded-[3px] bg-[#edf3f5] text-[#70838c] text-[10px] leading-4 whitespace-nowrap tabular-nums">
                    {activeDragNode.children.length} 项
                  </span>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
