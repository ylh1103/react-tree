/** 分栏拖拽线共用外观：普通布局使用点状手柄，紧凑布局使用细线；延迟悬停与拖动高亮保持一致。 */
export function splitPaneSeparatorClassName({
  compact,
  expanded = true,
  readOnly = false,
  upper = 1,
  hovered,
  dragging,
}: {
  compact: boolean;
  expanded?: boolean;
  readOnly?: boolean;
  upper?: number;
  hovered: boolean;
  dragging: boolean;
}) {
  return `layout-focus relative z-1 ${readOnly ? 'cursor-default' : 'cursor-ew-resize touch-none'} transition-colors duration-100 ease-out [&.hover]:bg-accent [&.active]:bg-accent [&.hover]:after:opacity-0 [&.active]:after:opacity-0 focus-visible:bg-accent focus-visible:after:opacity-0 ${compact ? `flex-[0_0_1px] rounded-0 bg-divider before:content-[''] before:absolute before:inset-y-0 before:left-1/2 before:translate-x-[-50%] before:w-4px before:transition-colors before:duration-100 [&.hover]:before:bg-accent [&.active]:before:bg-accent [&:focus-visible:not([aria-disabled=true])]:before:bg-accent ${expanded ? '' : 'basis-0! bg-transparent!'}` : 'flex-[0_0_var(--layout-gap)] rounded-ui bg-transparent'} ${upper > 0 && !compact ? `after:content-[''] after:absolute after:pointer-events-none after:top-1/2 after:left-1/2 after:translate-x-[-50%] after:translate-y-[-50%] after:w-2px after:h-2px after:rounded-full after:bg-handle after:text-handle after:[box-shadow:0_-5px_currentColor,0_5px_currentColor]` : ''} ${upper > 0 && hovered ? 'hover' : ''} ${upper > 0 && dragging ? 'active' : ''}`;
}
