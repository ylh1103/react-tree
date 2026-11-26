/** 我的系统接口返回完整清单：搜索、角色筛选及分页均在本地完成，翻页不发请求。 */
import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Input, Select, Spin, Tooltip } from 'antd';
import { mySystemsOptions } from '@/queries/systems';
import { filterSystems, isAccessDenied } from '@/utils/systems';
import type { MySystemInfo, SystemRole } from '@/types/systems';
import RouteStatusPage from '@/pages/RouteStatus';
import { systemRoleLabels } from '@/utils/systemRoles';
import {
  systemCardContainer,
  systemCardGrid,
  systemListLayout,
  type SystemView,
} from '../SystemList/layout';
import SystemItem from '../SystemList/SystemItem';
import SystemsHomeSkeleton from '../SystemList/SystemsHomeSkeleton';
import { useSystemQueryError } from '../SystemList/useSystemQueryError';
import CollectionPagination from '../SystemList/CollectionPagination';
import SystemSearchEmpty from '../SystemList/SystemSearchEmpty';

export default function MySystemsPanel({
  view,
  search,
  onSearchChange,
  role,
  onRoleChange,
  onClearFilters,
  defaultPageSize,
  onCreate,
  onDetails,
  onManage,
}: {
  view: SystemView;
  search: string;
  onSearchChange: (search: string) => void;
  role: SystemRole | 'all';
  onRoleChange: (role: SystemRole | 'all') => void;
  onClearFilters: () => void;
  defaultPageSize: number;
  onCreate: () => void;
  onDetails: (system: MySystemInfo) => void;
  onManage: (system: MySystemInfo) => void;
}) {
  const query = useQuery(mySystemsOptions());
  const resultSearch = useDeferredValue(search);
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
    search: resultSearch,
    role,
    page: 1,
  });
  const sameFilters = pagination.search === resultSearch && pagination.role === role;
  if (!sameFilters) setPagination({ ...pagination, search: resultSearch, role, page: 1 });
  const page = sameFilters ? pagination.page : 1;
  const pageSize = pagination.size ?? defaultPageSize;
  const filtered = useMemo(() => {
    const systems = query.data ?? [];
    const matches = resultSearch.trim() ? filterSystems(systems, resultSearch) : systems;
    return role === 'all' ? matches : matches.filter((system) => system.role === role);
  }, [query.data, role, resultSearch]);
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  // 搜索框立即更新时复用上一帧的卡片，等延后的关键词到达再重建。
  const items = useMemo(
    () =>
      filtered
        .slice((current - 1) * pageSize, current * pageSize)
        .map((system) => (
          <SystemItem
            key={system.systemName}
            system={system}
            view={view}
            onDetails={() => onDetails(system)}
            onManage={() => onManage(system)}
          />
        )),
    [current, filtered, onDetails, onManage, pageSize, view],
  );
  useSystemQueryError(query.error, query.errorUpdatedAt, '我的系统加载失败');
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
  return (
    <section aria-label="我的系统">
      <div className="@container mb-5">
        {/* 工具栏达到 780px 时，两组控件可并排，搜索框仍有足够输入空间。 */}
        <div className="grid items-center gap-2.5 @[560px]:gap-3 @[780px]:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid min-w-0 grid-cols-2 items-center gap-2.5 @[560px]:grid-cols-[minmax(0,500px)_150px_auto] @[560px]:justify-start @[560px]:gap-3">
            <Input
              size="large"
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
              size="large"
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
              size="large"
              color="primary"
              variant="outlined"
              loading={refreshing}
              onClick={() => void refresh()}
              icon={<span className="i-lucide-refresh-cw w-14px h-14px" aria-hidden="true" />}
            >
              刷新
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 @[560px]:flex @[560px]:gap-3">
            <Button
              size="large"
              type="primary"
              onClick={onCreate}
              icon={<span className="i-lucide-plus w-14px h-14px" aria-hidden="true" />}
            >
              新增系统
            </Button>
            {/* 仅预留新增记录查询入口，后续接入弹窗与查询接口。 */}
            <Tooltip title="新增记录查询（待接入）">
              <Button
                size="large"
                icon={<span className="i-lucide-clipboard-list w-14px h-14px" aria-hidden="true" />}
              >
                新增记录
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
      <Spin spinning={refreshing && query.data !== undefined} delay={200} size="large">
        {query.isPending ? (
          <SystemsHomeSkeleton count={pageSize} view={view} />
        ) : items.length ? (
          <div className={systemCardContainer}>
            <div className={view === 'list' ? systemListLayout : systemCardGrid}>{items}</div>
          </div>
        ) : (
          !query.error &&
          (resultSearch || role !== 'all' ? (
            <SystemSearchEmpty
              description="试试更换关键词或调整角色筛选。"
              clearLabel="清除筛选"
              onClear={onClearFilters}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="workspace-panel m-0! py-16"
              description="暂无已加入的系统，可切换所有系统查看或新增系统"
            />
          ))
        )}
      </Spin>
      <CollectionPagination
        page={current}
        pageSize={pageSize}
        total={filtered.length}
        defaultPageSize={defaultPageSize}
        onChange={(next, size) =>
          setPagination({ search: resultSearch, role, page: size === pageSize ? next : 1, size })
        }
      />
    </section>
  );
}
