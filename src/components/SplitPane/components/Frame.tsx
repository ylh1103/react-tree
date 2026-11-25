/** 分栏的轻量展示层：共用几何结构与主题，不包含控件、尺寸观察、拖拽或存储写入。 */
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';

// 交互容器与静态骨架共用紧凑分栏和窄屏单栏的宽度。
export const splitPaneCompactWidth = 720;
export const splitPaneSidebarRatio = 0.42;
export const splitPaneSingleWidth = 520;
export const responsiveSplitPaneClassName = 'h-full min-w-0 [container:split-pane/inline-size]';

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
  /** 极窄时只展示指定的一侧；宽屏仍按保存的分栏设置渲染。 */
  narrowPane?: 'sidebar' | 'content';
  /** 抽屉只改变侧栏定位，列表留在原本的 DOM 子树内。 */
  drawer?: {
    active: boolean;
    open: boolean;
    sidebarInert: boolean;
    ref: Ref<HTMLElement>;
    onClose: () => void;
  };
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
  narrowPane,
  drawer,
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
      data-sidebar-expanded={drawer?.active ? drawer.open : expanded}
      className={`flex w-full h-full min-h-0 min-w-0 overflow-hidden bg-canvas ${drawer ? 'relative isolate' : ''} ${narrowPane ? '[@container_split-pane_(max-width:520px)]:[&>aside+*]:hidden!' : ''} ${containerProps?.className ?? ''}`}
    >
      <aside
        ref={drawer?.ref}
        id={sidebarId}
        className={`
          shrink-0 min-w-0 overflow-auto bg-sidebar ${compact ? 'rounded-0' : 'workspace-frame'}
          ${narrowPane ? '[@container_split-pane_(max-width:720px)]:max-w-[42cqw] [@container_split-pane_(max-width:720px)]:[&_.workspace-collection-titlebar]:px-3!' : ''}
          ${narrowPane === 'sidebar' ? '[@container_split-pane_(max-width:520px)]:block! [@container_split-pane_(max-width:520px)]:w-full! [@container_split-pane_(max-width:520px)]:max-w-none!' : ''}
          ${!expanded && (narrowPane === 'sidebar' || drawer) ? 'hidden' : ''}
          ${narrowPane === 'content' && !drawer ? '[@container_split-pane_(max-width:520px)]:hidden!' : ''}
          ${
            narrowPane === 'content' && drawer
              ? `
            [@container_split-pane_(max-width:520px)]:absolute [@container_split-pane_(max-width:520px)]:inset-y-0 [@container_split-pane_(max-width:520px)]:left-0
            [@container_split-pane_(max-width:520px)]:z-20 [@container_split-pane_(max-width:520px)]:w-[min(400px,calc(100%_-_24px))]!
            [@container_split-pane_(max-width:520px)]:max-w-none! [@container_split-pane_(max-width:520px)]:flex! [@container_split-pane_(max-width:520px)]:flex-col
            [@container_split-pane_(max-width:520px)]:bg-surface [@container_split-pane_(max-width:520px)]:transition-[transform,visibility] [@container_split-pane_(max-width:520px)]:duration-200
            ${drawer.open ? '[@container_split-pane_(max-width:520px)]:visible [@container_split-pane_(max-width:520px)]:translate-x-0' : '[@container_split-pane_(max-width:520px)]:invisible [@container_split-pane_(max-width:520px)]:-translate-x-full'}
          `
              : ''
          }
        `}
        hidden={!expanded && narrowPane !== 'sidebar' && !drawer}
        inert={drawer?.sidebarInert}
        role={drawer?.open ? 'dialog' : undefined}
        tabIndex={drawer?.open ? -1 : undefined}
        style={{ width }}
        aria-label={sidebarLabel}
        onKeyDown={
          drawer?.open
            ? (event) => {
                if (event.key !== 'Escape' || event.defaultPrevented) return;
                event.stopPropagation();
                drawer.onClose();
              }
            : undefined
        }
      >
        {sidebar}
      </aside>
      {separator}
      <section
        inert={drawer?.open}
        className={`
          flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden
          ${narrowPane ? '[container:split-pane-content/inline-size]' : ''}
          ${narrowPane === 'sidebar' ? '[@container_split-pane_(max-width:520px)]:hidden!' : ''}
          ${narrowPane === 'content' ? '[@container_split-pane_(max-width:520px)]:ml-layout' : ''}
          ${integratedHeader ? (compact ? 'bg-surface rounded-0' : 'workspace-panel') : `gap-layout ${compact ? 'bg-surface rounded-0' : 'bg-canvas'}`}
        `}
        aria-label="页面内容"
      >
        <div
          className={`workspace-collection-titlebar ${
            integratedHeader
              ? `workspace-titlebar-layout ${compact ? '' : 'workspace-titlebar-frame-edge'}`
              : compact
                ? 'workspace-titlebar'
                : 'workspace-titlebar-detached'
          } ${narrowPane ? '[@container_split-pane-content_(max-width:620px)]:h-auto! [@container_split-pane-content_(max-width:620px)]:flex-wrap! [@container_split-pane-content_(max-width:620px)]:gap-y-1 [@container_split-pane-content_(max-width:620px)]:py-1! [@container_split-pane-content_(max-width:620px)]:[&>*+*]:flex-[0_0_100%]! [@container_split-pane-content_(max-width:620px)]:[&>*+*]:ml-0!' : ''}`}
        >
          {/* 标题按内容自然占宽，只限制上限，让短名称释放空间给业务工具栏。 */}
          <div className="flex min-w-0 max-w-240px! shrink-0 items-center gap-2">
            {titleContent}
          </div>
          {toolbar}
        </div>
        <div
          className={`layout-scroll ${compact || integratedHeader ? '' : 'rounded-ui bg-surface'}`}
        >
          {children}
        </div>
      </section>
      {drawer?.open && (
        <button
          type="button"
          className="absolute inset-0 z-10 bg-black/35"
          tabIndex={-1}
          aria-hidden="true"
          onClick={drawer.onClose}
        />
      )}
    </div>
  );
}
