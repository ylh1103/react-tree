/** 分栏的轻量展示层：共用几何结构与主题，不包含控件、尺寸观察、拖拽或存储写入。 */
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';

export interface SplitPaneFrameProps {
  sidebar: ReactNode;
  sidebarLabel: string;
  sidebarId?: string;
  expanded: boolean;
  /** 骨架使用 CSS 限制宽度，交互分栏传入测量后的像素值。 */
  width: number | string;
  titleContent: ReactNode;
  toolbar?: ReactNode;
  integratedHeader?: boolean;
  containerProps?: ComponentPropsWithRef<'div'>;
  separator: ReactNode;
  children: ReactNode;
}

export function SplitPaneFrame({
  sidebar,
  sidebarLabel,
  sidebarId,
  expanded,
  width,
  titleContent,
  toolbar,
  integratedHeader = false,
  containerProps,
  separator,
  children,
}: SplitPaneFrameProps) {
  const { layoutMode } = useLayoutPreferences();
  const compact = layoutMode === 'compact';
  return (
    <div
      {...containerProps}
      data-split-pane
      data-sidebar-expanded={expanded}
      className={`flex w-full h-full min-h-0 min-w-0 overflow-hidden bg-canvas ${containerProps?.className ?? ''}`}
    >
      <aside
        id={sidebarId}
        className={`shrink-0 min-w-0 overflow-auto bg-sidebar ${compact ? 'rounded-0' : 'workspace-frame'}`}
        hidden={!expanded}
        style={{ width }}
        aria-label={sidebarLabel}
      >
        {sidebar}
      </aside>
      {separator}
      <section
        className={`flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden ${integratedHeader ? (compact ? 'bg-surface rounded-0' : 'workspace-panel') : `gap-layout ${compact ? 'bg-surface rounded-0' : 'bg-canvas'}`}`}
        aria-label="页面内容"
      >
        <div
          className={`workspace-collection-titlebar ${
            integratedHeader
              ? `workspace-titlebar-layout ${compact ? '' : 'workspace-titlebar-frame-edge'}`
              : compact
                ? 'workspace-titlebar'
                : 'workspace-titlebar-detached'
          }`}
        >
          <div className="workspace-title-identity shrink! flex-[0_1_220px]!">{titleContent}</div>
          {toolbar}
        </div>
        <div
          className={`layout-scroll ${compact || integratedHeader ? '' : 'rounded-ui bg-surface'}`}
        >
          {children}
        </div>
      </section>
    </div>
  );
}
