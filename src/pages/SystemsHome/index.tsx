/**
 * 系统首页：我的/所有系统、搜索、分页和创建入口。
 * 页面共用路由缓存；入口按平台身份与成员关系控制，深链接另由 loader 校验。
 */
import { useMemo, useState } from 'react';
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
  Tabs,
} from 'antd';
import { useNavigate } from 'react-router';
import { systemsOptions, allSystemsOptions } from '../../queries/systems';
import { useAppSelector } from '../../store/hooks';
import CreateSystemModal from './components/CreateSystemModal';
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
// 页面私有样式组合只在此维护，不进入全局 UnoCSS shortcuts。
const rowGrid = 'grid grid-cols-[minmax(0,1fr)_90px_140px_360px] gap-x-5 gap-y-3';
const entryClasses =
  'flex! w-full! justify-start! gap-2! rounded-control! whitespace-normal! text-left! bg-hover! border-accent-border! text-accent-text! shadow-none! enabled:hover:bg-accent-bg-hover! focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-2 motion-reduce:transition-none!';
type DisplaySystem = SystemInfo & { canEnter: boolean; member: boolean };
const systemRoleLabel = (system: DisplaySystem) =>
  system.member
    ? system.role
      ? roleLabel(system.role)
      : '已加入'
    : system.canEnter
      ? '平台人员'
      : '未加入';

function systemCharges(system: SystemInfo) {
  return (
    system.systemCharges
      ?.split(',')
      .map((charge) => charge.trim().split('/')[0])
      .filter(Boolean)
      .join('、') || '暂未配置'
  );
}

function SystemEntries({ system, compact = false }: { system: DisplaySystem; compact?: boolean }) {
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
          disabled={!system.canEnter}
          className={`${entryClasses} ${compact ? 'h-44px! px-3!' : 'h-auto! min-h-88px! px-3! py-3!'}`}
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

function SystemCard({ system }: { system: DisplaySystem }) {
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
          {systemRoleLabel(system)}
        </Tag>
      </div>
      <span
        className="mt-2 text-12px text-text-muted truncate"
        title={`系统编号：${system.systemArchNo || '—'}`}
      >
        {system.systemArchNo || '暂无系统编号'} · 重要性：{system.sysRiskLevel || '未配置'}
      </span>
      <Tooltip title={description}>
        <p className="m-0 mt-3 text-12px leading-20px text-text-muted line-clamp-2 min-h-40px">
          {description}
        </p>
      </Tooltip>
      <div className="mt-4">
        <SystemEntries system={system} />
        {!system.canEnter && (
          <p className="m-0 mt-2 text-text-muted text-12px">未加入，无法访问；请联系下方负责人</p>
        )}
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

function SystemRow({ system }: { system: DisplaySystem }) {
  const description = descriptionText(system.systemDesc);
  return (
    <article
      className={`${rowGrid} px-5 py-4 border-b border-b-solid border-divider last:border-b-0 hover:bg-sidebar transition-colors duration-150 motion-reduce:transition-none`}
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
          {systemRoleLabel(system)}
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
  const userId = useAppSelector((state) => state.session.user?.ystId);
  const userType = useAppSelector((state) => state.session.user?.userType);
  const [tab, setTab] = useState('mine');
  const [creating, setCreating] = useState(false);
  const mine = useQuery(systemsOptions());
  const all = useQuery({ ...allSystemsOptions(), enabled: tab === 'all' });
  const query = tab === 'mine' ? mine : all;
  const [search, setSearch] = useState('');
  const [view, setView] = useState<SystemView>('card');
  const [role, setRole] = useState<SystemRole>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  // 筛选输入不改变原始清单；复用映射结果，避免每次按键重新组装所有系统。
  const systems = useMemo<DisplaySystem[]>(() => {
    const roles = new Map((mine.data ?? []).map((item) => [item.systemName, item.role]));
    return (query.data ?? []).map((item) => {
      const member = 'userRelation' in item ? item.userRelation : true;
      return {
        ...item,
        ystId: userId!,
        role: roles.get(item.systemName) ?? null,
        member,
        canEnter: userType === '0' || member,
      };
    });
  }, [query.data, mine.data, userId, userType]);
  const filtered = filterSystems(systems, search, role);
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;

  return (
    <section className="max-w-1600px mx-auto p-5 desktop:p-8" aria-label="系统列表">
      <Tabs
        activeKey={tab}
        tabBarExtraContent={
          <Button type="primary" onClick={() => setCreating(true)}>
            新增系统
          </Button>
        }
        onChange={(value) => {
          setTab(value);
          setRole(undefined);
          setPage(1);
        }}
        items={[
          { key: 'mine', label: '我的系统' },
          { key: 'all', label: '所有系统' },
        ]}
      />
      {creating && (
        <CreateSystemModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setTab('mine');
            setSearch('');
            setRole(undefined);
            setPage(1);
          }}
        />
      )}
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
        {tab === 'mine' && (
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
        )}
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-4">
            {visible.map((system) => (
              <SystemCard key={system.systemName} system={system} />
            ))}
          </div>
        ) : (
          <div className="workspace-panel overflow-x-auto">
            <div className="min-w-1000px">
              <div
                className={`${rowGrid} px-5 py-3 border-b border-b-solid border-divider bg-sidebar text-12px text-text-muted`}
                aria-hidden="true"
              >
                <span>系统信息</span>
                <span>{tab === 'mine' ? '我的角色' : '成员关系'}</span>
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
            <Empty
              description={
                systems.length
                  ? '没有符合筛选条件的系统'
                  : tab === 'mine'
                    ? '你还没有加入系统，可以新增系统或查看所有系统'
                    : '暂无系统'
              }
            />
            {!systems.length && (
              <div className="flex justify-center gap-3 mt-4">
                <Button type="primary" onClick={() => setCreating(true)}>
                  新增系统
                </Button>
                <Button onClick={() => setTab('all')}>查看所有系统</Button>
              </div>
            )}
          </div>
        )
      )}
      {filtered.length > 0 && (
        <div className="flex justify-end mt-6 [&_.ant-pagination]:flex-wrap">
          <Pagination
            locale={{
              items_per_page: '条/页',
              page_size: '每页条数',
              prev_page: '上一页',
              next_page: '下一页',
              prev_5: '向前 5 页',
              next_5: '向后 5 页',
              prev_3: '向前 3 页',
              next_3: '向后 3 页',
              page: '页',
            }}
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
