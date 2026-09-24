import { memo, useEffect, useRef, useState, type RefObject } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button, Dropdown, Input, Tooltip, type InputRef } from 'antd';
import type { BranchNode, DropIndicator, FlatNode, LeafNode, GroupedListConfig } from './types';
import { highlightText } from './treeUtils';

const INDENT = 20;

interface TreeRowProps {
  flatNode: FlatNode;
  isExpanded: boolean;
  isSelected: boolean;
  isRenaming: boolean;
  isHighlighted: boolean;
  isEditing: boolean;
  isDragging: boolean;
  isDragActive: boolean;
  searchQuery: string;
  dropIndicator: DropIndicator | null;
  rowHeight: number;
  dropAfterOffset: number;
  config: GroupedListConfig;
  onSettings?: (node: LeafNode) => void;
  onDeleteLeaf?: (node: LeafNode) => void;
  onToggleExpand: (key: string) => void;
  onSelect: (key: string) => void;
  onStartRename: (key: string) => void;
  onCommitRename: (key: string, title: string) => void;
  onCancelRename: () => void;
  onDelete: (key: string) => void;
  onQuickMove: (key: string) => void;
  virtualStart: number;
}

export const GroupedListRow = memo(function GroupedListRow({
  flatNode,
  isExpanded,
  isSelected,
  isRenaming,
  isHighlighted,
  isEditing,
  isDragging,
  isDragActive,
  searchQuery,
  dropIndicator,
  rowHeight,
  dropAfterOffset,
  config,
  onSettings,
  onDeleteLeaf,
  onToggleExpand,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDelete,
  onQuickMove,
  virtualStart,
}: TreeRowProps) {
  const { node, depth } = flatNode;
  const isBranch = node.type === 'branch';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
  } = useDraggable({
    id: node.key,
    disabled: !isEditing,
  });

  const handleRowClick = () => {
    // 编辑态下整行都是拖拽手柄（见下方 listeners/attributes 的绑定），
    // 所以点击不再触发选中/展开，避免和拖拽手势冲突；展开箭头单独处理，见下方图标的 onClick。
    if (isEditing) return;
    if (node.type === 'leaf') {
      onSelect(node.key);
    } else {
      onToggleExpand(node.key);
    }
  };

  const showBefore = dropIndicator?.overKey === node.key && dropIndicator.position === 'before';
  const showAfter = dropIndicator?.overKey === node.key && dropIndicator.position === 'after';
  const showInside = dropIndicator?.overKey === node.key && dropIndicator.position === 'inside';

  return (
    <div
      ref={setDragRef}
      // data-node-key 供 useDragDrop 的 elementFromPoint 命中测试读取，
      // 用来在拖拽过程中识别指针当前悬停在哪一行上。
      data-node-key={node.key}
      data-node-type={node.type}
      className="absolute top-0 left-0 w-full"
      style={{
        height: rowHeight,
        transform: `translateY(${virtualStart}px)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: showBefore || showAfter || showInside ? 2 : undefined,
      }}
      // 只在编辑态下绑定拖拽监听，非编辑态整行保持普通的点击交互。
      {...(isEditing ? { ...listeners, ...attributes } : {})}
    >
      <div
        onClick={handleRowClick}
        role={isEditing ? undefined : 'button'}
        tabIndex={isEditing ? undefined : 0}
        aria-expanded={isBranch ? isExpanded : undefined}
        aria-label={node.title}
        onKeyDown={(event) => {
          if (
            event.target === event.currentTarget &&
            (event.key === 'Enter' || event.key === ' ')
          ) {
            event.preventDefault();
            handleRowClick();
          }
        }}
        className={[
          'tree-row flex items-center h-full cursor-pointer select-none relative',
          isSelected ? 'tree-row-selected' : 'hover:bg-gray-50',

          isEditing ? 'tree-row-editing cursor-grab!' : '',
        ].join(' ')}
        style={{ paddingLeft: depth * INDENT + 8, paddingRight: 8 }}
      >
        {(showBefore || showAfter) && (
          <div
            className="tree-drop-line absolute right-5 h-0.5 bg-[var(--accent)] pointer-events-none z-5"
            style={{ left: depth * INDENT + 24, top: showBefore ? 0 : dropAfterOffset }}
            aria-hidden="true"
          >
            <span className="tree-drop-dot absolute -left-1 -top-0.75 w-2 h-2 border-2 border-solid border-[var(--accent)] bg-white rounded-full" />
          </div>
        )}

        {isBranch ? (
          <button
            type="button"
            aria-label={`${isExpanded ? '收起' : '展开'} ${node.title}`}
            aria-expanded={isExpanded}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand(node.key);
            }}
            className="tree-switcher tree-switcher-button mr-1 flex items-center justify-center w-4 h-4 text-gray-500 p-0 border-0 bg-transparent [font:inherit] cursor-pointer rounded shrink-0"
          >
            <span
              aria-hidden="true"
              className="i-lucide-chevron-right"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.15s',
              }}
            />
          </button>
        ) : (
          <span className="tree-switcher mr-1 w-4 h-4 inline-block" />
        )}

        <div
          className="tree-node-card flex-1 flex items-center min-w-0 gap-1.5"
          data-drop-inside={showInside || undefined}
          data-locate-highlighted={isHighlighted || undefined}
        >
          {isRenaming ? (
            <RenameInput
              key={JSON.stringify([node.key, node.title])}
              initialTitle={node.title}
              onCommit={(title) => onCommitRename(node.key, title)}
              onCancel={onCancelRename}
            />
          ) : (
            <span className="tree-node-content flex-1 truncate text-sm min-w-0">
              {node.type === 'branch' ? (
                <GroupContent node={node} expanded={isExpanded} isDragActive={isDragActive} />
              ) : (
                <GroupedLeaf
                  node={node}
                  config={config}
                  searchQuery={searchQuery}
                  isDragActive={isDragActive}
                  onSettings={onSettings}
                />
              )}
            </span>
          )}

          {!isRenaming && (
            <div
              className="tree-node-actions flex items-center shrink-0 cursor-default"
              data-menu-open={isMenuOpen || undefined}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <Dropdown
                trigger={['click']}
                onOpenChange={setIsMenuOpen}
                placement="bottomRight"
                disabled={isDragActive}
                menu={{
                  items: [
                    {
                      key: 'move',
                      label: '快速移动',
                      icon: <span aria-hidden="true" className="i-lucide-folder-input" />,
                    },
                    ...(isBranch
                      ? [
                          {
                            key: 'rename',
                            label: '重命名',
                            icon: <span aria-hidden="true" className="i-lucide-pencil" />,
                          },
                          {
                            key: 'delete',
                            label: '删除分组',
                            danger: true,
                            icon: <span aria-hidden="true" className="i-lucide-trash-2" />,
                          },
                        ]
                      : [
                          {
                            key: 'settings',
                            label: `设置${config.label}`,
                            disabled: !onSettings,
                            icon: <span aria-hidden="true" className="i-lucide-settings" />,
                          },
                          {
                            key: 'delete-leaf',
                            label: `删除${config.label}`,
                            disabled: !onDeleteLeaf,
                            danger: true,
                            icon: <span aria-hidden="true" className="i-lucide-trash-2" />,
                          },
                        ]),
                  ],
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation();
                    if (key === 'move') onQuickMove(node.key);
                    if (isBranch && key === 'rename') onStartRename(node.key);
                    if (isBranch && key === 'delete') onDelete(node.key);
                    if (node.type === 'leaf' && key === 'settings') onSettings?.(node);
                    if (node.type === 'leaf' && key === 'delete-leaf') onDeleteLeaf?.(node);
                  },
                }}
              >
                <Button
                  type="text"
                  size="small"
                  aria-label={`更多操作 ${node.title}`}
                  aria-haspopup="menu"
                  disabled={isDragActive}
                  icon={<span aria-hidden="true" className="i-lucide-ellipsis" />}
                />
              </Dropdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// 每次进入重命名时挂载，草稿通过初始值创建，无需在 effect 中同步。
function RenameInput({
  initialTitle,
  onCommit,
  onCancel,
}: {
  initialTitle: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
}) {
  const [inputValue, setInputValue] = useState(initialTitle);
  const inputRef = useRef<InputRef>(null);
  const isNameEmpty = inputValue.trim().length === 0;

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus({ cursor: 'all' }));
    return () => cancelAnimationFrame(frame);
  }, []);

  const commitRename = () => {
    const title = inputValue.trim();
    if (!title) return;
    onCommit(title);
  };

  return (
    <Input
      ref={inputRef}
      size="small"
      value={inputValue}
      aria-label="分组名称"
      aria-invalid={isNameEmpty}
      status={isNameEmpty ? 'error' : undefined}
      suffix={
        isNameEmpty ? (
          <span role="alert" className="text-xs text-red-500">
            分组名称不能为空
          </span>
        ) : null
      }
      onChange={(e) => setInputValue(e.target.value)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onPressEnter={commitRename}
      onBlur={commitRename}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
      className="flex-1 max-w-xs"
    />
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  return highlightText(text, query).map((part, index) =>
    part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
  );
}

const GroupedLeaf = memo(function GroupedLeaf({
  node,
  searchQuery,
  isDragActive,
  config,
  onSettings,
}: {
  config: GroupedListConfig;
  onSettings?: (node: LeafNode) => void;
  node: LeafNode;
  searchQuery: string;
  isDragActive: boolean;
}) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const isOverflowing = useOverflow(
    [nameRef, descriptionRef],
    [node.title, searchQuery, node.data.desc],
  );
  const data = node.data;
  const description = data.desc ?? '';
  const kind = data[config.typeField];
  const metadata = kind === undefined ? undefined : config.types[kind];
  const typeLabel = metadata?.label ?? '未标注';
  const typeColor = metadata?.color;
  const typeShortLabel = metadata?.shortLabel ?? '?';

  const showTooltip = isOverflowing && !isDragActive;
  return (
    <Tooltip
      trigger={showTooltip ? ['hover', 'focus'] : []}
      placement="right"
      open={showTooltip ? undefined : false}
      mouseEnterDelay={0.3}
      destroyOnHidden
      title={
        isOverflowing ? (
          <div className="application-search-tooltip">
            <div className="tooltip-name">
              <Highlight text={node.title} query={searchQuery} />
            </div>
            {description && (
              <div className="tooltip-description">
                <Highlight text={description} query={searchQuery} />
              </div>
            )}
          </div>
        ) : null
      }
    >
      <span
        className="application-content"
        data-leaf-type-color={typeColor}
        tabIndex={showTooltip ? 0 : undefined}
      >
        <Button
          type="text"
          size="small"
          className="application-settings-button"
          aria-label={`设置 ${node.title}`}
          title="设置"
          disabled={isDragActive || !onSettings}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onSettings?.(node);
          }}
          icon={<span aria-hidden="true" className="application-gear i-lucide-settings" />}
        />
        <span className="application-copy">
          <span className="application-title-line">
            <span ref={nameRef} className="application-name">
              <Highlight text={node.title} query={searchQuery} />
            </span>
            {kind === config.badgeType && (
              <span
                className="leaf-type-badge"
                data-color={typeColor}
                title={typeLabel}
                role="img"
                aria-label={typeLabel}
              >
                {typeShortLabel}
              </span>
            )}
          </span>
          <span ref={descriptionRef} className="application-description">
            <Highlight text={description} query={searchQuery} />
          </span>
        </span>
      </span>
    </Tooltip>
  );
});

const GroupContent = memo(function GroupContent({
  node,
  expanded,
  isDragActive,
}: {
  node: BranchNode;
  expanded: boolean;
  isDragActive: boolean;
}) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const isOverflowing = useOverflow([nameRef], [node.title]);

  const showTooltip = isOverflowing && !isDragActive;
  return (
    <span className="group-content">
      <span aria-hidden="true" className={expanded ? 'i-lucide-folder-open' : 'i-lucide-folder'} />
      <Tooltip
        trigger={showTooltip ? ['hover', 'focus'] : []}
        placement="right"
        open={showTooltip ? undefined : false}
        mouseEnterDelay={0.3}
        destroyOnHidden
        title={
          isOverflowing ? <div className="application-search-tooltip">{node.title}</div> : null
        }
      >
        <span ref={nameRef} className="group-name" tabIndex={showTooltip ? 0 : undefined}>
          {node.title}
        </span>
      </Tooltip>
      <span className="group-count">{node.children.length}</span>
    </span>
  );
});

/** 仅对挂载的虚拟行测量；每次提交后测量内容，观察器仅跟踪元素宽度变化。 */
function useOverflow(refs: RefObject<HTMLSpanElement | null>[], content: unknown[]) {
  const [overflowing, setOverflowing] = useState(false);
  // 用内容签名稳定 effect 依赖，避免行重渲染时反复重建观察器。
  const signature = JSON.stringify(content);
  const first = refs[0];
  const second = refs[1];
  useEffect(() => {
    const elements = [first.current, second?.current].filter(
      (element): element is HTMLSpanElement => element != null,
    );
    const measure = () =>
      setOverflowing(elements.some((element) => element.scrollWidth > element.clientWidth));
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    elements.forEach((element) => observer.observe(element));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [first, second, signature]);
  return overflowing;
}
