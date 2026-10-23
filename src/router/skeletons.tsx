/**
 * 静态路由骨架集合，与页面懒加载模块分开以覆盖首次加载和 chunk 等待。
 * 分栏仅复用轻量展示层和只读尺寸规则，不加载拖拽、键盘监听或业务页面。
 */
import { Grid, Skeleton } from 'antd';
import { useContext, useState, type ReactNode } from 'react';
import { matchRoutes, useLocation, useNavigation } from 'react-router';
import { matchPageSkeleton, RouteLoadingContext } from './loading';
import { SplitPaneFrame } from '@/components/SplitPane/components/Frame';
import { readSplitPaneLayout } from '@/components/SplitPane/model/layout';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';
import { ResourceLoading } from '@/components/ResourceLoading';
import { BootstrapLoadingHandoff } from '@/components/ResourceLoading/BootstrapHandoff';
import { AppViewport, NavigationFrame, SiteFrame, WorkspaceFrame } from '@/layouts/LayoutFrame';
import { useAppSelector } from '@/store/hooks';
import { databaseNavigationItems, navigationItems, type WorkspaceRoute } from './config';

/** 页头占位保持正式页头的 52px 高度；不挂载依赖系统上下文的切换控件和交互工具。 */
function HeaderSkeleton() {
  const inputClass = '[&_.ant-skeleton-input]:min-w-0! [&_.ant-skeleton-input]:w-full!';
  return (
    <header
      className="shrink-0 min-w-0 bg-header border-b border-b-solid border-divider motion-reduce:[&_.ant-skeleton-active_*]:animate-none!"
      aria-label="页头加载中"
      aria-busy
    >
      <div className="flex items-center gap-4 h-51px px-4" aria-hidden="true">
        <Skeleton.Avatar active size={28} shape="square" />
        <Skeleton.Input active size="small" className={`w-128px! ${inputClass}`} />
        <span className="h-20px w-1px shrink-0 bg-divider" />
        <Skeleton.Input active className={`w-120px! ${inputClass}`} />
        <Skeleton.Input active className={`w-240px! ${inputClass}`} />
        <div className="flex items-center gap-2 ml-auto">
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton.Avatar active key={key} size={28} shape="square" />
          ))}
        </div>
      </div>
    </header>
  );
}

/** 导航占位只从公开路由配置推导数量；授权完成前不展示系统成员或业务清单。 */
function NavigationSkeleton({ database }: { database: boolean }) {
  const iconOnly = useAppSelector((state) => state.preferences.navigationIconOnly);
  const items = database ? databaseNavigationItems : navigationItems;
  return (
    <NavigationFrame>
      <nav
        className="flex flex-col gap-0.5 min-h-full py-2 px-0.75 motion-reduce:[&_.ant-skeleton-active_*]:animate-none!"
        aria-label="主导航加载中"
        aria-busy
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex shrink-0 flex-col items-center justify-center gap-0.5 ${iconOnly ? 'min-h-44px' : 'min-h-60px'} py-1 ${item.bottom ? 'mt-auto' : ''}`}
            aria-hidden="true"
          >
            <Skeleton.Avatar
              active
              size={24}
              shape="square"
              className="[&_.ant-skeleton-avatar]:bg-nav-hover!"
            />
            {!iconOnly && <div className="w-32px h-12px rounded-control bg-nav-hover" />}
          </div>
        ))}
      </nav>
    </NavigationFrame>
  );
}

/** 仅根级等待补齐外壳；页内回退仍只渲染页面骨架，避免在已挂载布局中重复页头和导航。 */
function InitialLayoutSkeleton({ children }: { children: ReactNode }) {
  const routes = useContext(RouteLoadingContext);
  const { pathname } = useLocation();
  const matches = matchRoutes(routes, pathname);
  const workspace = matches?.some(({ route }) => route.id === 'system');
  const database = databaseNavigationItems.some((item) => item.id === matches?.at(-1)?.route.id);
  return (
    <AppViewport>
      {workspace ? (
        <WorkspaceFrame
          header={<HeaderSkeleton />}
          navigation={<NavigationSkeleton database={database} />}
        >
          {children}
        </WorkspaceFrame>
      ) : (
        <SiteFrame header={<HeaderSkeleton />}>{children}</SiteFrame>
      )}
    </AppViewport>
  );
}

/**
 * 根路由 HydrateFallback：首次配置等待结束前保留启动动画，避免骨架先按缓存显示再切换主题或布局。
 * 配置成功或失败后，才根据当前 URL 展示使用确认配置或回退配置的静态骨架；没有骨架时继续等待。
 * 请求和页面模块仍由 Router 并行加载，此处只控制显示，不查询或展示受保护业务数据。
 * 有骨架时在提交后交接 HTML 画面；正式页面仍受原 loader 和系统布局的校验约束。
 */
export function InitialRouteFallback() {
  const routes = useContext(RouteLoadingContext);
  const location = useLocation();
  const initialized = useAppSelector((state) => state.preferences.initialized);
  if (!initialized) return <ResourceLoading />;
  const skeleton = matchPageSkeleton(routes, location.pathname);
  return skeleton ? (
    <BootstrapLoadingHandoff>
      <InitialLayoutSkeleton>{skeleton}</InitialLayoutSkeleton>
    </BootstrapLoadingHandoff>
  ) : (
    <ResourceLoading />
  );
}

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

/** 系统卡片占位沿用正文的自适应列宽和间距，避免加载阶段退化为整行纵向堆叠。 */
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
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-4"
        aria-hidden="true"
      >
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

/** 只读历史尺寸；容器宽度由 CSS 限制，骨架不安装 ResizeObserver 或注册分栏交互。 */
export function CollectionSkeleton({
  storageKey = 'parameter-management:split-pane:搜索:v1',
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
  const [layout] = useState(() => readSplitPaneLayout(storageKey, defaultWidth));
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
      )}
    </section>
  );
}

/** 清单路由统一根据目标 handle 选择尺寸与标题，应用、数据库和后续业务共享同一模板。 */
export function CollectionRouteSkeleton() {
  const routes = useContext(RouteLoadingContext);
  const navigation = useNavigation();
  const location = useLocation();
  const target = matchRoutes(routes, navigation.location?.pathname ?? location.pathname)?.at(-1);
  const handle = target?.route.handle as WorkspaceRoute | undefined;
  const options = handle?.loadingLayout;
  const selectedName = options?.selectionParam ? target?.params[options.selectionParam] : undefined;
  return (
    <CollectionSkeleton
      key={options?.storageKey ?? handle?.id}
      storageKey={options?.storageKey}
      defaultWidth={options?.defaultWidth}
      title={selectedName || options?.title || handle?.label}
      integratedHeader={Boolean(options?.integratedHeaderWhenEmpty && !selectedName)}
    />
  );
}
