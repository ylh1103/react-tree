import { memo, useRef } from 'react';
import { Button, Tooltip } from 'antd';
import type { BranchNode, LeafNode } from '../../components/VirtualTree';
import { highlightText } from '../../components/VirtualTree/utils';
import type { ListNode } from './model';
import type { GroupedListConfig } from './types';
import { useOverflow } from './useOverflow';

function Highlight({ text, query }: { text: string; query: string }) {
  return highlightText(text, query).map((part, index) =>
    part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
  );
}

export const GroupedLeaf = memo(function GroupedLeaf({
  node,
  searchQuery,
  isDragActive,
  config,
}: {
  config: GroupedListConfig;
  node: LeafNode;
  searchQuery: string;
  isDragActive: boolean;
}) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const isOverflowing = useOverflow(
    [nameRef, descriptionRef],
    [node.title, searchQuery, (node.data as ListNode).desc],
  );
  const data = node.data as ListNode;
  const description = data.desc ?? '';
  const kind = data[config.typeField];
  const metadata = kind === undefined ? undefined : config.types[kind];
  const typeLabel = metadata?.label ?? '未标注';
  const typeColor = metadata?.color;
  const typeShortLabel = metadata?.shortLabel ?? '?';

  const showTooltip = isOverflowing && !isDragActive;
  return (
    <Tooltip
      trigger={['hover', 'focus']}
      placement="right"
      open={showTooltip ? undefined : false}
      title={
        showTooltip ? (
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
          disabled={isDragActive}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
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

export const GroupContent = memo(function GroupContent({
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
        trigger={['hover', 'focus']}
        placement="right"
        open={showTooltip ? undefined : false}
        title={showTooltip ? <div className="application-search-tooltip">{node.title}</div> : null}
      >
        <span ref={nameRef} className="group-name" tabIndex={showTooltip ? 0 : undefined}>
          {node.title}
        </span>
      </Tooltip>
      <span className="group-count">{node.children.length}</span>
    </span>
  );
});
