/**
 * 静态路由骨架集合，与页面懒加载模块分开以覆盖首次加载和 chunk 等待。
 * 分栏骨架读取与真实工作区一致的宽度、布局偏好和目标名称，减少切换时的布局跳动。
 */
import { Grid, Skeleton } from 'antd';
import { useContext } from 'react';
import { useLocation, useNavigation } from 'react-router';
import { matchLoadingParams, RouteLoadingContext } from './loading';
import { SplitPane } from '../components/SplitPane';
import { useLayoutPreferences } from '../hooks/useLayoutPreferences';

export function PageSkeleton() {
  return (
    <section
      className="motion-reduce:[&_.ant-skeleton-active_*]:animate-none! workspace-panel min-h-full p-6"
      aria-busy
    >
      <span className="sr-only" role="status">
        资源加载中…
      </span>
      <Skeleton active paragraph={{ rows: 8 }} />
    </section>
  );
}

export function OverviewSkeleton() {
  return (
    <section
      className="motion-reduce:[&_.ant-skeleton-active_*]:animate-none! workspace-panel min-h-full p-8"
      aria-busy
    >
      <span className="sr-only" role="status">
        概览资源加载中…
      </span>
      <Skeleton active paragraph={{ rows: 2 }} className="max-w-960px mb-6" />
      <div className="grid grid-cols-2 gap-4 max-w-960px mb-8">
        {[0, 1].map((key) => (
          <div key={key} className="workspace-panel p-5 bg-sidebar">
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
      <Skeleton active paragraph={{ rows: 4 }} />
    </section>
  );
}

export function SystemsHomeSkeleton() {
  return (
    <section
      className="motion-reduce:[&_.ant-skeleton-active_*]:animate-none! max-w-1600px mx-auto p-5 desktop:p-8"
      aria-busy
    >
      <span className="sr-only" role="status">
        系统列表加载中…
      </span>
      <div className="mb-6">
        <h1 className="m-0 text-24px font-600 leading-32px">系统列表</h1>
        <p className="m-0 mt-1.5 text-text-muted text-13px leading-22px">
          选择系统，进入应用参数或数据库参数工作区
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-5" aria-hidden="true">
        <Skeleton.Input
          active
          className="w-440px! max-w-full [&_.ant-skeleton-input]:w-full! [&_.ant-skeleton-input]:min-w-0!"
        />
        <Skeleton.Input active className="w-160px!" />
        <Skeleton.Button active />
      </div>
      <div className="system-card-grid" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="workspace-panel p-5">
            <Skeleton active title={{ width: '45%' }} paragraph={{ rows: 3 }} />
            <div className="grid grid-cols-2 gap-2 mt-4 [&_.ant-skeleton-button]:w-full! [&_.ant-skeleton-button]:h-88px!">
              <Skeleton.Button active block />
              <Skeleton.Button active block />
            </div>
            <Skeleton active title={false} paragraph={{ rows: 1 }} className="mt-4" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** 使用实际分栏读取同一份宽度、收起状态和布局偏好。 */
export function CollectionSkeleton({
  storageKey = 'react-tree:split-pane:搜索:v1',
  defaultWidth = 290,
  title = '搜索',
  integratedHeader = false,
}: {
  storageKey?: string;
  defaultWidth?: number;
  title?: string;
  integratedHeader?: boolean;
}) {
  const { layoutMode } = useLayoutPreferences();
  const compact = Grid.useBreakpoint().md === false;
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
      {compact ? (
        <div
          className={`flex flex-col h-full min-h-0 ${integratedHeader ? (layoutMode === 'compact' ? 'bg-surface' : 'workspace-panel') : `gap-layout ${layoutMode === 'compact' ? 'bg-surface' : 'bg-canvas'}`}`}
        >
          <div
            className={`workspace-collection-titlebar ${
              integratedHeader
                ? `workspace-titlebar-layout ${layoutMode === 'compact' ? '' : 'workspace-titlebar-frame-edge'}`
                : layoutMode === 'compact'
                  ? 'workspace-titlebar'
                  : 'workspace-titlebar-detached'
            }`}
          >
            <Skeleton.Input active size="small" />
          </div>
          <div
            className={`layout-scroll ${layoutMode === 'compact' || integratedHeader ? '' : 'rounded-ui bg-surface'}`}
          >
            {content}
          </div>
        </div>
      ) : (
        <SplitPane
          readOnly
          storageKey={storageKey}
          defaultWidth={defaultWidth}
          sidebarLabel={`${title}列表`}
          title={title}
          integratedHeader={integratedHeader}
          sidebar={
            <div className="workspace-panel min-h-full p-4">
              <Skeleton active paragraph={{ rows: 12 }} />
            </div>
          }
        >
          {content}
        </SplitPane>
      )}
    </section>
  );
}

export function ApplicationsSkeleton() {
  const routes = useContext(RouteLoadingContext);
  const navigation = useNavigation();
  const location = useLocation();
  const { appName } = matchLoadingParams(
    routes,
    navigation.location?.pathname ?? location.pathname,
  );
  return (
    <CollectionSkeleton
      storageKey="react-tree:split-pane:application:v1"
      defaultWidth={290}
      title={appName || '应用参数'}
      integratedHeader={!appName}
    />
  );
}

export function DatabaseSkeleton() {
  const routes = useContext(RouteLoadingContext);
  const navigation = useNavigation();
  const location = useLocation();
  const { paramTypeName } = matchLoadingParams(
    routes,
    navigation.location?.pathname ?? location.pathname,
  );
  return (
    <CollectionSkeleton
      storageKey="react-tree:split-pane:database:v1"
      defaultWidth={300}
      title={paramTypeName || '数据库参数'}
    />
  );
}
