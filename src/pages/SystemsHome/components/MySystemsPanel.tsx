/** 我的系统接口返回完整清单：搜索、角色筛选及分页均在本地完成，翻页不发请求。 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Input, Select, Spin, Tooltip } from 'antd';
import { mySystemsOptions } from '@/queries/systems';
import { filterSystems, isAccessDenied } from '@/utils/systems';
import type { MySystemInfo, SystemRole } from '@/types/systems';
import RouteStatusPage from '@/pages/RouteStatus';
import {
  systemCardContainer,
  systemCardGrid,
  systemRoleLabels,
  systemListLayout,
  type SystemView,
} from '../model/presentation';
import { SystemItem, SystemViewSwitch } from './SystemPresentation';
import SystemsHomeSkeleton from './SystemsHomeSkeleton';
import { useSystemQueryError } from '../hooks/useSystemQueryError';
import CollectionPagination from './CollectionPagination';

export default function MySystemsPanel({
  view,
  onViewChange,
  search,
  onSearchChange,
  role,
  onRoleChange,
  defaultPageSize,
  onCreate,
  onDetails,
}: {
  view: SystemView;
  onViewChange: (view: SystemView) => void;
  search: string;
  onSearchChange: (search: string) => void;
  role: SystemRole | 'all';
  onRoleChange: (role: SystemRole | 'all') => void;
  defaultPageSize: number;
  onCreate: () => void;
  onDetails: (system: MySystemInfo) => void;
}) {
  const query = useQuery(mySystemsOptions());
  const [refreshing, setRefreshing] = useState(false);
  async function refresh() {
    setPagination((previous) => ({ ...previous, page: 1 }));
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }
  const [pagination, setPagination] = useState<{
    search: string;
    role: typeof role;
    page: number;
    size?: number;
  }>({
    search,
    role,
    page: 1,
  });
  const sameFilters = pagination.search === search && pagination.role === role;
  if (!sameFilters) setPagination({ ...pagination, search, role, page: 1 });
  const page = sameFilters ? pagination.page : 1;
  const pageSize = pagination.size ?? defaultPageSize;
  const filtered = filterSystems(query.data ?? [], search).filter(
    (system) => role === 'all' || system.role === role,
  );
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  useSystemQueryError(query.error, query.errorUpdatedAt, '我的系统加载失败');
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
  return (
    <section aria-label="我的系统">
      <div className="@container mb-5">
        {/* 按可用宽度整组换行，避免中等宽度只把最后一个操作挤到下一行。 */}
        <div className="grid items-center gap-2.5 @[560px]:gap-3 @[960px]:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 @[560px]:grid-cols-[minmax(0,420px)_150px_auto] @[560px]:justify-start @[560px]:gap-3">
            <Input
              allowClear
              aria-label="筛选我的系统"
              placeholder="系统名称、架构编码、组织或人员"
              className="col-span-2 w-full! min-w-0! @[560px]:col-span-1"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              prefix={
                <span
                  className="i-lucide-search w-14px h-14px text-text-muted"
                  aria-hidden="true"
                />
              }
            />
            <Select
              aria-label="筛选我的系统角色"
              className="w-full! min-w-0!"
              value={role}
              onChange={onRoleChange}
              options={[
                { value: 'all', label: '全部角色' },
                ...Object.entries(systemRoleLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Button
              color="primary"
              variant="outlined"
              loading={refreshing}
              onClick={() => void refresh()}
              icon={<span className="i-lucide-refresh-cw w-14px h-14px" aria-hidden="true" />}
            >
              刷新
            </Button>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2.5 @[560px]:gap-3 @[960px]:justify-end">
            <div className="flex flex-wrap gap-2.5 @[560px]:gap-3">
              <Button
                type="primary"
                onClick={onCreate}
                icon={<span className="i-lucide-plus w-14px h-14px" aria-hidden="true" />}
              >
                新增系统
              </Button>
              {/* 仅预留新增记录查询入口，后续接入弹窗与查询接口。 */}
              <Tooltip title="新增记录查询（待接入）">
                <Button
                  icon={
                    <span className="i-lucide-clipboard-list w-14px h-14px" aria-hidden="true" />
                  }
                >
                  新增记录
                </Button>
              </Tooltip>
            </div>
            <div className="ml-auto shrink-0">
              <SystemViewSwitch label="我的系统展示模式" view={view} onChange={onViewChange} />
            </div>
          </div>
        </div>
      </div>
      <Spin spinning={refreshing && query.data !== undefined} delay={200} size="large">
        {query.isPending ? (
          <SystemsHomeSkeleton count={pageSize} view={view} />
        ) : visible.length ? (
          <div className={systemCardContainer}>
            <div className={view === 'list' ? systemListLayout : systemCardGrid}>
              {visible.map((system) => (
                <SystemItem
                  key={system.systemName}
                  system={system}
                  view={view}
                  onDetails={() => onDetails(system)}
                />
              ))}
            </div>
          </div>
        ) : (
          !query.error && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="workspace-panel m-0! py-16"
              description={
                search || role !== 'all'
                  ? '没有匹配的我的系统，请调整筛选条件'
                  : '暂无已加入的系统，可切换所有系统查看或新增系统'
              }
            />
          )
        )}
      </Spin>
      <CollectionPagination
        page={current}
        pageSize={pageSize}
        total={filtered.length}
        defaultPageSize={defaultPageSize}
        onChange={(next, size) =>
          setPagination({ search, role, page: size === pageSize ? next : 1, size })
        }
      />
    </section>
  );
}
