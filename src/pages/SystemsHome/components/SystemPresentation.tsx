/** 系统目录展示将系统身份、参数入口和成员信息分层展示。 */
import {
  App,
  Avatar,
  Button,
  ConfigProvider,
  Dropdown,
  Input,
  Modal,
  Popover,
  Segmented,
  Tag,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useState, type ReactNode } from 'react';
import SystemManagementModal from './SystemManagementModal';
import { Link } from 'react-router';
import type { AllSystemInfo, MySystemInfo, SystemInfo } from '@/types/systems';
import { descriptionText } from '@/utils/systems';
import { platformHome } from '@/router/paths';
import JoinSystemAction from '@/components/JoinSystemAction';
import { peopleList } from '@/utils/systemPeople';
import {
  peopleNames,
  systemRoleLabels,
  systemRoleTags,
  organizationName,
  systemCardFrame,
  systemCardPadding,
  systemCardDescriptionHeight,
  systemCardFooter,
  systemListRow,
  systemListBody,
  systemListFooter,
  systemEntryGrid,
  type SystemView,
} from '../model/presentation';

export function SystemViewSwitch({
  label,
  view,
  onChange,
}: {
  label: string;
  view: SystemView;
  onChange: (view: SystemView) => void;
}) {
  return (
    <ConfigProvider
      theme={{
        components: {
          Segmented: {
            trackBg: 'var(--color-surface)',
            itemSelectedBg: 'var(--color-divider)',
            itemSelectedColor: 'var(--color-surface-text)',
          },
        },
      }}
    >
      <Segmented<SystemView>
        className="border border-solid border-border-subtle"
        aria-label={label}
        value={view}
        onChange={onChange}
        options={[
          {
            value: 'card',
            title: '卡片',
            label: (
              <span className="text-16px">
                <AppstoreOutlined aria-hidden="true" />
                <span className="sr-only">卡片</span>
              </span>
            ),
          },
          {
            value: 'list',
            title: '列表',
            label: (
              <span className="text-16px">
                <UnorderedListOutlined aria-hidden="true" />
                <span className="sr-only">列表</span>
              </span>
            ),
          },
        ]}
      />
    </ConfigProvider>
  );
}

/** 卡片和列表共用系统管理入口。 */
function SystemActions({
  system,
  isMember,
  showDelete,
}: {
  system: SystemInfo;
  isMember: boolean;
  showDelete: boolean;
}) {
  const { message } = App.useApp();
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          onClick: ({ key }) => {
            if (key === 'settings') setEditing(true);
            else void message.info('此功能暂未接入');
          },
          items: [
            {
              key: 'settings',
              label: '系统管理',
              icon: <span className="i-lucide-settings size-16px" aria-hidden="true" />,
            },
            {
              key: 'users',
              label: '人员管理',
              icon: <span className="i-lucide-users size-16px" aria-hidden="true" />,
            },
            ...(isMember
              ? [
                  {
                    key: 'leave',
                    label: '退出系统',
                    icon: <span className="i-lucide-log-out size-16px" aria-hidden="true" />,
                  },
                ]
              : []),
            ...(showDelete
              ? [
                  {
                    key: 'delete',
                    label: '删除系统',
                    danger: true,
                    icon: <span className="i-lucide-trash-2 size-16px" aria-hidden="true" />,
                  },
                ]
              : []),
          ],
        }}
      >
        <Button
          type="text"
          size="small"
          aria-label={`${system.systemName} 更多操作`}
          className="shrink-0 text-text-muted!"
          icon={<span className="i-lucide-ellipsis w-16px h-16px" aria-hidden="true" />}
        />
      </Dropdown>
      {editing && (
        <SystemManagementModal
          system={system}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </>
  );
}

/** 参数数量使用独立角标，完整单位保留在无障碍名称中。 */
function SystemEntries({
  system,
  locked,
  compact,
}: {
  system: SystemInfo;
  locked: boolean;
  compact: boolean;
}) {
  return (
    <div className={systemEntryGrid}>
      {(
        [
          {
            platform: 'application',
            label: '应用参数',
            icon: 'i-lucide-file-code',
            count: system.appCount,
            unit: '个应用',
          },
          {
            platform: 'database',
            label: '数据库参数',
            icon: 'i-lucide-database',
            count: system.paramTypeCount,
            unit: '种参数类型',
          },
        ] as const
      ).map(({ platform, label, icon, count, unit }) => {
        const className = `${compact ? 'h-64px!' : 'h-92px!'} min-w-0! px-1! rounded-ui! layout-focus`;
        const accessibleLabel = `${system.systemName} ${label}，${count ?? '—'} ${unit}`;
        const content = (
          <span
            className={`flex w-full min-w-0 flex-col items-center ${compact ? 'gap-1' : 'gap-2'}`}
          >
            <span
              className={`relative inline-flex ${locked ? 'text-text-muted' : 'text-accent-text'}`}
              aria-hidden="true"
            >
              <span className={`${icon} ${compact ? 'size-20px' : 'size-36px'}`} />
              <span
                className={`absolute -top-1 left-[calc(100%-6px)] min-w-18px rounded-full px-1 text-center text-11px leading-16px font-600 tabular-nums ring-2 ring-surface ${locked ? 'bg-divider text-text-muted' : 'bg-accent text-on-accent'}`}
              >
                {count ?? '—'}
              </span>
            </span>
            <span className="max-w-full truncate text-14px leading-18px">{label}</span>
          </span>
        );

        return locked ? (
          <Button
            key={platform}
            block
            type="text"
            disabled
            className={`${className} text-text-muted!`}
            aria-label={`${accessibleLabel}，加入后可进入`}
          >
            {content}
          </Button>
        ) : (
          <Link
            key={platform}
            to={platformHome(system.systemName, platform)}
            className={`${className} flex items-center text-text! no-underline! hover:bg-hover!`}
            aria-label={accessibleLabel}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

/** 等级标签与详情主卡共用色系，主卡使用深色渐变以保留白字对比度。 */
const riskLevelAppearance: Partial<Record<string, { color: string; background: string }>> = {
  A: { color: 'red', background: 'bg-[linear-gradient(150deg,#c41d2f,#8f1322)]' },
  B: { color: 'orange', background: 'bg-[linear-gradient(150deg,#b45309,#8a3c05)]' },
  C: { color: 'cyan', background: 'bg-[linear-gradient(150deg,#087680,#07545e)]' },
  D: { color: 'purple', background: 'bg-[linear-gradient(150deg,#722ed1,#43178a)]' },
};

const titleTagClass =
  'm-0! inline-flex! h-20px! shrink-0! items-center rounded-full! bg-surface! px-1.5! text-11px! leading-none! font-600!';

/** 卡片保留等级文字，预设色随主题适配。 */
function RiskTag({ level }: { level?: string }) {
  const grade = level?.trim().toUpperCase();
  const label = grade ? `${grade} 级` : '未分级';
  return (
    <Tag
      variant="outlined"
      color={grade ? riskLevelAppearance[grade.charAt(0)]?.color : undefined}
      className={titleTagClass}
      title={`系统重要性等级 ${label}`}
    >
      <span>{label}</span>
    </Tag>
  );
}

/** 我的系统根据目录角色显示标签。 */
function SystemRoleTag({ system }: { system: MySystemInfo }) {
  const role = Object.hasOwn(systemRoleTags, system.role) ? system.role : undefined;
  const roleTag = role ? systemRoleTags[role] : undefined;
  return (
    <Tag
      variant="filled"
      color={roleTag?.color}
      icon={roleTag && <span className={`${roleTag.icon} size-12px shrink-0`} aria-hidden="true" />}
      className="m-0! inline-flex! shrink-0! items-center gap-1 px-1.5! text-12px! leading-20px!"
    >
      {role ? systemRoleLabels[role] : '角色未配置'}
    </Tag>
  );
}

/** 整组头像共用一个可容纳交互内容的浮层，负责人编号供后续会话入口使用。 */
function Owners({ value }: { value: string | undefined }) {
  const { message } = App.useApp();
  const people = peopleList(value);
  if (people.length === 0) {
    return <span className="shrink-0 text-12px text-text-muted">负责人未配置</span>;
  }

  const visiblePeople = people.slice(0, 3);
  const hiddenCount = people.length - visiblePeople.length;
  const ownerAvatarClassName = 'bg-hover! text-accent-text! text-12px! font-500!';
  return (
    <Popover
      placement="topLeft"
      trigger={['hover', 'focus', 'click']}
      title={`系统负责人（${people.length}）`}
      content={() => (
        <ul className="m-0 grid max-h-60 w-52 max-w-[calc(100vw-48px)] list-none gap-0.5 overflow-auto p-0.5">
          {people.map((person) => (
            <li key={person.key} className="min-w-0">
              <Button
                type="text"
                block
                className="group h-auto! min-h-40px! justify-start! gap-2! px-2! py-1! text-left! hover:bg-hover! layout-focus"
                aria-label={`模拟打开与 ${person.name}${person.id ? `（${person.id}）` : ''} 的会话`}
                onClick={() => void message.info(`模拟打开与 ${person.name} 的会话`)}
              >
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-13px text-accent-text font-500">
                    {person.name}
                  </span>
                  {person.id && (
                    <span className="truncate text-11px text-text-secondary tabular-nums">
                      {person.id}
                    </span>
                  )}
                </span>
                <span
                  className="i-lucide-message-circle size-12px shrink-0 text-accent-text opacity-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Button>
            </li>
          ))}
        </ul>
      )}
    >
      <div
        tabIndex={0}
        aria-label={`负责人：${peopleNames(value)}`}
        className="inline-flex shrink-0 cursor-pointer rounded-full layout-focus"
      >
        <Avatar.Group size={24} aria-hidden="true">
          {visiblePeople.map((person) => (
            <Avatar key={person.key} className={ownerAvatarClassName}>
              {person.initial}
            </Avatar>
          ))}
          {hiddenCount > 0 && <Avatar className={ownerAvatarClassName}>+{hiddenCount}</Avatar>}
        </Avatar.Group>
      </div>
    </Popover>
  );
}

/** 两份目录和展示模式共用交互；入口状态由目录传入，实际访问仍由路由校验。 */
export function SystemItem({
  system,
  onDetails,
  entriesLocked = false,
  showDelete = false,
  view,
}: {
  system: MySystemInfo | AllSystemInfo;
  onDetails: () => void;
  entriesLocked?: boolean;
  showDelete?: boolean;
  view: SystemView;
}) {
  const compact = view === 'list';
  const description = descriptionText(system.systemDesc);
  const isMine = 'role' in system;
  const actions = !entriesLocked && (
    <SystemActions
      system={system}
      isMember={isMine || system.userRelation === true}
      showDelete={showDelete}
    />
  );
  const subsystemCode = system.systemArchNo?.trim();
  const subtitle = [
    system.systemChineseName || '暂无中文名称',
    system.ownGroup && organizationName(system.ownGroup),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <article
      className={`
        ${compact ? systemListRow : systemCardFrame}
        transition-[border-color,box-shadow] duration-200
        hover:border-accent-border-hover
        hover:shadow-[0_8px_24px_var(--color-tree-filter-shadow)]
        focus-within:border-accent motion-reduce:transition-none
      `}
      aria-label={`${system.systemName} ${isMine ? '我的系统' : '所有系统'}`}
    >
      <div
        className={
          compact ? systemListBody : `flex min-w-0 flex-1 flex-col gap-2.5 ${systemCardPadding}`
        }
      >
        <div className={`flex w-full min-w-0 flex-1 flex-col ${compact ? 'gap-1' : 'gap-2.5'}`}>
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="m-0 flex min-w-0 items-center gap-1.5">
                <Tooltip title={`${system.systemName} · 查看系统详情`}>
                  <Button
                    type="text"
                    onClick={onDetails}
                    aria-label={`查看 ${system.systemName} 详情`}
                    className={`
                    inline-flex! h-24px! min-w-0! max-w-full! items-center! p-0! text-text! ${compact ? 'text-16px!' : 'text-18px!'} font-600! leading-24px!
                    hover:text-accent-text! hover:bg-transparent! focus-visible:outline-2
                    focus-visible:outline-solid focus-visible:outline-accent [&>span]:truncate
                  `}
                  >
                    {system.systemName}
                  </Button>
                </Tooltip>
                {subsystemCode && (
                  <Tag
                    variant="outlined"
                    className={`${titleTagClass} min-w-0 max-w-[40%] border-accent-border! text-accent-text!`}
                    title={`子系统编码 ${subsystemCode}`}
                  >
                    <span className="truncate">{subsystemCode}</span>
                  </Tag>
                )}
                <RiskTag level={system.sysRiskLevel} />
              </h2>
              <Typography.Paragraph
                ellipsis={{
                  rows: 1,
                  tooltip: subtitle,
                }}
                className="m-0! mt-0.5! text-12px! leading-16px! text-text-muted!"
              >
                {subtitle}
              </Typography.Paragraph>
            </div>
            {!compact && actions}
          </div>
          <Typography.Paragraph
            ellipsis={{ rows: compact ? 1 : 2, tooltip: { title: description, placement: 'top' } }}
            className={`m-0! text-14px! leading-18px! text-text-secondary! break-words ${compact ? '' : systemCardDescriptionHeight}`}
          >
            {description}
          </Typography.Paragraph>
        </div>
        <div className={compact ? 'min-w-0' : 'mt-auto pt-1'}>
          <SystemEntries system={system} locked={entriesLocked} compact={compact} />
        </div>
      </div>
      <div
        className={
          compact
            ? systemListFooter
            : `flex min-w-0 flex-wrap items-center justify-between gap-2 ${systemCardPadding} ${systemCardFooter}`
        }
      >
        <div className={compact ? undefined : 'flex items-center'}>
          <Owners value={system.systemCharges} />
        </div>
        {isMine && <SystemRoleTag system={system} />}
        {!isMine && entriesLocked && <JoinSystemAction system={system} />}
        {compact && actions && <div className="ml-auto">{actions}</div>}
      </div>
    </article>
  );
}
/** 逐人展示姓名及编号，便于区分同名人员。 */
function DetailPeople({
  value,
  label,
  className,
  twoColumns = false,
}: {
  value?: string;
  label: string;
  className: string;
  twoColumns?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const people = peopleList(value);
  const previewLimit = 6;
  const avatarTones = [
    'bg-[#dfeaff] text-[#0f4fc7]',
    'bg-[#eadcff] text-[#5b1e92]',
    'bg-[#d8f3e8] text-[#0b6b4c]',
    'bg-[#ffe9b8] text-[#7a3f00]',
    'bg-[#ffdbe4] text-[#a11d44]',
    'bg-[#d3f0f8] text-[#0b6a85]',
  ];
  const keyword = query.trim().toLowerCase();
  const filteredPeople = keyword
    ? people.filter(
        ({ name, id }) =>
          name.toLowerCase().includes(keyword) || id?.toLowerCase().includes(keyword),
      )
    : people;
  const showAll = expanded || Boolean(keyword);
  const visiblePeople = showAll ? filteredPeople : people.slice(0, previewLimit);

  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 flex items-center gap-2 text-14px leading-5 font-700">
          {label}
          <span className="rounded-full bg-sidebar px-2 py-0.5 text-12px text-text-secondary">
            {keyword ? `${filteredPeople.length}/${people.length}` : people.length}
          </span>
        </h3>
        {people.length > previewLimit && !keyword && (
          <Button
            type="text"
            size="small"
            className="rounded-control! bg-sidebar! text-accent-text! hover:bg-hover!"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : `展开全部 ${people.length} 人`}
          </Button>
        )}
      </div>
      {twoColumns && people.length > 12 && (
        <Input
          aria-label="按姓名或工号搜索负责人"
          placeholder="按姓名或工号搜索"
          prefix={
            <span className="i-lucide-search size-4 text-text-secondary" aria-hidden="true" />
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mb-3 h-38px rounded-control! bg-sidebar!"
        />
      )}
      {!people.length ? (
        <span className="text-text-muted">未配置</span>
      ) : !visiblePeople.length ? (
        <p className="m-0 py-4 text-center text-13px text-text-secondary">没有找到匹配的负责人</p>
      ) : (
        <ul
          className={`m-0 grid list-none gap-2 p-0 ${showAll ? 'max-h-236px overflow-y-auto overscroll-contain' : ''} ${twoColumns ? 'min-[480px]:grid-cols-2' : ''}`}
        >
          {visiblePeople.map(({ key, name, id, initial }, index) => (
            <li
              key={key}
              className="flex min-w-0 items-center gap-2 rounded-ui bg-sidebar p-2 pr-3 hover:bg-hover"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-control text-14px font-700 ${avatarTones[(index + (twoColumns ? 0 : 2)) % avatarTones.length]}`}
                aria-hidden="true"
              >
                {initial}
              </span>
              <span className="min-w-0 break-words">
                <span className="block text-14px font-700 leading-5">{name}</span>
                {id && (
                  <span className="block text-12px leading-4 font-mono text-text-secondary tabular-nums">
                    {id}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** “992484/信用卡账务开发一室”拆成名称在前、编码随后，单行展示不挤压换行。 */
function CodeName({ value }: { value?: string }) {
  if (!value) return <span className="text-text-muted">未配置</span>;
  const idx = value.indexOf('/');
  if (idx <= 0) return <>{value}</>;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span>{value.slice(idx + 1).trim()}</span>
      <span className="text-12px font-mono font-500 text-text-secondary tabular-nums">
        {value.slice(0, idx).trim()}
      </span>
    </span>
  );
}

function OrganizationNode({
  label,
  children,
  hasNext = false,
}: {
  label: string;
  children: ReactNode;
  hasNext?: boolean;
}) {
  return (
    <div className={`relative grid min-w-0 gap-0.5 pl-6 ${hasNext ? 'pb-3.5' : ''}`}>
      <dt className="text-12px leading-4 text-text-secondary">
        <span
          className="absolute inset-y-0 left-0 flex w-3 flex-col items-center pt-6px"
          aria-hidden="true"
        >
          <span
            className={`box-border size-10px shrink-0 rounded-full ${hasNext ? 'border-2 border-solid border-accent' : 'bg-accent'}`}
          />
          {hasNext && <span className="my-1 w-2px flex-1 bg-border" />}
        </span>
        {label}
      </dt>
      <dd className="m-0 min-w-0 break-words text-15px leading-22px font-600">{children}</dd>
    </div>
  );
}

/** 系统详情以身份、规模、归属和人员四组 Bento 卡片展示。 */
export function SystemDetailsModal({
  system,
  onClose,
}: {
  system: MySystemInfo | AllSystemInfo;
  onClose: () => void;
}) {
  const { token } = theme.useToken();
  const role =
    'role' in system && Object.hasOwn(systemRoleLabels, system.role) ? system.role : undefined;
  const roleTag = role ? systemRoleTags[role] : undefined;
  const roleColor = roleTag?.color;
  const rolePalette =
    roleColor === 'gold' || roleColor === 'blue' || roleColor === 'cyan'
      ? { background: token[`${roleColor}1`], color: token[`${roleColor}7`] }
      : { background: token.colorFillAlter, color: token.colorText };
  const grade = system.sysRiskLevel?.trim().toUpperCase();
  const heroBackground =
    (grade && riskLevelAppearance[grade.charAt(0)]?.background) ||
    'bg-[linear-gradient(150deg,#475569,#334155)]';
  const archNo = system.systemArchNo?.trim();
  const tile = 'min-w-0 rounded-ui p-4 min-[640px]:px-5 min-[640px]:py-18px';
  const hoverTile = `${tile} motion-safe:transition-shadow motion-safe:duration-150 hover:[box-shadow:0_4px_12px_-3px_#1e2d5a40] [html[data-theme=dark]_&]:hover:[box-shadow:0_4px_12px_-3px_#0009]`;
  const panel = `${hoverTile} bg-surface`;
  const stats = [
    {
      label: '应用参数',
      icon: 'i-lucide-layers',
      count: system.appCount,
      unit: '个',
      tone: 'bg-[#dfeaff] text-[#0b3b99] [html[data-theme=dark]_&]:bg-hover [html[data-theme=dark]_&]:text-accent-text',
    },
    {
      label: '数据库参数',
      icon: 'i-lucide-database',
      count: system.paramTypeCount,
      unit: '类',
      tone: 'bg-[#d8f3e8] text-[#064e38] [html[data-theme=dark]_&]:bg-[#123b32] [html[data-theme=dark]_&]:text-[#a2e8ce]',
    },
  ];

  return (
    <Modal
      open
      centered
      closable={false}
      title={<span className="sr-only">{system.systemName} · 系统详情</span>}
      onCancel={onClose}
      footer={null}
      width="min(840px, calc(100% - 32px))"
      classNames={{
        container:
          'flex flex-col rounded-ui! p-4! bg-[#eef1f7]! shadow-[0_24px_64px_#0f172a52]! [html[data-theme=dark]_&]:bg-canvas!',
        header: 'm-0! h-0 overflow-hidden',
        body: '-m-3 flow-root',
      }}
    >
      <div className="m-3">
        <div className="grid gap-3.5 min-[640px]:grid-cols-2">
          <section
            className={`${tile} relative isolate flex flex-col justify-center overflow-hidden min-[640px]:min-h-58 text-white ${heroBackground}`}
          >
            {grade && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[-48px] right-[-8px] -z-1 select-none text-185px min-[800px]:text-240px font-900 leading-none tracking-[-8px] text-white/10"
              >
                {grade.charAt(0)}
              </span>
            )}
            <span className="inline-flex items-center self-start gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-12px font-600">
              <span className="i-lucide-shield size-4" aria-hidden="true" />
              {grade ? `重要性 ${grade} 级` : '未分级'}
            </span>
            <h2 className="m-0 mt-3 break-words text-34px font-700 leading-tight min-[640px]:text-56px min-[640px]:leading-60px tracking-1px">
              {system.systemName}
            </h2>
            <p className="m-0 mt-1.5 break-words text-18px leading-26px font-600">
              {system.systemChineseName || '暂无中文名称'}
            </p>
            {archNo && (
              <p className="m-0 mt-3 self-start break-words rounded-control bg-black/20 px-2.5 py-1 text-12px">
                子系统编码{' '}
                <span className="ml-1 border-l border-l-solid border-white/35 pl-1.5 font-mono font-600">
                  {archNo}
                </span>
              </p>
            )}
          </section>

          <dl className="m-0 grid grid-cols-1 gap-3.5 min-[360px]:grid-cols-2 min-[640px]:grid-rows-[minmax(min-content,1.4fr)_minmax(min-content,1fr)]">
            {stats.map(({ label, icon, count, unit, tone }) => (
              <div key={label} className={`${hoverTile} ${tone}`}>
                <dt className="flex items-center gap-2 text-13px font-600">
                  <span className={`${icon} size-4 shrink-0`} aria-hidden="true" />
                  {label}
                </dt>
                <dd className="m-0 mt-4 flex flex-wrap items-baseline gap-x-1">
                  <span className="break-all text-32px font-800 leading-none tabular-nums min-[640px]:text-48px min-[640px]:leading-52px">
                    {count ?? '—'}
                  </span>
                  {count != null && <span className="text-12px">{unit}</span>}
                </dd>
              </div>
            ))}
            <div
              className={`${hoverTile} relative flex flex-col justify-center pl-17 min-[360px]:col-span-2 min-[640px]:pl-20`}
              style={rolePalette}
            >
              <dt className="text-13px leading-18px font-600 opacity-85">
                {'role' in system ? '我的角色' : '加入状态'}
              </dt>
              <dd className="m-0 text-22px leading-30px font-800">
                <span
                  className="absolute left-4 top-1/2 grid size-46px -translate-y-1/2 place-items-center rounded-control bg-surface"
                  aria-hidden="true"
                >
                  <span className={`${roleTag?.icon ?? 'i-lucide-user-round'} size-5`} />
                </span>
                {'role' in system
                  ? role
                    ? systemRoleLabels[role]
                    : '角色未配置'
                  : system.userRelation
                    ? '已加入'
                    : '未加入'}
              </dd>
            </div>
          </dl>

          <section className={panel}>
            <h3 className="m-0 text-14px leading-5 font-700">系统描述</h3>
            <p className="m-0 mt-3.5 break-words text-14px leading-6 text-text">
              {descriptionText(system.systemDesc)}
            </p>
          </section>
          <section className={panel}>
            <h3 className="m-0 text-14px leading-5 font-700">组织归属</h3>
            <dl className="m-0 mt-3.5 grid">
              <OrganizationNode label="所属科室" hasNext>
                <CodeName value={system.ownRoom} />
              </OrganizationNode>
              <OrganizationNode label="所属室组">
                <CodeName value={system.ownGroup} />
              </OrganizationNode>
            </dl>
          </section>
        </div>
        <div className="mt-3.5 grid gap-3.5 min-[640px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <DetailPeople
            key={`${system.systemName}:owners`}
            className={panel}
            twoColumns
            label="系统负责人"
            value={system.systemCharges}
          />
          <DetailPeople
            key={`${system.systemName}:approvers`}
            className={panel}
            label="指定审批人"
            value={system.approverCharge}
          />
        </div>
      </div>
    </Modal>
  );
}
