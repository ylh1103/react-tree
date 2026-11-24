/** 路由和业务数据等待共用的静态分栏，沿用正文布局与已保存的侧栏尺寸。 */
import { useState, type ReactNode } from 'react';
import { SplitPaneFrame, type SplitPaneFrameProps } from '@/components/SplitPane/components/Frame';
import { readSplitPaneLayout } from '@/components/SplitPane/model/layout';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';

export function CollectionSkeletonFrame({
  storageKey,
  defaultWidth,
  sidebarLabel,
  integratedHeader,
  narrowPane,
  titleContent,
  toolbar,
  sidebar,
  children,
}: {
  storageKey: string;
  defaultWidth: number;
  sidebarLabel: string;
  integratedHeader?: boolean;
  narrowPane?: SplitPaneFrameProps['narrowPane'];
  titleContent: ReactNode;
  toolbar?: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const { layoutMode } = useLayoutPreferences();
  const [layout] = useState(() => readSplitPaneLayout(storageKey, defaultWidth));
  const compact = layoutMode === 'compact';
  return (
    <section className="h-full min-h-full min-w-0" aria-busy>
      <span className="sr-only" role="status">
        列表资源加载中…
      </span>
      <SplitPaneFrame
        sidebarLabel={sidebarLabel}
        expanded={layout.visible}
        width={`min(${layout.width}px, max(0px, calc(100% - ${compact ? 241 : 244}px)))`}
        titleContent={titleContent}
        toolbar={toolbar}
        separator={
          <div
            aria-hidden="true"
            className={
              compact
                ? `shrink-0 ${layout.visible ? 'w-1px bg-divider' : 'w-0'}`
                : 'shrink-0 w-[var(--layout-gap)]'
            }
          />
        }
        integratedHeader={integratedHeader}
        narrowPane={narrowPane}
        sidebar={sidebar}
      >
        {children}
      </SplitPaneFrame>
    </section>
  );
}
