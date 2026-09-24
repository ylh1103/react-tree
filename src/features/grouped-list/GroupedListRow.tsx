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
  rowGap: number;
  dropLine: { position: DropIndicator['position']; depth: number } | null;
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
  rowGap,
  dropLine,
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
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
  const [hasContentFocus, setHasContentFocus] = useState(false);
  const leafKind = node.type === 'leaf' ? node.data[config.typeField] : undefined;
  const leafColor = leafKind === undefined ? undefined : config.types[leafKind]?.color;

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

  const showBefore = dropLine?.position === 'before';
  const showAfter = dropLine?.position === 'after';
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
      {/* 仅拖拽时覆盖上下各半个 gap；命中仍归属当前节点，测量保持真实行高。 */}
      {isDragActive && (
        <div
          aria-hidden="true"
          className="absolute left-0 right-0"
          style={{ top: -rowGap / 2, bottom: -rowGap / 2 }}
        />
      )}
      <div
        data-leaf-type-color={!isRenaming ? leafColor : undefined}
        data-keyboard-focus={hasKeyboardFocus || undefined}
        onFocusCapture={(event) => {
          const visible = event.target.matches(':focus-visible');
          setHasKeyboardFocus(visible);
          setHasContentFocus(visible && event.target.matches('.application-content, .group-name'));
        }}
        onBlurCapture={() => {
          setHasKeyboardFocus(false);
          setHasContentFocus(false);
        }}
        onPointerDownCapture={() => {
          setHasKeyboardFocus(false);
          setHasContentFocus(false);
        }}
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
          isSelected ? 'tree-row-selected' : '',

          isEditing ? 'tree-row-editing cursor-grab!' : '',
        ].join(' ')}
        style={{ paddingLeft: depth * INDENT + 8, paddingRight: 8 }}
      >
        {(showBefore || showAfter) && (
          <div
            className="tree-drop-line absolute right-5 h-0.5 bg-[var(--accent)] pointer-events-none z-5"
            style={{
              left: (dropLine?.depth ?? depth) * INDENT + 24,
              top: showBefore ? -rowGap / 2 : `calc(100% + ${rowGap / 2}px)`,
              transform: 'translateY(-50%)',
            }}
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
            className="tree-switcher-button flex items-center justify-center w-7 min-w-7 h-full -ml-2 -mr-1 text-[#8a9aa3] p-0 border-0 bg-transparent [font:inherit] cursor-pointer rounded-[var(--tree-focus-radius,6px)] shrink-0 hover:text-[var(--accent)] hover:bg-[var(--accent-bg)]"
          >
            <span
              aria-hidden="true"
              className={`i-lucide-chevron-right transition-transform duration-150 motion-reduce:transition-none ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="mr-1 w-3 min-w-3 h-4 inline-block" />
        )}

        <div
          className={`tree-node-card flex-1 flex items-center min-w-0 gap-1.5 h-full px-2.5 border border-solid border-[#e3e9ed] rounded-[6px] bg-white [transition-property:background,border-color,box-shadow] duration-150 motion-reduce:transition-none ${isBranch ? 'py-1.75' : 'py-1 border-l-2 border-l-[var(--accent)]'}`}
          data-has-actions={!isRenaming || undefined}
          data-menu-open={isMenuOpen || undefined}
          data-has-badge={
            (!isRenaming && leafKind !== undefined && leafKind === config.badgeType) || undefined
          }
          data-content-focus={hasContentFocus || undefined}
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
            <span
              className={`tree-node-content flex-1 whitespace-nowrap text-ellipsis text-sm min-w-0 ${isBranch ? 'overflow-hidden' : 'overflow-visible'}`}
            >
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
    part.match ? (
      <mark className="bg-[#fff1f0] text-[#cf1322] rounded-[2px]" key={index}>
        {part.text}
      </mark>
    ) : (
      <span key={index}>{part.text}</span>
    ),
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
          <div className="max-w-[min(320px,calc(100vw-48px))] whitespace-normal [overflow-wrap:anywhere] leading-[1.6]">
            <div className="font-600">
              <Highlight text={node.title} query={searchQuery} />
            </div>
            {description && (
              <div className="mt-1 text-[12px]">
                <Highlight text={description} query={searchQuery} />
              </div>
            )}
          </div>
        ) : null
      }
    >
      <span
        className="application-content flex items-center gap-2.25 min-w-0 w-full"
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
          icon={
            <span
              aria-hidden="true"
              className="i-lucide-settings shrink-0 text-[var(--accent)] text-[18px]"
            />
          }
        />
        <span className="flex-1 min-w-0 flex flex-col gap-0">
          <span className="flex items-center min-w-0">
            <span
              ref={nameRef}
              className="min-w-0 text-[13px] font-[550] leading-[18px] overflow-hidden text-ellipsis"
            >
              <Highlight text={node.title} query={searchQuery} />
            </span>
            {kind === config.badgeType && (
              <span
                className="leaf-type-badge absolute top-0 right-0 z-1 inline-flex items-center justify-center w-5 h-4.5 rounded-[0_5px_0_7px] p-0 text-[11px] font-600 leading-none text-[var(--leaf-type-text)] bg-[var(--leaf-type-bg)] cursor-help"
                data-color={typeColor}
                title={typeLabel}
                role="img"
                aria-label={typeLabel}
              >
                {typeShortLabel}
              </span>
            )}
          </span>
          <span
            ref={descriptionRef}
            className="text-[#75838d] text-[11px] leading-4 overflow-hidden text-ellipsis"
          >
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
    <span className="flex items-center gap-2.25 min-w-0 w-full">
      <span
        aria-hidden="true"
        className={`shrink-0 text-[#77939e] text-[16px] ${expanded ? 'i-lucide-folder-open' : 'i-lucide-folder'}`}
      />
      <Tooltip
        trigger={showTooltip ? ['hover', 'focus'] : []}
        placement="right"
        open={showTooltip ? undefined : false}
        mouseEnterDelay={0.3}
        destroyOnHidden
        title={
          isOverflowing ? (
            <div className="max-w-[min(320px,calc(100vw-48px))] whitespace-normal [overflow-wrap:anywhere] leading-[1.6]">
              {node.title}
            </div>
          ) : null
        }
      >
        <span
          ref={nameRef}
          className="group-name min-w-0 overflow-hidden text-ellipsis text-[13px] font-500"
          tabIndex={showTooltip ? 0 : undefined}
        >
          {node.title}
        </span>
      </Tooltip>
      <span className="group-count ml-auto shrink-0 text-[#7d8e98] bg-[#f1f5f7] rounded-1 px-1.5 text-[11px] leading-[19px] tabular-nums">
        {node.children.length}
      </span>
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
