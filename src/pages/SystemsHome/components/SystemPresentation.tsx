/** 系统目录以名称识别、参数快捷入口和负责人分层展示；角色与关系标签不参与授权。 */
import { Avatar, Button, Descriptions, Dropdown, Modal, Tag, Tooltip } from 'antd';
import { useNavigate } from 'react-router';
import type { AllSystemInfo, MySystemInfo, SystemInfo } from '@/types/systems';
import { descriptionText } from '@/utils/systems';
import { platformHome } from '@/router/paths';
import {
  peopleList,
  peopleNames,
  riskLevelColor,
  riskLevelLabel,
  riskLevelMax,
  riskLevelRank,
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
 * 参数入口是卡片的主操作：两种平台用不同预设色的填充按钮区分，数量作为按钮内徽标；
 * 零数量和缺失数量不影响进入工作区。
 */
function SystemEntries({ system }: { system: SystemInfo }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-2 px-4 pb-4">
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
              group/entry h-40px! min-w-0! px-3! justify-start! gap-2! font-500!
              [&>span:not(.ant-btn-icon)]:min-w-0 [&>span:not(.ant-btn-icon)]:flex-1
            `}
            icon={<span className={`${icon} w-16px h-16px`} aria-hidden="true" />}
            onClick={() => navigate(platformHome(system.systemName, platform))}
            aria-label={`进入 ${system.systemName} ${label}，${count ?? '—'} ${unit}`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">{label}</span>
              <span className="ml-auto shrink-0 text-12px leading-18px font-600 tabular-nums opacity-75">
                {count ?? '—'}
              </span>
              <span
                className="i-lucide-arrow-right w-14px h-14px shrink-0 transition-transform group-hover/entry:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

/** 重要性用预设色标签 + 信号格呈现，A 级最满最醒目；文字等级同时保留，色彩不是唯一信息来源。 */
function RiskTag({ level }: { level: string | undefined }) {
  const rank = riskLevelRank(level);
  return (
    <Tag
      variant="filled"
      color={riskLevelColor(level)}
      className="m-0! shrink-0! inline-flex! items-center! gap-1.5! text-12px! leading-20px!"
      title="系统重要性等级"
      aria-label={riskLevelLabel(level)}
    >
      <span className="flex items-end gap-2px h-10px" aria-hidden="true">
        {Array.from({ length: riskLevelMax }, (_, index) => (
          <span
            key={index}
            className={`w-2px rounded-1px bg-current ${index < rank ? '' : 'opacity-25'}`}
            style={{ height: `${((index + 1) / riskLevelMax) * 100}%` }}
          />
        ))}
      </span>
      <span aria-hidden="true">{level ? `${level} 级` : '未分级'}</span>
    </Tag>
  );
}

/** 我的角色或加入状态；颜色只辅助辨识，不推导访问权限。 */
function RelationTag({ system }: { system: MySystemInfo | AllSystemInfo }) {
  const tag =
    'role' in system
      ? {
          color: systemRoleTags[system.role]?.color ?? 'default',
          icon: systemRoleTags[system.role]?.icon ?? 'i-lucide-user-round',
          text: systemRoleLabels[system.role] || '角色未配置',
        }
      : system.userRelation
        ? { color: 'green', icon: 'i-lucide-circle-check', text: '已加入' }
        : { color: 'default', icon: 'i-lucide-circle-dashed', text: '未加入' };
  return (
    <Tag
      variant="filled"
      color={tag.color}
      className="m-0! shrink-0! inline-flex! items-center! gap-1! text-12px! leading-20px!"
    >
      <span className={`${tag.icon} w-12px h-12px`} aria-hidden="true" />
      {tag.text}
    </Tag>
  );
}

/** 负责人以姓氏头像堆叠展示；姓名与编号放在悬停提示里，单人时补充姓名便于直接识别。 */
function Owners({ value }: { value: string | undefined }) {
  const people = peopleList(value);
  return (
    <div className="flex items-center gap-2 mt-3 min-w-0 h-28px text-12px leading-20px">
      <span className="shrink-0 text-text-muted">负责人</span>
      {people.length === 0 ? (
        <span className="text-text-muted">暂未配置</span>
      ) : (
        <>
          <Avatar.Group
            size={24}
            max={{
              count: 4,
              style: {
                background: 'var(--color-hover)',
                color: 'var(--color-accent-text)',
                fontSize: 11,
                cursor: 'pointer',
              },
              popover: { title: `全部负责人（${people.length}）` },
            }}
            aria-label={`负责人：${peopleNames(value)}`}
          >
            {people.map((person) => (
              <Tooltip key={person.key} title={person.id ? `${person.name} · ${person.id}` : person.name}>
                <Avatar
                  size={24}
                  className="bg-accent! text-on-accent! text-11px! font-600! cursor-default"
                  aria-label={person.name}
                >
                  {person.initial}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
          {people.length === 1 ? (
            <span className="truncate text-text-secondary">{people[0].name}</span>
          ) : (
            <span className="shrink-0 text-text-muted">{`${people.length} 人`}</span>
          )}
        </>
      )}
    </div>
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
  return (
    <article
      className={`
        group/card workspace-panel relative flex flex-col min-w-0 overflow-hidden
        transition-[border-color,box-shadow,transform] duration-200
        hover:border-accent-border-hover hover:-translate-y-0.5
        hover:shadow-[0_10px_24px_-12px_var(--color-tree-filter-shadow),0_2px_6px_-2px_var(--color-tree-preview-shadow)]
        focus-within:border-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0
      `}
      aria-label={`${system.systemName} ${isMine ? '我的系统' : '所有系统'}`}
    >
      <div className="flex-1 px-5 pt-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`
              flex h-44px w-44px shrink-0 items-center justify-center rounded-ui font-mono
              text-15px font-600 tracking-wide transition-colors
              ${
                joined
                  ? 'bg-accent text-on-accent'
                  : 'bg-hover text-accent-text border border-solid border-accent-border'
              }
            `}
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 min-w-0 text-16px leading-24px font-600">
              <Tooltip title={`${system.systemName} · 查看系统详情`}>
                <Button
                  type="text"
                  onClick={onDetails}
                  aria-label={`查看 ${system.systemName} 详情`}
                  className={`
                    block! max-w-full! h-auto! p-0! text-text! text-16px! font-600! leading-24px!
                    hover:text-accent-text! hover:bg-transparent! focus-visible:outline-2
                    focus-visible:outline-solid focus-visible:outline-accent [&>span]:truncate
                  `}
                >
                  {system.systemName}
                </Button>
              </Tooltip>
            </h2>
            <p
              className="m-0 text-12px leading-20px text-text-secondary truncate"
              title={system.systemChineseName}
            >
              {system.systemChineseName || '暂无中文名称'}
            </p>
          </div>
          {isMine && <MySystemActions systemName={system.systemName} />}
        </div>
        <div className="flex items-center gap-2 mt-4 min-w-0">
          <RelationTag system={system} />
          <RiskTag level={system.sysRiskLevel} />
          <span
            className="flex items-center min-w-0 ml-auto px-1.5 rounded-control border border-solid border-border-subtle text-11px leading-18px text-text-muted font-mono"
            title={`架构办子系统编码：${system.systemArchNo || '未配置'}`}
            aria-label={`架构办子系统编码：${system.systemArchNo || '未配置'}`}
          >
            <span className="truncate">{system.systemArchNo || '未配置'}</span>
          </span>
        </div>
        <Tooltip title={description}>
          <p className="m-0 mt-3 h-44px text-13px leading-22px text-text-secondary line-clamp-2 break-words">
            {description}
          </p>
        </Tooltip>
        <Owners value={system.systemCharges} />
      </div>
      <SystemEntries system={system} />
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
