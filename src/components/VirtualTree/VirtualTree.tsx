import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, DragOverlay, type Modifier } from '@dnd-kit/core';
import { Button, Input, Modal, Space, TreeSelect } from 'antd';
import type { LeafNode, TreeNode, VirtualTreeProps } from './types';
import {
  flattenTree,
  collectMatchingLeafAncestors,
  filterTreeByMatchingLeaves,
  getAncestorKeys,
  findNode,
} from './utils';
import { useTreeReducer } from './useTreeReducer';
import { useDragDrop } from './useDragDrop';
import { TreeRow } from './TreeRow';
import { useTreeTheme } from './useTreeTheme';

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

export function VirtualTree({
  className = '',
  searchPlaceholder = '搜索叶子节点',
  getSearchText,
  renderToolbar,
  defaultTreeData,
  renderLeafContent,
  renderBranchContent,
  onSelect,
  onSave,
  onCancel,
  height,
  rowHeight = 36,
}: VirtualTreeProps) {
  const treeTheme = useTreeTheme();
  const { state, dispatch } = useTreeReducer(defaultTreeData);
  const { draft, isEditing, isDirty, editingKey } = state;

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCollapse, setSearchCollapse] = useState<{
    query: string;
    keys: Set<string>;
  }>({ query: '', keys: new Set() });
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  const parentScrollRef = useRef<HTMLDivElement | null>(null);

  // 超过指针移动阈值才开始拖拽；结束或取消时 activeDragKey 会清空。
  const {
    sensors,
    activeDragKey,
    dropIndicator,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useDragDrop(draft, (dragKey, overKey, position) =>
    dispatch({ type: 'MOVE_NODE', dragKey, overKey, position }),
  );

  const normalizedSearchQuery = searchQuery.trim();

  const filteredTree = useMemo(
    () => filterTreeByMatchingLeaves(draft, normalizedSearchQuery, getSearchText),
    [draft, normalizedSearchQuery, getSearchText],
  );

  const searchAncestorKeys = useMemo(
    () => collectMatchingLeafAncestors(draft, normalizedSearchQuery, getSearchText),
    [draft, normalizedSearchQuery, getSearchText],
  );

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

  const hoverExpandKey =
    activeDragKey !== null &&
    dropIndicator !== null &&
    dropIndicator.position === 'inside' &&
    !effectiveExpandedKeys.has(dropIndicator.overKey) &&
    findNode(draft, dropIndicator.overKey)?.type === 'branch'
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

  const virtualizer = useVirtualizer({
    count: flat.length,
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
    if (!selectedKey || !findNode(draft, selectedKey)) return;
    // 被过滤的选中节点需要先恢复可见；命中节点则仅重新展开路径。
    if (!findNode(filteredTree, selectedKey)) setSearchQuery('');
    const ancestors = getAncestorKeys(draft, selectedKey);
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
  const handleAddBranch = () => dispatch({ type: 'ADD_BRANCH' });

  const handleQuickMove = (key: string) => {
    const node = findNode(draft, key);
    if (!node || !isEditing) return;
    const ancestors = getAncestorKeys(draft, key);
    let destinationKey: string | null = ancestors[0] ?? null;
    const { destinationKeys, treeData } = buildDirectoryDestinations(draft, key);
    const currentPath = [
      '根节点',
      ...[...ancestors]
        .reverse()
        .map((ancestor) => findNode(draft, ancestor)?.title || '未命名分组'),
    ].join(' / ');
    Modal.confirm({
      title: '快速移动',
      icon: <span aria-hidden="true" className="i-lucide-folder text-5.5 mr-3" />,
      width: 560,
      centered: true,
      content: (
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
      ),
      okText: '确认移动',
      cancelText: '取消',
      onOk: () => {
        dispatch({ type: 'QUICK_MOVE', key, destinationKey });
        // 展开目标及其祖先，让移动后的节点可见。
        if (destinationKey !== null) {
          const targetKeys = [destinationKey, ...getAncestorKeys(draft, destinationKey)];
          setExpandedKeys((prev) => new Set([...prev, ...targetKeys]));
        }
      },
    });
  };

  const handleDelete = (key: string) => {
    const node = findNode(draft, key);
    if (node && node.type === 'branch' && node.children.length > 0) {
      const ancestors = getAncestorKeys(draft, key);
      let destinationKey: string | null = ancestors[0] ?? null;
      const { destinationKeys, treeData } = buildDirectoryDestinations(draft, key);
      const directoryPath = [...ancestors]
        .reverse()
        .map((ancestor) => findNode(draft, ancestor)?.title || '未命名分组');
      directoryPath.push(node.title || '未命名分组');
      Modal.confirm({
        title: '删除分组',
        width: 560,
        centered: true,
        content: (
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
        ),
        okText: '删除并移动',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => dispatch({ type: 'DELETE_BRANCH', key, destinationKey }),
      });
    } else {
      dispatch({ type: 'DELETE_BRANCH', key });
    }
  };

  const handleSave = () => {
    dispatch({ type: 'SAVE' });
    onSave?.(draft);
  };

  const handleCancel = () => {
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

  const activeDragNode = activeDragKey ? findNode(draft, activeDragKey) : null;
  const dropTarget = dropIndicator ? findNode(draft, dropIndicator.overKey) : null;
  const dropParentKey = dropTarget ? getAncestorKeys(draft, dropTarget.key)[0] : null;
  const dropParentTitle = dropParentKey ? findNode(draft, dropParentKey)?.title : '根目录';
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
    >
      {renderToolbar?.({
        selectedKey,
        locateSelected: handleLocate,
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

      <div ref={parentScrollRef} className="tree-scroll-viewport flex-1 overflow-auto relative">
        {flat.length === 0 && (
          <div className="tree-empty" role="status">
            未找到匹配的应用
          </div>
        )}
        <DndContext
          sensors={sensors}
          measuring={dragMeasuring}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
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
                  index={virtualItem.index}
                  virtualStart={virtualItem.start}
                  isExpanded={effectiveExpandedKeys.has(node.key)}
                  isSelected={selectedKey === node.key}
                  isRenaming={editingKey === node.key}
                  isHighlighted={highlightedKey === node.key}
                  isEditing={isEditing}
                  isDragging={activeDragKey === node.key}
                  isDragActive={activeDragKey !== null}
                  searchQuery={normalizedSearchQuery}
                  dropIndicator={dropIndicator}
                  rowHeight={rowHeight}
                  dropAfterOffset={(afterIndex - virtualItem.index) * rowHeight}
                  renderLeafContent={renderLeafContent}
                  renderBranchContent={renderBranchContent}
                  onToggleExpand={toggleExpand}
                  onSelect={handleSelect}
                  onStartRename={(key) => dispatch({ type: 'START_RENAME', key })}
                  onCommitRename={(key, title) => dispatch({ type: 'RENAME_BRANCH', key, title })}
                  onCancelRename={() => dispatch({ type: 'CANCEL_RENAME' })}
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
              <div aria-hidden="true" className="tree-drag-preview">
                <div className="tree-drag-hint">{dropDescription}</div>
                <span className="tree-drag-preview-icon">
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
                  <span className="tree-drag-preview-count">
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

