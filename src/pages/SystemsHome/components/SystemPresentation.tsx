/** 系统目录展示将系统身份、参数入口和成员信息分层展示。 */
import {
  App,
  Avatar,
  Button,
  ConfigProvider,
  Descriptions,
  Dropdown,
  Modal,
  Popover,
  Segmented,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
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

/** 管理功能接入前，点击菜单项时提示当前状态。 */
function SystemActions({ systemName, isMember }: { systemName: string; isMember: boolean }) {
  const { message } = App.useApp();
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        onClick: () => void message.info('此功能暂未接入'),
        items: [
          { key: 'settings', label: '系统管理' },
          { key: 'users', label: '用户权限管理' },
          ...(isMember ? [{ key: 'leave', label: '退出系统' }] : []),
        ],
      }}
    >
      <Button
        type="text"
        size="small"
        aria-label={`${systemName} 更多操作`}
        className="shrink-0 text-text-muted!"
        icon={<span className="i-lucide-ellipsis w-16px h-16px" aria-hidden="true" />}
      />
    </Dropdown>
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
    <div className="relative grid grid-cols-2 gap-2 before:pointer-events-none before:absolute before:inset-y-2.5 before:left-1/2 before:border-l before:border-l-solid before:border-l-border-subtle before:content-empty">
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

const riskLevelColors: Partial<Record<string, string>> = {
  A: 'red',
  B: 'orange',
  C: 'cyan',
  D: 'purple',
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
      color={grade ? riskLevelColors[grade.charAt(0)] : undefined}
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
  view,
}: {
  system: MySystemInfo | AllSystemInfo;
  onDetails: () => void;
  entriesLocked?: boolean;
  view: SystemView;
}) {
  const compact = view === 'list';
  const description = descriptionText(system.systemDesc);
  const isMine = 'role' in system;
  const actions = !entriesLocked && (
    <SystemActions
      systemName={system.systemName}
      isMember={isMine || system.userRelation === true}
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
function DetailPeople({ value }: { value?: string }) {
  const people = peopleList(value);
  if (!people.length) return <span className="text-text-muted">未配置</span>;

  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {people.map(({ key, name, id }) => (
        <li
          key={key}
          className="min-w-0 max-w-full rounded-control bg-sidebar px-2 py-1 break-words"
        >
          <span className="font-500">{name}</span>
          {id && <span className="ml-1.5 text-12px text-text-secondary tabular-nums">{id}</span>}
        </li>
      ))}
    </ul>
  );
}

/** 详情按系统身份、规模、归属和人员组织；描述复用纯文本提取。 */
export function SystemDetailsModal({
  system,
  onClose,
}: {
  system: MySystemInfo | AllSystemInfo;
  onClose: () => void;
}) {
  const metadata = [
    { key: 'arch', label: '架构办子系统编码', children: system.systemArchNo || '—' },
    'role' in system
      ? { key: 'role', label: '我的角色', children: <SystemRoleTag system={system} /> }
      : {
          key: 'relation',
          label: '加入状态',
          children: (
            <Tag
              className="m-0!"
              variant="filled"
              color={system.userRelation ? 'green' : undefined}
            >
              {system.userRelation ? '已加入' : '未加入'}
            </Tag>
          ),
        },
    { key: 'room', label: '所属科室', children: system.ownRoom || '—' },
    { key: 'group', label: '所属室组', children: system.ownGroup || '—' },
  ];
  const counts = [
    { label: '应用数量', icon: 'i-lucide-file-code', count: system.appCount },
    { label: '数据库参数类型', icon: 'i-lucide-database', count: system.paramTypeCount },
  ];

  return (
    <Modal
      open
      title={
        <div className="pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 break-words text-22px font-600">{system.systemName}</span>
            <RiskTag level={system.sysRiskLevel} />
          </div>
          <p className="m-0 mt-1 break-words text-14px text-text-secondary font-normal">
            {system.systemChineseName || '暂无中文名称'}
          </p>
        </div>
      }
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={640}
    >
      <div className="mt-4 grid gap-4">
        <dl className="workspace-frame m-0 grid grid-cols-2 gap-2 bg-sidebar p-3">
          {counts.map(({ label, icon, count }) => (
            <div key={label} className="min-w-0 px-2">
              <dt className="flex items-center gap-1.5 text-12px text-text-secondary">
                <span
                  className={`${icon} size-16px shrink-0 text-accent-text`}
                  aria-hidden="true"
                />
                {label}
              </dt>
              <dd className="m-0 mt-1 text-22px font-600 tabular-nums">{count ?? '—'}</dd>
            </div>
          ))}
        </dl>
        <Descriptions
          size="small"
          layout="vertical"
          column={{ xs: 1, sm: 2 }}
          classNames={{ content: 'min-w-0 break-words' }}
          items={metadata}
        />
        <section className="border-t border-t-solid border-divider pt-3">
          <h3 className="workspace-page__title">系统描述</h3>
          <p className="m-0 mt-1 break-words text-text-secondary">
            {descriptionText(system.systemDesc)}
          </p>
        </section>
        <Descriptions
          className="border-t border-t-solid border-divider pt-3"
          size="small"
          layout="vertical"
          column={1}
          items={[
            {
              key: 'charges',
              label: '系统负责人',
              children: <DetailPeople value={system.systemCharges} />,
            },
            {
              key: 'approvers',
              label: '指定审批人',
              children: <DetailPeople value={system.approverCharge} />,
            },
          ]}
        />
      </div>
    </Modal>
  );
}
