/**
 * 系统应用参数页面：以 systemName 绑定列表服务，以 appName 同步选中项。
 * 侧栏和详情订阅同一合并清单；写入期间暂停查询，选中后通过 URL 导航。
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Empty, Spin } from 'antd';
import { applicationEnvironmentsPageOptions } from '@/queries/applicationEnvironments';
import type { ApplicationEnvironment } from '@/types/applicationEnvironments';
import { HttpError } from '@/http/request';
import { isAccessDenied } from '@/utils/systems';
import RouteStatusPage from '@/pages/RouteStatus';
import { useIsMutating, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useLocation, useNavigate, useOutlet, useParams } from 'react-router';
import {
  createSystemApplicationService,
  systemApplicationListOptions,
} from '@/queries/applications';
import { applicationListId, groupedListKeys } from '@/queries/groupedList';
import type { ListNode } from '@/components/GroupedList/types';
import ApplicationList from './components/ApplicationList';
import ApplicationForm from './components/ApplicationForm';
import { useSystemWorkspace } from '@/contexts/SystemContext';
import { useAppSelector } from '@/store/hooks';
import { applicationPath } from '@/router/workspace/paths';
import {
  ApplicationParametersEmptyState,
  ApplicationParametersToolbar,
  ApplicationParametersWorkspace,
  type EnvironmentView,
} from './components/ApplicationParametersWorkspace';
import { SplitPane } from '@/components/SplitPane';
import { responsiveSplitPaneClassName } from '@/components/SplitPane/components/Frame';
import {
  ApplicationEnvironmentPanelsSkeleton,
  ApplicationEnvironmentToolbarSkeleton,
  ApplicationSkeleton,
  applicationSidebarDefaultWidth,
  applicationSidebarStorageKey,
} from '@/components/RouteSkeleton/components/ApplicationSkeleton';

export default function SystemApplicationsPage() {
  const operation = useOutlet();
  const { appName } = useParams();
  if (operation && !appName) return <RouteStatusPage />;
  return (
    <div
      data-application-view={operation ? 'operation' : 'configuration'}
      className="relative isolate h-full min-h-0"
    >
      {/* 两层始终使用相同定位边界，后台配置保持原尺寸，避免 Monaco 和工具栏因尺寸归零而重新布局。
          inert 与 aria-hidden 隔离后台交互；离开应用区域或系统权限失效时仍正常卸载。 */}
      <div
        inert={Boolean(operation)}
        aria-hidden={Boolean(operation)}
        className={`absolute inset-0 min-h-0 overflow-auto ${operation ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        <ApplicationParametersPage />
      </div>
      {operation && <div className="absolute inset-0 z-1 overflow-auto bg-canvas">{operation}</div>}
    </div>
  );
}

/** 配置正文在子操作页显示期间保持挂载，草稿、环境选择和面板布局仍由原组件就地持有。 */
function ApplicationParametersPage() {
  const { system } = useSystemWorkspace();
  const layoutMode = useAppSelector((state) => state.preferences.layoutMode);
  const { appName } = useParams();
  // 独立标题栏下的表单正文复用同一外框；一体式布局由分栏容器统一绘制边框。
  const formFrame = appName && layoutMode !== 'compact' ? 'workspace-panel' : '';
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  const [drawerLocation, setDrawerLocation] = useState<string>();
  const [formSession, setFormSession] = useState<{ locationKey: string; appName?: string }>();
  const activeForm = formSession?.locationKey === locationKey ? formSession : undefined;
  const formTitle = activeForm?.appName ? `编辑应用 · ${activeForm.appName}` : '新增应用';
  if (formSession && !activeForm) setFormSession(undefined);
  const drawerOpen = drawerLocation === locationKey;
  if (drawerLocation && !drawerOpen) setDrawerLocation(undefined);
  const closeDrawer = useCallback(() => setDrawerLocation(undefined), []);
  // 环境选择仅属于应用页；绑定系统与应用，切换目标时直接使用默认值，不用 Effect 同步。
  const [environmentSelection, setEnvironmentSelection] = useState<{
    systemName?: string;
    applicationName?: string;
    keys: string[];
  }>({ keys: ['dev', 'st', 'uat'] });
  const { query, service } = useApplicationList(system.systemName);
  const selected = appName ? query.data?.find((item) => item.key === appName) : undefined;
  const listForbidden = isAccessDenied(query.error);
  const environmentQuery = useQuery({
    ...applicationEnvironmentsPageOptions(system.systemName, appName ?? ''),
    enabled: Boolean(selected) && !listForbidden,
    select: environmentViews,
  });
  const environments = environmentQuery.data ?? [];
  const selectedEnvironments =
    environmentSelection.systemName === system.systemName &&
    environmentSelection.applicationName === appName
      ? environmentSelection.keys.filter((key) => environments.some((env) => env.key === key))
      : environments.slice(0, 3).map((env) => env.key);
  const selection = {
    environments,
    selectedEnvironments,
    onChange: (keys: string[]) =>
      setEnvironmentSelection({ systemName: system.systemName, applicationName: appName, keys }),
  };
  // 首次无数据时沿用路由占位，已有缓存的刷新保留交互工作区。
  if (query.isPending) return <ApplicationSkeleton params={{ appName }} />;
  // 环境接口拒绝访问时优先于旧配置，移除整个参数工作区。
  if (listForbidden || isAccessDenied(environmentQuery.error)) return <RouteStatusPage forbidden />;
  const environmentMissing =
    environmentQuery.error instanceof HttpError && environmentQuery.error.status === 404;
  // 刷新尚未确认目标是否存在时先等待，失败后由列表显示错误与重试，避免误报已删除。
  const checkingTarget = Boolean(appName && !selected && query.isFetching);
  const loadingEnvironments = Boolean(selected && environmentQuery.isPending);
  let toolbar: ReactNode = null;
  if (checkingTarget || loadingEnvironments) {
    if (!activeForm) toolbar = <ApplicationEnvironmentToolbarSkeleton />;
  } else if (selected && environments.length && !environmentMissing) {
    toolbar = (
      <ApplicationParametersToolbar key={appName} {...selection} obscured={Boolean(activeForm)} />
    );
  }

  let content: ReactNode = null;
  if (checkingTarget || loadingEnvironments) {
    content = (
      <ApplicationEnvironmentPanelsSkeleton
        loadingLabel={checkingTarget ? '正在加载应用' : '正在加载应用环境'}
      />
    );
  } else if (selected) {
    content = (
      <ApplicationEnvironmentContent query={environmentQuery} missing={environmentMissing}>
        <ApplicationParametersWorkspace {...selection} appType={selected.appType ?? '0'} />
      </ApplicationEnvironmentContent>
    );
  } else if (!query.error || (!appName && query.data !== undefined)) {
    content = appName ? (
      <div className="py-16 text-center">
        <Empty description={`应用「${appName}」不存在或已移除`} />
        <Button className="mt-5" onClick={() => navigate(applicationPath(system.systemName))}>
          返回应用首页
        </Button>
      </div>
    ) : (
      <div className="grid min-h-full min-w-0 place-items-center px-6 py-12">
        <ApplicationParametersEmptyState
          applicationCount={query.data?.length ?? 0}
          onRefresh={() => void query.refetch()}
          refreshing={query.isFetching}
        />
      </div>
    );
  }
  return (
    <div className={responsiveSplitPaneClassName}>
      <SplitPane
        storageKey={applicationSidebarStorageKey}
        defaultWidth={applicationSidebarDefaultWidth}
        sidebarLabel="应用列表"
        title={activeForm ? formTitle : appName}
        integratedHeader={!appName}
        narrowPane={appName || activeForm ? 'content' : 'sidebar'}
        narrowDrawer={{
          open: drawerOpen,
          onOpen: () => setDrawerLocation(locationKey),
          onClose: closeDrawer,
        }}
        toolbar={toolbar}
        sidebar={
          <ApplicationList
            systemName={system.systemName}
            service={service}
            selectedAppName={appName ?? null}
            onReselect={() => {
              if (!activeForm) void environmentQuery.refetch({ cancelRefetch: false });
            }}
            onLinkActivate={() => {
              closeDrawer();
              setFormSession(undefined);
            }}
            onAdd={() => {
              closeDrawer();
              setFormSession({ locationKey });
            }}
            onEdit={(name) => {
              closeDrawer();
              setFormSession({ locationKey, appName: name });
            }}
          />
        }
      >
        <div className="relative isolate h-full min-h-0">
          {/* 保留参数区的布局尺寸和组件实例，覆盖期间隔离键盘与指针交互。 */}
          <div
            className={`absolute inset-0 isolate overflow-auto ${activeForm ? 'invisible' : ''}`}
            inert={Boolean(activeForm)}
          >
            {content}
          </div>
          {activeForm && (
            <div className={`absolute inset-0 z-1 overflow-auto ${formFrame}`}>
              <ApplicationForm
                key={activeForm.appName === undefined ? 'new' : `edit:${activeForm.appName}`}
                systemName={system.systemName}
                appName={activeForm.appName}
                title={formTitle}
                applications={query.data ?? []}
                onClose={() =>
                  setFormSession((session) => (session === activeForm ? undefined : session))
                }
              />
            </div>
          )}
        </div>
      </SplitPane>
    </div>
  );
}

/** 详情与侧栏使用同一份清单和写入锁，详情只选取叶子。 */
function useApplicationList(systemName: string) {
  const service = useMemo(() => createSystemApplicationService(systemName), [systemName]);
  const writing = useIsMutating({
    mutationKey: groupedListKeys.write(applicationListId(systemName)),
  });
  const query = useQuery({
    ...systemApplicationListOptions(systemName, service),
    enabled: writing === 0,
    select: applicationLeaves,
  });
  return { query, service };
}

/** 环境刷新失败时保留已有配置，重试只刷新当前环境清单。 */
function ApplicationEnvironmentContent({
  query,
  missing,
  children,
}: {
  query: UseQueryResult<EnvironmentView[]>;
  missing: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate flex h-full min-h-0 min-w-0 flex-col">
      {!missing && query.error && (
        <Alert
          type="error"
          showIcon
          title={query.data ? '环境刷新失败，正在显示已有数据' : '环境参数加载失败'}
          description={query.error.message}
          action={
            <Button loading={query.isFetching} onClick={() => void query.refetch()}>
              重试
            </Button>
          }
        />
      )}
      {missing ? (
        <Empty description="应用或环境不存在，可能已被移除" />
      ) : query.data?.length ? (
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      ) : query.data ? (
        <Empty description="该应用暂无环境" />
      ) : null}
      {query.isFetching && (
        <div
          className="pointer-events-none absolute inset-0 z-4 grid place-items-center [background-color:color-mix(in_srgb,var(--color-surface)_55%,transparent)]"
          role="status"
          aria-label="正在刷新应用环境"
        >
          <Spin />
        </div>
      )}
    </div>
  );
}

/** 详情只读取合并后清单中的叶子，分组不会被识别为应用。 */
function applicationLeaves(nodes: ListNode[]): ListNode[] {
  return nodes.flatMap((node) => (node.children ? applicationLeaves(node.children) : [node]));
}

/** 稳定的 select 映射，查询数据未变时不重建环境视图。 */
function environmentViews(items: ApplicationEnvironment[]) {
  return items.map((item) => ({ ...item, key: item.envTag, name: item.envDesc }));
}
