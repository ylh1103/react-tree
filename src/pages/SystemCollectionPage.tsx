import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Descriptions, Drawer, Empty, Grid, Input, Menu, Spin, Tag } from 'antd';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { NavLink, useNavigate, useParams } from 'react-router';
import { SplitPane } from '../components/SplitPane/SplitPane';
import { parameterTypesOptions } from '../features/systems/api';
import { createSystemApplicationService } from '../features/applications/api';
import {
  applicationListId,
  groupedListKeys,
  groupedListOptions,
} from '../features/grouped-list/queries';
import type { ListNode } from '../features/grouped-list/types';
import ApplicationListPage from './ApplicationListPage';
import { useSystemWorkspace } from '../features/systems/SystemContext';
import { applicationPath, databasePath } from '../features/systems/paths';
import { isAccessDenied } from '../features/systems/model';
import RouteStatusPage from './RouteStatusPage';
import { useLayoutPreferences } from '../features/preferences/useLayoutPreferences';
import {
  ApplicationParametersToolbar,
  ApplicationParametersWorkspace,
} from '../features/applications/ApplicationParametersWorkspace';

interface CollectionItem {
  name: string;
  description: string;
}

function CollectionWorkspace({
  items,
  selectedName,
  database,
  pending,
  refreshing,
  error,
  refresh,
  renderSidebar,
}: {
  items: CollectionItem[];
  selectedName?: string;
  database: boolean;
  pending: boolean;
  refreshing: boolean;
  error: Error | null;
  refresh: () => void;
  renderSidebar?: (close: () => void) => ReactNode;
}) {
  const { system } = useSystemWorkspace();
  const { layoutMode } = useLayoutPreferences();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [environmentSelection, setEnvironmentSelection] = useState<{
    applicationName?: string;
    keys: string[];
  }>({ keys: ['dev', 'st', 'uat'] });
  const selectedEnvironments =
    environmentSelection.applicationName === selectedName
      ? environmentSelection.keys
      : ['dev', 'st', 'uat'];
  const selectEnvironments = (keys: string[]) =>
    setEnvironmentSelection({ applicationName: selectedName, keys });
  const compact = Grid.useBreakpoint().md === false;
  const label = database ? '参数类型' : '应用';
  const selected = items.find((item) => item.name === selectedName);
  const visible = items.filter((item) =>
    `${item.name} ${item.description}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const path = database ? databasePath : applicationPath;
  if (isAccessDenied(error)) return <RouteStatusPage forbidden />;

  const defaultSidebar = (
    <div>
      <div
        className={`flex items-center justify-between gap-8px p-16px border-b border-b-solid ${layoutMode === 'compact' ? 'border-divider' : 'border-border-subtle'}`}
      >
        <h2 className="workspace-page__title">{label}</h2>
        <Tag className="m-0!">{items.length}</Tag>
      </div>
      <div className="p-12px">
        <Input
          allowClear
          aria-label={`搜索${label}`}
          placeholder={`搜索${label}名称或描述`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<span className="i-lucide-search w-14px h-14px" aria-hidden="true" />}
        />
      </div>
      <div className="px-12px pb-8px">
        <Button
          size="small"
          loading={refreshing}
          onClick={refresh}
          icon={<span className="i-lucide-refresh-cw w-12px h-12px" aria-hidden="true" />}
        >
          刷新列表
        </Button>
      </div>
      {pending ? (
        <div
          className="grid place-items-center py-40px"
          role="status"
          aria-label={`正在加载${label}`}
        >
          <Spin />
        </div>
      ) : visible.length ? (
        <Menu
          className="bg-transparent! border-e-0! [&_.ant-menu-item]:h-auto! [&_.ant-menu-item]:min-h-40px [&_.ant-menu-title-content]:whitespace-normal!"
          selectedKeys={selectedName ? [selectedName] : []}
          items={visible.map((item) => ({
            key: item.name,
            label: (
              <NavLink
                to={path(system.systemName, item.name)}
                className="block py-8px leading-20px break-words"
                title={item.description}
                onClick={() => setDrawerOpen(false)}
              >
                {item.name}
              </NavLink>
            ),
          }))}
        />
      ) : (
        !error && (
          <Empty
            className="py-24px"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? `未找到匹配的${label}` : `暂无${label}`}
          />
        )
      )}
    </div>
  );
  const sidebar = renderSidebar ? renderSidebar(() => setDrawerOpen(false)) : defaultSidebar;
  const titleExtra =
    !database && selected && !pending && !error ? (
      <ApplicationParametersToolbar
        selectedEnvironments={selectedEnvironments}
        onChange={selectEnvironments}
      />
    ) : null;
  const content = (
    <div className={database || !selected ? 'p-20px' : 'min-w-0 h-full'}>
      {error && (
        <Alert
          className="mb-20px"
          type="error"
          showIcon
          title={`${label}加载失败`}
          description={error.message}
          action={<Button onClick={refresh}>重试</Button>}
        />
      )}
      {pending ? (
        <div
          className="grid place-items-center min-h-240px"
          role="status"
          aria-label="正在加载工作区"
        >
          <Spin />
        </div>
      ) : error ? null : !selectedName ? (
        <div className="py-64px">
          <Empty
            description={
              items.length
                ? compact
                  ? `请打开列表选择${label}`
                  : `请从左侧选择${label}`
                : `当前系统暂无${label}`
            }
          />
        </div>
      ) : !selected ? (
        <div className="py-64px">
          <Empty description={`${label}「${selectedName}」不存在或已移除`} />
          <div className="text-center mt-20px">
            <Button onClick={() => navigate(path(system.systemName))}>返回{label}首页</Button>
          </div>
        </div>
      ) : !database ? (
        <ApplicationParametersWorkspace
          selectedEnvironments={selectedEnvironments}
          onChange={selectEnvironments}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-12px mb-20px">
            <span
              className={`${database ? 'i-lucide-database' : 'i-lucide-cloud'} w-24px h-24px text-accent`}
              aria-hidden="true"
            />
            <h3 className="m-0 text-18px font-600 break-all">{selected.name}</h3>
            <Tag className="shrink-0">{database ? '数据库参数' : '应用参数'}</Tag>
          </div>
          <Descriptions
            column={1}
            size="small"
            items={[
              {
                key: 'system',
                label: '所属系统',
                children: `${system.systemName} · ${system.systemChineseName}`,
              },
              {
                key: 'description',
                label: `${label}描述`,
                children: selected.description || '暂无描述',
              },
            ]}
          />
          <div className="workspace-panel mt-24px p-24px">
            <h4 className="workspace-page__title mb-16px">参数工作区</h4>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="参数内容待接入" />
          </div>
        </>
      )}
    </div>
  );

  if (compact)
    return (
      <section
        className={`flex flex-col h-full min-h-0 ${layoutMode === 'compact' ? 'bg-surface' : 'gap-4px bg-canvas'}`}
      >
        <div
          className={
            layoutMode === 'compact' ? 'workspace-titlebar' : 'workspace-titlebar-detached'
          }
        >
          <div className="workspace-title-identity">
            <Button
              onClick={() => setDrawerOpen(true)}
              aria-label={`打开${label}列表`}
              icon={<span className="i-lucide-panel-left-open w-16px h-16px" aria-hidden="true" />}
            />
            <h2 className="workspace-page__title min-w-0 max-w-200px truncate" title={selectedName}>
              {selectedName || (database ? '数据库参数' : '应用参数')}
            </h2>
          </div>
          {titleExtra}
        </div>
        <div
          className={`layout-scroll ${layoutMode === 'compact' ? '' : 'rounded-8px bg-surface'}`}
        >
          {content}
        </div>
        <Drawer
          title={`${label}列表`}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          size="min(320px, calc(100vw - 32px))"
          classNames={{ body: 'p-0!' }}
        >
          {sidebar}
        </Drawer>
      </section>
    );

  return (
    <SplitPane
      storageKey={`react-tree:split-pane:${database ? 'database' : 'application'}:v1`}
      defaultWidth={database ? 300 : 360}
      sidebarLabel={`${label}列表`}
      title={selectedName || (database ? '数据库参数' : '应用参数')}
      sidebar={sidebar}
      titleExtra={titleExtra}
    >
      {content}
    </SplitPane>
  );
}

export function DatabaseParametersPage() {
  const { system } = useSystemWorkspace();
  const { paramTypeName } = useParams();
  const query = useQuery(parameterTypesOptions(system.systemName));
  return (
    <CollectionWorkspace
      database
      items={(query.data ?? []).map((item) => ({
        name: item.paramTypeName,
        description: item.description,
      }))}
      selectedName={paramTypeName}
      pending={query.isPending}
      refreshing={query.isFetching}
      error={query.error}
      refresh={() => void query.refetch()}
    />
  );
}

export function SystemApplicationsPage() {
  const { system } = useSystemWorkspace();
  const { appName } = useParams();
  const navigate = useNavigate();
  const service = useMemo(
    () => createSystemApplicationService(system.systemName),
    [system.systemName],
  );
  const listId = applicationListId(system.systemName);
  const writing = useIsMutating({ mutationKey: groupedListKeys.write(listId) }) > 0;
  const query = useQuery({
    ...groupedListOptions(listId, service),
    enabled: !writing,
    select: applicationItems,
  });
  return (
    <CollectionWorkspace
      database={false}
      items={query.data ?? []}
      selectedName={appName}
      pending={query.isPending}
      refreshing={query.isFetching}
      error={query.error}
      refresh={() => void query.refetch()}
      renderSidebar={(close) => (
        <ApplicationListPage
          systemName={system.systemName}
          service={service}
          selectedAppName={appName ?? null}
          embedded
          onSelectApplication={(node) => {
            navigate(applicationPath(system.systemName, node.key));
            close();
          }}
        />
      )}
    />
  );
}

/** 详情只读取合并后清单中的叶子，分组不会被识别为应用。 */
function applicationItems(nodes: ListNode[]): CollectionItem[] {
  return nodes.flatMap((node) =>
    node.children
      ? applicationItems(node.children)
      : [{ name: node.key, description: node.desc ?? '' }],
  );
}
