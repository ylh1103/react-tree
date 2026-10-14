/**
 * 应用和数据库共用的集合工作区，协调响应式侧栏、选中项和请求反馈。
 * 业务查询由页面提供；应用工具栏与内容通过回调接入，未知选中项在数据确认后展示状态。
 */
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Grid,
  Input,
  Menu,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { NavLink, useNavigate } from 'react-router';
import { SplitPane } from '../SplitPane';
import { useSystemWorkspace } from '../../contexts/SystemContext';
import { applicationPath, databasePath } from '../../router/paths';
import { isAccessDenied } from '../../utils/systems';
import RouteStatusPage from '../../pages/RouteStatus';
import { useLayoutPreferences } from '../../hooks/useLayoutPreferences';

interface EnvironmentSelection {
  selectedEnvironments: string[];
  onChange: (keys: string[]) => void;
}

export interface CollectionItem {
  name: string;
  description: string;
}

export function CollectionWorkspace({
  items,
  selectedName,
  database,
  pending,
  hasData,
  refreshing,
  error,
  refresh,
  renderSidebar,
  renderApplicationToolbar,
  renderApplicationContent,
  renderApplicationEmptyState,
}: {
  items: CollectionItem[];
  selectedName?: string;
  database: boolean;
  pending: boolean;
  hasData: boolean;
  refreshing: boolean;
  error: Error | null;
  refresh: () => void;
  renderSidebar?: (close: () => void) => ReactNode;
  renderApplicationToolbar?: (selection: EnvironmentSelection) => ReactNode;
  renderApplicationContent?: (selection: EnvironmentSelection) => ReactNode;
  renderApplicationEmptyState?: (props: {
    applicationCount: number;
    compact: boolean;
    onOpenList: () => void;
    onRefresh: () => void;
    refreshing: boolean;
  }) => ReactNode;
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
  const integratedHeader = !database && !selectedName;
  const workspaceTitle = selectedName || (database ? '数据库参数' : undefined);
  const label = database ? '参数类型' : '应用';
  const selected = items.find((item) => item.name === selectedName);
  const visible = items.filter((item) =>
    `${item.name} ${item.description}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const path = database ? databasePath : applicationPath;
  if (isAccessDenied(error)) return <RouteStatusPage forbidden />;
  const checkingTarget = Boolean(selectedName && !selected && refreshing);
  const blockingError = Boolean(error && (!hasData || (selectedName && !selected)));

  const defaultSidebar = (
    <div>
      <div
        className={`flex items-center justify-between gap-2 p-4 border-b border-b-solid ${layoutMode === 'compact' ? 'border-divider' : 'border-border-subtle'}`}
      >
        <h2 className="workspace-page__title">{label}</h2>
        <Tag className="m-0!">{items.length}</Tag>
      </div>
      <div className="p-3">
        <Input
          allowClear
          aria-label={`搜索${label}`}
          placeholder={`搜索${label}名称或描述`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<span className="i-lucide-search w-14px h-14px" aria-hidden="true" />}
        />
      </div>
      <div className="px-3 pb-2">
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
          className="grid place-items-center py-10"
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
                className="block py-2 leading-20px break-words"
                title={item.description}
                onClick={() => setDrawerOpen(false)}
              >
                {item.name}
              </NavLink>
            ),
          }))}
        />
      ) : (
        !blockingError && (
          <Empty
            className="py-6"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? `未找到匹配的${label}` : `暂无${label}`}
          />
        )
      )}
    </div>
  );
  const sidebar = renderSidebar ? renderSidebar(() => setDrawerOpen(false)) : defaultSidebar;
  const toolbar =
    !database && selected && !pending && !blockingError
      ? renderApplicationToolbar?.({ selectedEnvironments, onChange: selectEnvironments })
      : null;
  const content = (
    <div
      className={
        !database && !selectedName && !pending && !blockingError
          ? 'grid min-h-full min-w-0 place-items-center px-6 py-12'
          : database || !selected
            ? 'p-5'
            : 'min-w-0 h-full'
      }
    >
      {error && (!renderSidebar || compact) && (
        <Alert
          className="mb-5"
          type={blockingError ? 'error' : 'warning'}
          showIcon
          title={blockingError ? `${label}加载失败` : `${label}刷新失败，正在显示已有数据`}
          description={error.message}
          action={
            <Button loading={refreshing} onClick={refresh}>
              重试
            </Button>
          }
        />
      )}
      {pending || checkingTarget ? (
        <div
          className="grid place-items-center min-h-240px"
          role="status"
          aria-label="正在加载工作区"
        >
          <Spin />
        </div>
      ) : blockingError ? null : !selectedName ? (
        !database ? (
          renderApplicationEmptyState?.({
            applicationCount: items.length,
            compact,
            onOpenList: () => setDrawerOpen(true),
            onRefresh: refresh,
            refreshing,
          })
        ) : (
          <div className="py-16">
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
        )
      ) : !selected ? (
        <div className="py-16">
          <Empty description={`${label}「${selectedName}」不存在或已移除`} />
          <div className="text-center mt-5">
            <Button onClick={() => navigate(path(system.systemName))}>返回{label}首页</Button>
          </div>
        </div>
      ) : !database ? (
        renderApplicationContent?.({ selectedEnvironments, onChange: selectEnvironments })
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
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
          <div className="workspace-panel mt-6 p-6">
            <h4 className="workspace-page__title mb-4">参数工作区</h4>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="参数内容待接入" />
          </div>
        </>
      )}
    </div>
  );

  if (compact)
    return (
      <section
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
          <div className="workspace-title-identity shrink! flex-[0_1_220px]!">
            <Button
              onClick={() => setDrawerOpen(true)}
              aria-label={`打开${label}列表`}
              icon={<span className="i-lucide-panel-left-open w-16px h-16px" aria-hidden="true" />}
            />
            {workspaceTitle && (
              <h2 className="workspace-page__title min-w-0 max-w-200px">
                <Typography.Text
                  className="block! text-inherit! text-14px! font-600! leading-22px!"
                  ellipsis={{ tooltip: workspaceTitle }}
                >
                  {workspaceTitle}
                </Typography.Text>
              </h2>
            )}
          </div>
          {toolbar}
        </div>
        <div
          className={`layout-scroll ${layoutMode === 'compact' || integratedHeader ? '' : 'rounded-ui bg-surface'}`}
        >
          {content}
        </div>
        <Drawer
          title={`${label}列表`}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          size={320}
          classNames={{ body: 'p-0!' }}
        >
          {sidebar}
        </Drawer>
      </section>
    );

  return (
    <SplitPane
      storageKey={`react-tree:split-pane:${database ? 'database' : 'application'}:v1`}
      defaultWidth={database ? 300 : 290}
      sidebarLabel={`${label}列表`}
      title={workspaceTitle}
      sidebar={sidebar}
      toolbar={toolbar}
      integratedHeader={integratedHeader}
    >
      {content}
    </SplitPane>
  );
}
