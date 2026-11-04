/**
 * 系统目录卡片：参照 Vercel Projects / GitHub 仓库卡片的克制层级——身份与重要性在上，描述之后
 * 紧跟醒目的参数入口，角色与负责人收进底部轻量元信息栏；彩色只留给重要性和参数入口，
 * 角色与关系标签不参与授权。
 */
import { Avatar, Badge, Button, Descriptions, Dropdown, Modal, Tag, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router';
import type { AllSystemInfo, MySystemInfo, SystemInfo } from '@/types/systems';
import { descriptionText } from '@/utils/systems';
import { platformHome } from '@/router/paths';
import {
  peopleList,
  peopleNames,
  riskLevelColor,
  riskLevelLabel,
  systemRoleLabels,
  systemRoleTags,
} from '../model/presentation';

/** 未接入的管理操作集中收纳并禁用，避免与可用的参数入口争夺注意力。 */
function MySystemActions({ systemName }: { systemName: string }) {
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: [
          { key: 'settings', label: '系统管理（待接入）', disabled: true },
          { key: 'users', label: '用户权限管理（待接入）', disabled: true },
          { key: 'leave', label: '退出系统（待接入）', disabled: true },
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

/**
 * 参数入口是卡片的主操作，位于描述与元信息之间：两种平台用不同预设色的大号填充按钮区分，
 * 名称与数量分两行呈现；零数量和缺失数量不影响进入工作区。
 */
function SystemEntries({ system }: { system: SystemInfo }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-2">
      {(
        [
          {
            platform: 'application',
            label: '应用参数',
            icon: 'i-lucide-file-code-2',
            color: 'primary',
            count: system.appCount,
            unit: '个应用',
          },
          {
            platform: 'database',
            label: '数据库参数',
            icon: 'i-lucide-database',
            color: 'cyan',
            count: system.paramTypeCount,
            unit: '种参数类型',
          },
        ] as const
      ).map(({ platform, label, icon, color, count, unit }) => (
        <Tooltip key={platform} title={`${count ?? '—'} ${unit}`}>
          <Button
            block
            color={color}
            variant="filled"
            className={`
              group/entry h-60px! min-w-0! px-3.5! justify-start! gap-3!
              [&>span:not(.ant-btn-icon)]:min-w-0 [&>span:not(.ant-btn-icon)]:flex-1
            `}
            icon={<span className={`${icon} w-20px h-20px`} aria-hidden="true" />}
            onClick={() => navigate(platformHome(system.systemName, platform))}
            aria-label={`进入 ${system.systemName} ${label}，${count ?? '—'} ${unit}`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="flex flex-col items-start min-w-0 flex-1 text-left">
                <span className="max-w-full truncate text-14px leading-20px font-600">{label}</span>
                <span className="max-w-full truncate text-12px leading-18px opacity-75">
                  <span className="font-600 tabular-nums">{count ?? '—'}</span> {unit}
                </span>
              </span>
              <span
                className="i-lucide-arrow-right w-16px h-16px shrink-0 transition-transform group-hover/entry:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

/** 重要性只用一枚小号预设色标签表达，A 级最醒目；文字等级保留，色彩不是唯一信息来源。 */
function RiskTag({ level }: { level: string | undefined }) {
  return (
    <Tag
      variant="filled"
      color={riskLevelColor(level)}
      className="m-0! shrink-0! px-1.5! text-12px! leading-20px! font-500!"
      title="系统重要性等级"
      aria-label={riskLevelLabel(level)}
    >
      {level ? `${level} 级` : '未分级'}
    </Tag>
  );
}

/** 我的角色或加入状态以色点 + 文字呈现，比实心标签更轻；颜色只辅助辨识，不推导访问权限。 */
function RelationBadge({ system }: { system: MySystemInfo | AllSystemInfo }) {
  const badge =
    'role' in system
      ? {
          color: systemRoleTags[system.role]?.color ?? 'default',
          text: systemRoleLabels[system.role] || '角色未配置',
        }
      : system.userRelation
        ? { color: 'green', text: '已加入' }
        : { color: 'default', text: '未加入' };
  return (
    <Badge
      color={badge.color === 'default' ? 'var(--color-text-muted)' : badge.color}
      text={badge.text}
      className="min-w-0 [&_.ant-badge-status-text]:text-12px! [&_.ant-badge-status-text]:text-text-secondary!"
    />
  );
}

/** 负责人以姓氏头像堆叠展示，超出部分收进 +N；姓名与编号放在悬停提示里。 */
function Owners({ value }: { value: string | undefined }) {
  const people = peopleList(value);
  if (people.length === 0) {
    return <span className="shrink-0 text-12px text-text-muted">负责人未配置</span>;
  }
  return (
    <Avatar.Group
      size={22}
      max={{
        count: 3,
        style: {
          background: 'var(--color-hover)',
          color: 'var(--color-accent-text)',
          fontSize: 11,
          cursor: 'pointer',
        },
        popover: { title: `全部负责人（${people.length}）` },
      }}
      aria-label={`负责人：${peopleNames(value)}`}
      className="shrink-0"
    >
      {people.map((person) => (
        <Tooltip
          key={person.key}
          title={`负责人：${person.id ? `${person.name} · ${person.id}` : person.name}`}
        >
          <Avatar
            size={22}
            className="bg-hover! text-accent-text! text-11px! font-600! cursor-default"
            aria-label={person.name}
          >
            {person.initial}
          </Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
}

/** 两份目录共用卡片；角色和加入状态只读取各自接口字段，不推导访问权限。 */
export function SystemCard({
  system,
  onDetails,
}: {
  system: MySystemInfo | AllSystemInfo;
  onDetails: () => void;
}) {
  const description = descriptionText(system.systemDesc);
  const isMine = 'role' in system;
  const joined = isMine || Boolean(system.userRelation);
  // 名称缩写只帮助视觉定位，不生成持久标识或推导系统类别。
  const initials = Array.from(system.systemName).slice(0, 2).join('').toUpperCase();
  const subtitle = [system.systemChineseName || '暂无中文名称', system.systemArchNo]
    .filter(Boolean)
    .join(' · ');
  return (
    <article
      className={`
        workspace-panel flex flex-col min-w-0 overflow-hidden
        transition-[border-color,box-shadow] duration-200
        hover:border-accent-border-hover
        hover:shadow-[0_8px_20px_-14px_var(--color-tree-filter-shadow)]
        focus-within:border-accent motion-reduce:transition-none
      `}
      aria-label={`${system.systemName} ${isMine ? '我的系统' : '所有系统'}`}
    >
      <div className="flex flex-col flex-1 gap-3 p-5">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`
              flex h-36px w-36px shrink-0 items-center justify-center rounded-ui font-mono
              text-13px font-600 tracking-wide
              ${joined ? 'bg-hover text-accent-text' : 'border border-solid border-border-subtle text-text-muted'}
            `}
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 min-w-0 text-15px leading-20px font-600">
              <Tooltip title={`${system.systemName} · 查看系统详情`}>
                <Button
                  type="text"
                  onClick={onDetails}
                  aria-label={`查看 ${system.systemName} 详情`}
                  className={`
                    block! max-w-full! h-auto! p-0! text-text! text-15px! font-600! leading-20px!
                    hover:text-accent-text! hover:bg-transparent! focus-visible:outline-2
                    focus-visible:outline-solid focus-visible:outline-accent [&>span]:truncate
                  `}
                >
                  {system.systemName}
                </Button>
              </Tooltip>
            </h2>
            <Typography.Paragraph
              ellipsis={{
                rows: 1,
                tooltip: `${system.systemChineseName || '暂无中文名称'} · 架构办子系统编码：${system.systemArchNo || '未配置'}`,
              }}
              className="m-0! mt-0.5! text-12px! leading-16px! text-text-muted!"
            >
              {subtitle}
            </Typography.Paragraph>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <RiskTag level={system.sysRiskLevel} />
            {isMine && <MySystemActions systemName={system.systemName} />}
          </div>
        </div>
        <Typography.Paragraph
          ellipsis={{ rows: 2, tooltip: { title: description, placement: 'top' } }}
          className="m-0! h-40px text-13px! leading-20px! text-text-secondary! break-words"
        >
          {description}
        </Typography.Paragraph>
        <SystemEntries system={system} />
      </div>
      <div className="flex items-center justify-between gap-3 min-w-0 h-44px px-5 border-t border-t-solid border-t-border-subtle">
        <RelationBadge system={system} />
        <Owners value={system.systemCharges} />
      </div>
    </article>
  );
}
/** 长文本与人员编号在详情中完整显示；���述仅以安全文本展示，绝不注入接口 HTML。 */
export function SystemDetailsModal({
  system,
  onClose,
}: {
  system: SystemInfo | MySystemInfo | AllSystemInfo;
  onClose: () => void;
}) {
  const items = [
    { key: 'name', label: '系统中文名', children: system.systemChineseName || '—' },
    { key: 'arch', label: '架构办子系统编码', children: system.systemArchNo || '—' },
    { key: 'risk', label: '系统重要性等级', children: system.sysRiskLevel || '—' },
    ...('role' in system
      ? [
          {
            key: 'role',
            label: '我的角色',
            children: systemRoleLabels[system.role] || '角色未配置',
          },
        ]
      : []),
    ...('userRelation' in system
      ? [
          {
            key: 'relation',
            label: '加入状态',
            children: system.userRelation ? '已加入' : '未加入',
          },
        ]
      : []),
    { key: 'description', label: '系统描述', children: descriptionText(system.systemDesc) },
    { key: 'room', label: '所属科室', children: system.ownRoom || '—' },
    { key: 'group', label: '所属室组', children: system.ownGroup || '—' },
    { key: 'charges', label: '系统负责人', children: system.systemCharges || '—' },
    { key: 'approvers', label: '指定审批人', children: system.approverCharge || '—' },
    { key: 'applications', label: '应用数量', children: system.appCount ?? '—' },
    { key: 'parameters', label: '数据库参数类型', children: system.paramTypeCount ?? '—' },
  ];
  return (
    <Modal
      open
      title={system.systemName}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={640}
    >
      <Descriptions
        column={1}
        size="small"
        className="mt-5 [&_.ant-descriptions-item-content]:break-words [&_.ant-descriptions-item-content]:min-w-0"
        items={items}
      />
    </Modal>
  );
}
