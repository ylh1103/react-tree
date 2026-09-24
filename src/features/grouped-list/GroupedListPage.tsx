import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Alert, Button, Input, Spin, theme } from 'antd';
import type {
  LeafNode,
  DropIndicator,
  GroupedListConfig,
  ListNodeActions,
  GroupedListService,
} from './types';
import { useGroupedList } from './useGroupedList';
import { GroupedListToolbar } from './GroupedListToolbar';
import { GroupedListRow } from './GroupedListRow';
import { flattenTree, buildTreeIndex, deriveTreeView, findNode } from './treeUtils';
import { useTreeReducer, useTreeActions } from './useGroupEditing';
import { useDragDrop } from './useDragDrop';
import { useTreeExpansion } from './useTreeExpansion';
import { offsetDragPreview } from './dragPreview';
import './GroupedList.css';

// translateY 是虚拟行的布局位置，测量时必须保留，不能作为拖拽位移扣除。
const dragMeasuring = {
  draggable: {
    measure: (element: HTMLElement) => element.getBoundingClientRect(),
  },
};

const ROW_HEIGHT = 56;
const getSearchText = (node: LeafNode) => `${node.title} ${node.data.desc ?? ''}`;

/** 参数和应用列表内部使用，不提供通用渲染插槽。 */
export function GroupedListPage({
  service,
  config,
  onSettings,
  onDelete,
}: ListNodeActions & {
  service: GroupedListService;
  config: GroupedListConfig;
}) {
  // TanStack Virtual 实例内部可变，暂不参与 Compiler 自动缓存；兼容后移除。
  'use no memo';

  const {
    treeData,
    ready,
    busy: disabled,
    loading,
    error,
    refresh,
    save: onSave,
    runNodeAction,
  } = useGroupedList(service);
  const { token } = theme.useToken();
  const treeTheme = {
    '--tree-focus-color': token.colorPrimaryBorder,
    '--tree-focus-width': `${token.lineWidthFocus}px`,
    '--tree-focus-radius': `${token.borderRadius}px`,
    '--accent': token.colorPrimary,
    '--accent-hover': token.colorPrimaryHover,
    '--accent-border': token.colorPrimaryBorder,
    '--accent-bg': token.colorPrimaryBg,
    '--accent-bg-hover': token.colorPrimaryBgHover,
    '--accent-text': token.colorPrimaryText,
  } as CSSProperties;
  const [typeFilter, setTypeFilter] = useState<'all' | '0' | '1'>('all');
  const matchesType = useCallback(
    (node: LeafNode) => node.data[config.typeField] === typeFilter,
    [config.typeField, typeFilter],
  );
  const filterLeaf = typeFilter === 'all' ? undefined : matchesType;
  const getLeafCategory = useCallback(
    (node: LeafNode) => node.data[config.typeField] ?? 'unknown',
    [config.typeField],
  );
  const handleSettings = useCallback(
    (node: LeafNode) => {
      if (onSettings) void runNodeAction(onSettings, node.data);
    },
    [onSettings, runNodeAction],
  );
  const handleDeleteLeaf = useCallback(
    (node: LeafNode) => {
      if (onDelete) void runNodeAction(onDelete, node.data);
    },
    [onDelete, runNodeAction],
  );
  const { state, dispatch } = useTreeReducer(treeData);
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
    [draft, normalizedSearchQuery, filterLeaf, isEditing, getLeafCategory],
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
  } = useTreeActions({ state, dispatch, treeIndex, disabled, onSave, expandPath });

  const flat = useMemo(
    () => flattenTree(filteredTree, effectiveExpandedKeys),
    [filteredTree, effectiveExpandedKeys],
  );

  // 排序、搜索会改变行索引，使用业务 key 保持虚拟行与节点身份一致。
  const getItemKey = useCallback((index: number) => flat[index].node.key, [flat]);
  // eslint-disable-next-line react-hooks/incompatible-library -- 本组件已用 use no memo 退出自动缓存，虚拟行在每次渲染时直接读取。
  const virtualizer = useVirtualizer({
    count: flat.length,
    getItemKey,
    getScrollElement: () => parentScrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

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
        setTypeFilter('all');
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
  const handleAddBranch = () => dispatch({ type: 'ADD_BRANCH', title: `${config.label}分组` });
  const commitRename = useCallback(
    (key: string, title: string) => dispatch({ type: 'RENAME_BRANCH', key, title }),
    [dispatch],
  );
  const cancelRename = useCallback(() => dispatch({ type: 'CANCEL_RENAME' }), [dispatch]);

  return (
    <main className="parameter-demo" style={treeTheme} aria-busy={disabled}>
      {error && (
        <Alert
          type="error"
          showIcon
          title={ready ? error : '列表加载失败'}
          description={ready ? undefined : error}
          action={
            !ready && (
              <Button onClick={refresh} disabled={disabled}>
                重试
              </Button>
            )
          }
        />
      )}
      {ready && (
        <div
          className="virtual-tree application-tree flex flex-col overflow-hidden"
          aria-busy={isSaving || disabled}
          inert={isSaving || disabled}
        >
          {saveError && <Alert type="error" showIcon title={saveError} />}
          <GroupedListToolbar
            config={config}
            busy={disabled}
            refresh={refresh}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            context={{
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
            }}
          />
          <div className="tree-search flex items-center gap-2 p-2 border-b border-gray-200 bg-white">
            <Input.Search
              placeholder={`请输入${config.label}名称或描述`}
              aria-label={`请输入${config.label}名称或描述`}
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
                {normalizedSearchQuery || filterLeaf ? '未找到匹配的结果' : `暂无${config.label}`}
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
                    <GroupedListRow
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
                      rowHeight={ROW_HEIGHT}
                      dropAfterOffset={(afterIndex - virtualItem.index) * ROW_HEIGHT}
                      config={config}
                      onSettings={!isEditing && onSettings ? handleSettings : undefined}
                      onDeleteLeaf={!isEditing && onDelete ? handleDeleteLeaf : undefined}
                      onToggleExpand={toggleExpand}
                      onSelect={setSelectedKey}
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
      )}
      {loading && (
        <div className="list-loading" aria-label={`正在加载${config.label}列表`}>
          <Spin />
        </div>
      )}
    </main>
  );
}

const dragPreviewModifiers = [offsetDragPreview];

function TreeDragPreview({
  activeDragKey,
  dropIndicator,
  treeIndex,
}: {
  activeDragKey: string | null;
  dropIndicator: DropIndicator | null;
  treeIndex: ReturnType<typeof buildTreeIndex>;
}) {
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
    <DragOverlay
      modifiers={dragPreviewModifiers}
      dropAnimation={null}
      // 与 modifier 共用视口原点，不使用会随展开、滚动变化的源节点矩形。
      style={{ top: 0, left: 0, pointerEvents: 'none', width: 'max-content' }}
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
  );
}
