/** 应用与数据库页面首次数据等待的分栏骨架；仅随业务页面加载，不参与静态路由注册。 */
import { Skeleton } from 'antd';
import { useState } from 'react';
import { SplitPaneFrame } from '@/components/SplitPane/components/Frame';
import { readSplitPaneLayout } from '@/components/SplitPane/model/layout';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';

/** 只读历史尺寸；容器宽度由 CSS 限制，骨架不安装 ResizeObserver 或注册分栏交互。 */
export function CollectionSkeleton({
  storageKey,
  defaultWidth = 290,
  title,
  integratedHeader = false,
}: {
  storageKey: string;
  defaultWidth?: number;
  title: string;
  integratedHeader?: boolean;
}) {
  const { layoutMode } = useLayoutPreferences();
  const [layout] = useState(() => readSplitPaneLayout(storageKey, defaultWidth));
  const content = integratedHeader ? (
    <div className="grid min-h-full min-w-0 place-items-center px-6 py-12">
      <div className="flex w-full max-w-440px flex-col items-center gap-6">
        <Skeleton.Avatar active size={80} shape="square" />
        <Skeleton.Input active className="w-240px!" />
        <Skeleton active title={false} paragraph={{ rows: 2 }} />
      </div>
    </div>
  ) : (
    <div className="p-5">
      <Skeleton active paragraph={{ rows: 10 }} />
    </div>
  );
  return (
    <section
      className="motion-reduce:[&_.ant-skeleton-active_*]:animate-none! h-full min-h-full min-w-0"
      aria-busy
    >
      <span className="sr-only" role="status">
        列表资源加载中…
      </span>
      <SplitPaneFrame
        sidebarLabel={`${title}列表`}
        expanded={layout.visible}
        width={`min(${layout.width}px, max(0px, calc(100% - ${layoutMode === 'compact' ? 241 : 244}px)))`}
        titleContent={<Skeleton.Input active size="small" className="max-w-full" />}
        separator={
          <div
            aria-hidden="true"
            className={
              layoutMode === 'compact'
                ? `shrink-0 ${layout.visible ? 'w-1px bg-divider' : 'w-0'}`
                : 'shrink-0 w-[var(--layout-gap)]'
            }
          />
        }
        integratedHeader={integratedHeader}
        sidebar={
          <div className="workspace-panel min-h-full p-4">
            <Skeleton active paragraph={{ rows: 12 }} />
          </div>
        }
      >
        {content}
      </SplitPaneFrame>
    </section>
  );
}
