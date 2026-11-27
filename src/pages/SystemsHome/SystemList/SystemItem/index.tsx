import { Button, Tag, Tooltip, Typography } from 'antd';
import { Link } from 'react-router';
import type { AllSystemInfo, MySystemInfo, SystemInfo } from '@/types/systems';
import { descriptionText } from '@/utils/systems';
import { platformHome } from '@/router/workspace/paths';
import JoinSystemAction from '@/components/JoinSystemAction';
import { systemRoleLabels } from '@/utils/systemRoles';
import { riskLevelAppearance, systemRoleTags } from '../../systemAppearance';
import {
  systemCardDescriptionHeight,
  systemCardFooter,
  systemCardFrame,
  systemCardPadding,
  systemEntryGrid,
  systemListBody,
  systemListFooter,
  systemListRow,
  type SystemView,
} from '../layout';
import SystemActions from './SystemActions';
import SystemOwners from './SystemOwners';

/** 两份目录和展示模式共用交互；入口状态由目录传入，实际访问仍由路由校验。 */
export default function SystemItem({
  system,
  onDetails,
  onManage,
  entriesLocked = false,
  showDelete = false,
  canManage,
  view,
}: {
  system: MySystemInfo | AllSystemInfo;
  onDetails: () => void;
  onManage: () => void;
  entriesLocked?: boolean;
  showDelete?: boolean;
  canManage: boolean;
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
      canManage={canManage}
      onDetails={onDetails}
      onManage={onManage}
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
            className={`m-0! text-13px! leading-18px! text-text-secondary! break-words ${compact ? '' : systemCardDescriptionHeight}`}
          >
            {description}
          </Typography.Paragraph>
        </div>
        <div className={compact ? 'min-w-0' : 'mt-auto'}>
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
          <SystemOwners value={system.systemCharges} />
        </div>
        {isMine && <SystemRoleTag system={system} />}
        {!isMine && entriesLocked && <JoinSystemAction system={system} />}
        {compact && actions && <div className="ml-auto">{actions}</div>}
      </div>
    </article>
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

/** 组织契约为编号/名称；只移除首个编号段，兼容名称本身包含斜线。 */
function organizationName(value: string | undefined) {
  if (!value) return '暂未配置';
  const separator = value.indexOf('/');
  return (separator < 0 ? value : value.slice(separator + 1)).trim() || '暂未配置';
}
