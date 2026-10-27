/** 我的系统接口返回完整清单：搜索、角色筛选及分页均在本地完成，翻页不发请求。 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Empty, Input, Select, Tooltip } from 'antd';
import { mySystemsOptions } from '@/queries/systems';
import { filterSystems, isAccessDenied } from '@/utils/systems';
import type { MySystemInfo, SystemRole } from '@/types/systems';
import RouteStatusPage from '@/pages/RouteStatus';
import { systemCardGrid, systemRoleLabels } from '../model/presentation';
import { SystemCard } from './SystemPresentation';
import SystemsHomeSkeleton from './SystemsHomeSkeleton';
import CollectionPagination from './CollectionPagination';

export default function MySystemsPanel({
  active,
  onCreate,
  onDetails,
}: {
  active: boolean;
  onCreate: () => void;
  onDetails: (system: MySystemInfo) => void;
}) {
  const query = useQuery({ ...mySystemsOptions(), enabled: active });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<SystemRole | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const filtered = filterSystems(query.data ?? [], search).filter(
    (system) => role === 'all' || system.role === role,
  );
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
  return (
    <section aria-label="我的系统">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          allowClear
          aria-label="筛选我的系统"
          placeholder="系统名称、架构编码、组织或人员"
          className="w-320px!"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          prefix={
            <span className="i-lucide-search w-14px h-14px text-text-muted" aria-hidden="true" />
          }
        />
        <Select
          aria-label="筛选我的系统角色"
          className="w-150px"
          value={role}
          onChange={(value) => {
            setRole(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: '全部角色' },
            ...Object.entries(systemRoleLabels).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Button
          loading={query.isFetching}
          onClick={() => void query.refetch()}
          icon={<span className="i-lucide-refresh-cw w-14px h-14px" aria-hidden="true" />}
        >
          刷新
        </Button>
        <Button
          type="primary"
          className="shadow-none! bg-accent-active! hover:bg-accent-active!"
          onClick={onCreate}
          icon={<span className="i-lucide-plus w-14px h-14px" aria-hidden="true" />}
        >
          新增系统
        </Button>
        {/* 仅预留新增记录查询入口，后续接入弹窗与查询接口。 */}
        <Tooltip title="新增记录查询（待接入）">
          <Button
            icon={<span className="i-lucide-clipboard-list w-14px h-14px" aria-hidden="true" />}
          >
            新增记录
          </Button>
        </Tooltip>
      </div>
      {query.error && (
        <Alert
          type="error"
          showIcon
          title="我的系统加载失败"
          description={query.error.message}
          className="mb-4"
          action={<Button onClick={() => void query.refetch()}>重试</Button>}
        />
      )}
      {query.isPending ? (
        <SystemsHomeSkeleton />
      ) : visible.length ? (
        <div className={systemCardGrid}>
          {visible.map((system) => (
            <SystemCard
              key={system.systemName}
              system={system}
              onDetails={() => onDetails(system)}
            />
          ))}
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
      <CollectionPagination
        page={current}
        pageSize={pageSize}
        total={filtered.length}
        onChange={(next, size) => {
          setPage(size !== pageSize ? 1 : next);
          setPageSize(size);
        }}
      />
    </section>
  );
}
