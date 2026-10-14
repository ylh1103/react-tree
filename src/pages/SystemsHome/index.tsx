/**
 * 我的系统入口页面，提供名称/编号搜索、角色筛选和分页。
 * 页面共用路由预取缓存；系统展示及路径生成采用共享工具，不推导额外权限。
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Empty,
  Input,
  Pagination,
  Segmented,
  Select,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
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

type SystemView = 'card' | 'list';

function systemCharges(system: SystemInfo) {
  return (
    system.systemCharges
      ?.split(',')
      .map((charge) => charge.trim().split('/')[0])
      .filter(Boolean)
      .join('、') || '暂未配置'
  );
}

function SystemEntries({ system, compact = false }: { system: SystemInfo; compact?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-2 min-w-0">
      {(
        [
          {
            platform: 'application',
            label: '应用参数',
            icon: 'i-lucide-file-code-2',
            count: system.appCount,
            unit: '个应用',
          },
          {
            platform: 'database',
            label: '数据库参数',
            icon: 'i-lucide-database',
            count: system.paramTypeCount,
            unit: '类参数',
          },
        ] as const
      ).map(({ platform, label, icon, count, unit }) => (
        <Button
          key={platform}
          color="primary"
          variant="outlined"
          className={`system-parameter-entry ${compact ? 'h-44px! px-3!' : 'h-auto! min-h-88px! px-3! py-3!'}`}
          onClick={() => navigate(platformHome(system.systemName, platform))}
          aria-label={`进入 ${system.systemName} ${label}`}
        >
          <span
            className={`${icon} ${compact ? 'w-16px h-16px' : 'w-20px h-20px'} shrink-0`}
            aria-hidden="true"
          />
          <span
            className={`flex min-w-0 flex-1 ${compact ? 'items-center gap-2' : 'flex-col items-start gap-1.5'}`}
          >
            <span className="text-13px font-600">{label}</span>
            <span className="flex items-baseline gap-1.5 tabular-nums">
              <span className={compact ? 'text-14px font-600' : 'text-22px font-600 leading-26px'}>
                {count ?? 0}
              </span>
              {!compact && (
                <span className="text-11px font-normal text-text-secondary">{unit}</span>
              )}
            </span>
          </span>
          {!compact && (
            <span className="i-lucide-chevron-right w-14px h-14px shrink-0" aria-hidden="true" />
          )}
        </Button>
      ))}
    </div>
  );
}

function SystemCard({ system }: { system: SystemInfo }) {
  const description = descriptionText(system.systemDesc);
  return (
    <article
      className="workspace-panel flex flex-col min-w-0 p-5"
      aria-label={`${system.systemName} 系统`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-20px font-600 leading-28px truncate" title={system.systemName}>
            {system.systemName}
          </h2>
          <p
            className="m-0 mt-1 text-14px leading-22px truncate text-text-secondary"
            title={system.systemChineseName}
          >
            {system.systemChineseName || '暂无中文名称'}
          </p>
        </div>
        <Tag className="m-0! shrink-0" color={system.role === 'R' ? 'processing' : undefined}>
          {roleLabel(system.role)}
        </Tag>
      </div>
      <span
        className="mt-2 text-12px text-text-muted truncate"
        title={`系统编号：${system.systemArchNo || '—'}`}
      >
        {system.systemArchNo || '暂无系统编号'}
      </span>
      <Tooltip title={description}>
        <p className="m-0 mt-3 text-12px leading-20px text-text-muted line-clamp-2 min-h-40px">
          {description}
        </p>
      </Tooltip>
      <div className="mt-4">
        <SystemEntries system={system} />
      </div>
      <div className="flex items-center gap-2 min-w-0 mt-4 pt-3 border-t border-t-solid border-divider text-12px">
        <span
          className="i-lucide-user-round w-14px h-14px shrink-0 text-text-muted"
          aria-hidden="true"
        />
        <span className="shrink-0 text-text-muted">负责人</span>
        <Tooltip title={system.systemCharges || '暂未配置'}>
          <span className="truncate text-text-secondary">{systemCharges(system)}</span>
        </Tooltip>
      </div>
    </article>
  );
}

function SystemRow({ system }: { system: SystemInfo }) {
  const description = descriptionText(system.systemDesc);
  return (
    <article
      className="system-row-grid px-5 py-4 border-b border-b-solid border-divider last:border-b-0 hover:bg-sidebar transition-colors duration-150 motion-reduce:transition-none"
      aria-label={`${system.systemName} 系统`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.75">
          <h2
            className="m-0 text-16px font-600 leading-24px min-w-0 truncate"
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
        <p
          className="m-0 mt-1 text-text-secondary text-13px leading-20px truncate"
          title={system.systemChineseName}
        >
          {system.systemChineseName || '暂无中文名称'}
        </p>
        <Tooltip title={description}>
          <p className="m-0 mt-1 text-text-muted text-12px leading-20px truncate">{description}</p>
        </Tooltip>
      </div>
      <div className="flex items-center self-center">
        <Tag
          className="m-0! text-12px! leading-22px!"
          color={system.role === 'R' ? 'processing' : undefined}
        >
          {roleLabel(system.role)}
        </Tag>
      </div>
      <Tooltip title={system.systemCharges || '暂未配置'}>
        <div className="min-w-0 self-center text-12px text-text-secondary truncate">
          {systemCharges(system)}
        </div>
      </Tooltip>
      <div className="self-center min-w-0">
        <SystemEntries system={system} compact />
      </div>
    </article>
  );
}

export default function SystemsHomePage() {
  const query = useQuery(systemsOptions());
  const [search, setSearch] = useState('');
  const [view, setView] = useState<SystemView>('card');
  const [role, setRole] = useState<SystemRole>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const systems = query.data ?? [];
  const filtered = filterSystems(systems, search, role);
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;

  return (
    <section className="max-w-1600px mx-auto p-5 desktop:p-8">
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
        <label className="flex items-center gap-2 text-13px flex-1 min-w-0 w-full basis-280px max-w-440px">
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
        <Segmented<SystemView>
          aria-label="系统展示方式"
          className="settings-segmented ml-auto"
          value={view}
          onChange={setView}
          options={[
            {
              value: 'card',
              label: '卡片',
              icon: <span className="i-lucide-layout-grid w-14px h-14px" aria-hidden="true" />,
            },
            {
              value: 'list',
              label: '列表',
              icon: <span className="i-lucide-list w-14px h-14px" aria-hidden="true" />,
            },
          ]}
        />
        <span className="text-12px text-text-muted tabular-nums" role="status" aria-live="polite">
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
        view === 'card' ? (
          <div className="system-card-grid">
            {visible.map((system) => (
              <SystemCard key={system.systemName} system={system} />
            ))}
          </div>
        ) : (
          <div className="workspace-panel overflow-x-auto">
            <div className="min-w-1000px">
              <div
                className="system-row-grid px-5 py-3 border-b border-b-solid border-divider bg-sidebar text-12px text-text-muted"
                aria-hidden="true"
              >
                <span>系统信息</span>
                <span>我的角色</span>
                <span>系统负责人</span>
                <span className="text-accent-text font-500">参数工作区</span>
              </div>
              {visible.map((system) => (
                <SystemRow key={system.systemName} system={system} />
              ))}
            </div>
          </div>
        )
      ) : (
        !query.error && (
          <div className="workspace-panel py-16">
            <Empty description={systems.length ? '没有符合筛选条件的系统' : '暂无可访问的系统'} />
          </div>
        )
      )}
      {filtered.length > 0 && (
        <div className="flex justify-end mt-6 [&_.ant-pagination]:flex-wrap">
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
