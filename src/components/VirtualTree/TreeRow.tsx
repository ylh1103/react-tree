import { useEffect, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button, Dropdown, Input, type InputRef } from 'antd';
import type { BranchNode, DropIndicator, FlatNode, LeafNode } from './types';
import { highlightText } from './utils';

const INDENT = 20;

interface TreeRowProps {
  flatNode: FlatNode;
  index: number;
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
  renderLeafContent?: (
    node: LeafNode,
    ctx: { selected: boolean; searchQuery: string; isDragActive: boolean },
  ) => React.ReactNode;
  renderBranchContent?: (node: BranchNode, ctx: { expanded: boolean; isDragActive: boolean }) => React.ReactNode;
  onToggleExpand: (key: string) => void;
  onSelect: (key: string, node: LeafNode) => void;
  onStartRename: (key: string) => void;
  onCommitRename: (key: string, title: string) => void;
  onCancelRename: () => void;
  onDelete: (key: string) => void;
  onQuickMove: (key: string) => void;
  virtualStart: number;
}

export function TreeRow({
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
  renderLeafContent,
  renderBranchContent,
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
      onSelect(node.key, node);
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
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
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
            className="tree-drop-line"
            style={{ left: depth * INDENT + 24, top: showBefore ? 0 : dropAfterOffset }}
            aria-hidden="true"
          >
            <span className="tree-drop-dot" />
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
            className="tree-switcher tree-switcher-button mr-1 flex items-center justify-center w-4 h-4 text-gray-500"
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

        <span className="tree-node-icon mr-1.5 text-gray-400 flex items-center">
          <span aria-hidden="true" className={isBranch ? 'i-lucide-folder' : 'i-lucide-file'} />
        </span>

        <div
          className="tree-node-card flex-1"
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
            <span className="tree-node-content flex-1 truncate text-sm">
              {isBranch
                ? renderBranchContent
                  ? renderBranchContent(node as BranchNode, {
                      expanded: isExpanded,
                      isDragActive,
                    })
                  : node.title
                : renderLeafContent
                  ? renderLeafContent(node as LeafNode, {
                      selected: isSelected,
                      isDragActive,
                      searchQuery,
                    })
                  : highlightText(node.title, searchQuery).map((part, i) =>
                      part.match ? (
                        <mark key={i} className="bg-yellow-200 text-inherit rounded-sm px-0.5">
                          {part.text}
                        </mark>
                      ) : (
                        <span key={i}>{part.text}</span>
                      ),
                    )}
            </span>
          )}

          {isEditing && !isRenaming && (
            <div
              className="tree-node-actions"
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
                      : []),
                  ],
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation();
                    if (key === 'move') onQuickMove(node.key);
                    if (key === 'rename') onStartRename(node.key);
                    if (key === 'delete') onDelete(node.key);
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
}

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
