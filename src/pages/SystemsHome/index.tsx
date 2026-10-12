/**
 * 我的系统入口页面，提供名称/编号搜索、角色筛选和分页。
 * 页面共用路由预取缓存；系统展示及路径生成采用共享工具，不推导额外权限。
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Empty, Input, Pagination, Select, Spin, Tag, Tooltip } from 'antd';
import { useNavigate } from 'react-router';
import { systemsOptions } from '../../queries/systems';
import {
  descriptionText,
  filterSystems,
  isAccessDenied,
  roleLabel,
  roleOptions,
} from '../../utils/systems';
import { platformHome } from '../../router/paths';
import type { SystemInfo, SystemRole } from '../../types/systems';
import RouteStatusPage from '../RouteStatus';

function SystemRow({ system }: { system: SystemInfo }) {
  const navigate = useNavigate();
  const description = descriptionText(system.systemDesc);
  const role = roleLabel(system.role);
  const charges =
    system.systemCharges
      ?.split(',')
      .map((charge) => charge.trim().split('/')[0])
      .filter(Boolean)
      .join('、') || '暂未配置';
  return (
    <article
      className="system-row-grid px-6 py-4.5 border-b border-b-solid border-divider last:border-b-0 hover:bg-sidebar transition-colors duration-150 motion-reduce:transition-none"
      aria-label={`${system.systemName} 系统`}
    >
      <div className="col-span-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.75">
          <h2
            className="m-0 text-17px font-600 leading-24px min-w-0 truncate tracking-0.1px"
            title={system.systemName}
          >
            {system.systemName}
          </h2>
          <span
            className="text-12px text-text-muted truncate"
            title={`系统编号：${system.systemArchNo || '—'}`}
          >
            {system.systemArchNo || '暂无系统编号'}
          </span>
        </div>
        <Tooltip title={system.systemChineseName}>
          <p className="m-0 mt-1 text-text-secondary text-13px leading-20px truncate">
            {system.systemChineseName || '暂无中文名称'}
          </p>
        </Tooltip>
        <Tooltip title={description}>
          <p className="m-0 mt-1 text-text-muted text-12px leading-20px truncate">{description}</p>
        </Tooltip>
      </div>
      <div className="flex items-center self-center">
        <Tag
          className="m-0! text-12px! leading-22px!"
          color={system.role === 'R' ? 'processing' : undefined}
        >
          {role}
        </Tag>
      </div>
      <Tooltip title={system.systemCharges || '暂未配置'}>
        <div className="flex items-center gap-1.5 min-w-0 self-center text-12px text-text-secondary">
          <span className="truncate">{charges}</span>
        </div>
      </Tooltip>
      <div className="col-span-1 grid grid-cols-2 gap-2 self-center">
        <Button
          type="default"
          className="system-entry"
          onClick={() => navigate(platformHome(system.systemName, 'application'))}
          aria-label={`进入 ${system.systemName} 应用参数`}
        >
          <span
            className="i-lucide-file-code-2 w-15px h-15px text-accent shrink-0"
            aria-hidden="true"
          />
          <span>应用参数</span>
          <span className="system-entry-count">{system.appCount ?? 0}</span>
        </Button>
        <Button
          type="default"
          className="system-entry"
          onClick={() => navigate(platformHome(system.systemName, 'database'))}
          aria-label={`进入 ${system.systemName} 数据库参数`}
        >
          <span
            className="i-lucide-database w-15px h-15px text-accent shrink-0"
            aria-hidden="true"
          />
          <span>数据库参数</span>
          <span className="system-entry-count">{system.paramTypeCount ?? 0}</span>
        </Button>
      </div>
    </article>
  );
}

export default function SystemsHomePage() {
  const query = useQuery(systemsOptions());
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<SystemRole>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const systems = query.data ?? [];
  const filtered = filterSystems(systems, search, role);
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;

  return (
    <section className="max-w-1600px mx-auto p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <h1 className="m-0 text-24px font-600 leading-32px">我的系统</h1>
          <span className="text-text-muted text-13px tabular-nums">
            {query.data ? `${systems.length} 个系统` : '—'}
          </span>
        </div>
        <p className="m-0 mt-1.5 text-text-muted text-13px leading-22px">
          选择系统，进入应用参数或数据库参数工作区
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="flex items-center gap-2 text-13px flex-1 min-w-260px max-w-440px">
          <span className="shrink-0">筛选系统</span>
          <Input
            allowClear
            placeholder="系统英文名、中文名或编号"
            aria-label="筛选系统"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            prefix={
              <span className="i-lucide-search w-15px h-15px text-text-muted" aria-hidden="true" />
            }
          />
        </label>
        <div className="flex items-center gap-2 text-13px">
          <span>角色</span>
          <Select
            allowClear
            aria-label="角色筛选"
            placeholder="全部角色"
            className="w-160px"
            options={roleOptions}
            value={role}
            onChange={(value) => {
              setRole(value);
              setPage(1);
            }}
          />
        </div>
        <Button
          loading={query.isFetching}
          onClick={() => void query.refetch()}
          icon={<span className="i-lucide-refresh-cw w-14px h-14px" aria-hidden="true" />}
        >
          刷新
        </Button>
        {(search || role) && (
          <Button
            type="link"
            onClick={() => {
              setSearch('');
              setRole(undefined);
              setPage(1);
            }}
          >
            清空筛选
          </Button>
        )}
        <span
          className="ml-auto text-12px text-text-muted tabular-nums"
          role="status"
          aria-live="polite"
        >
          {query.data ? `共 ${filtered.length} 个系统` : '正在加载'}
        </span>
      </div>
      {query.error && (
        <Alert
          type="error"
          showIcon
          title="系统列表加载失败"
          description={query.error.message}
          className="mb-5"
          action={<Button onClick={() => void query.refetch()}>重试</Button>}
        />
      )}
      {query.isPending ? (
        <div
          className="grid place-items-center min-h-360px"
          role="status"
          aria-label="正在加载系统列表"
        >
          <Spin />
        </div>
      ) : visible.length ? (
        <div className="workspace-panel overflow-hidden">
          <div
            className="system-row-grid px-6 py-3 border-b border-b-solid border-divider bg-sidebar text-12px text-text-muted"
            aria-hidden="true"
          >
            <span>系统信息</span>
            <span>我的角色</span>
            <span>系统负责人</span>
            <span>参数工作区</span>
          </div>
          {visible.map((system) => (
            <SystemRow key={system.systemName} system={system} />
          ))}
        </div>
      ) : (
        !query.error && (
          <div className="workspace-panel py-16">
            <Empty description={systems.length ? '没有符合筛选条件的系统' : '暂无可访问的系统'} />
          </div>
        )
      )}
      {filtered.length > 0 && (
        <div className="flex justify-end mt-6">
          <Pagination
            current={current}
            pageSize={pageSize}
            total={filtered.length}
            showSizeChanger
            pageSizeOptions={[8, 16, 32]}
            showTotal={(total) => `共 ${total} 个系统`}
            onChange={(nextPage, nextSize) => {
              setPage(nextSize !== pageSize ? 1 : nextPage);
              setPageSize(nextSize);
            }}
          />
        </div>
      )}
    </section>
  );
}
