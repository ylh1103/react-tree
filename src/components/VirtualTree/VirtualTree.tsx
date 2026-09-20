import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext } from '@dnd-kit/core';
import { Alert, Button, Input, Space, Tooltip } from 'antd';
import type { LeafNode, VirtualTreeProps } from './types';
import { flattenTree, buildTreeIndex, deriveTreeView, findNode } from './utils';
import { useTreeReducer } from './useTreeReducer';
import { useDragDrop } from './useDragDrop';
import { TreeRow } from './TreeRow';
import { TreeDragPreview } from './TreeDragPreview';
import { useTreeTheme } from './useTreeTheme';
import { useTreeActions } from './useTreeActions';
import { useTreeExpansion } from './useTreeExpansion';
import './VirtualTree.css';

// translateY 是虚拟行的布局位置，测量时必须保留，不能作为拖拽位移扣除。
const dragMeasuring = {
  draggable: {
    measure: (element: HTMLElement) => element.getBoundingClientRect(),
  },
};

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
  const { draft, isEditing, editingKey } = state;
  const treeIndex = useMemo(() => buildTreeIndex(draft, getLeafCategory), [draft, getLeafCategory]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  if (selectedKey !== null && !treeIndex.nodeByKey.has(selectedKey)) {
    setSelectedKey(null);
  }
  const [searchQuery, setSearchQuery] = useState('');
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

  const {
    effectiveExpandedKeys,
    allExpanded,
    setAllExpanded,
    toggleExpand,
    expandPath,
    resetSearchCollapse,
  } = useTreeExpansion({
    draft,
    treeIndex,
    normalizedSearchQuery,
    searchAncestorKeys,
    visibleBranchKeys,
    activeDragKey,
    dropIndicator,
  });

  const {
    isSaving,
    saveError,
    handleStartRename,
    handleQuickMove,
    handleDelete,
    handleSave,
    handleCancel,
  } = useTreeActions({ state, dispatch, treeIndex, disabled, onSave, onCancel, expandPath });

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
    expandPath(treeIndex.ancestors(selectedKey));
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
              resetSearchCollapse(query.trim());
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
          <TreeDragPreview
            activeDragKey={activeDragKey}
            dropIndicator={dropIndicator}
            treeIndex={treeIndex}
          />
        </DndContext>
      </div>
    </div>
  );
}
