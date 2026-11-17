/** 系统目录卡片将系统身份、参数入口和成员信息分层展示。 */
import { App, Avatar, Button, Descriptions, Dropdown, Modal, Tag, Tooltip, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { requestSystemJoin } from '@/api/systems';
import { systemCatalogKey } from '@/queries/systems';
import type { AllSystemInfo, MySystemInfo, SystemInfo } from '@/types/systems';
import { descriptionText } from '@/utils/systems';
import { platformHome } from '@/router/paths';
import {
  peopleList,
  peopleNames,
  systemRoleLabels,
  systemRoleTags,
  organizationName,
  systemCardFrame,
  systemCardPadding,
  systemCardFooter,
} from '../model/presentation';

/** 未接入的管理操作集中收纳并禁用，避免与可用的参数入口争夺注意力。 */
function SystemActions({ systemName, isMember }: { systemName: string; isMember: boolean }) {
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: [
          { key: 'settings', label: '系统管理（待接入）', disabled: true },
          { key: 'users', label: '用户权限管理（待接入）', disabled: true },
          ...(isMember ? [{ key: 'leave', label: '退出系统（待接入）', disabled: true }] : []),
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
function SystemEntries({ system, locked }: { system: SystemInfo; locked: boolean }) {
  const navigate = useNavigate();
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
      ).map(({ platform, label, icon, count, unit }) => (
        <Button
          key={platform}
          block
          type="text"
          disabled={locked}
          className={`h-92px! min-w-0! px-1! rounded-ui! layout-focus ${locked ? 'text-text-muted!' : 'text-text! hover:bg-hover!'}`}
          onClick={() => navigate(platformHome(system.systemName, platform))}
          aria-label={`${system.systemName} ${label}，${count ?? '—'} ${unit}${locked ? '，加入后可进入' : ''}`}
        >
          <span className="flex w-full min-w-0 flex-col items-center gap-2">
            <span
              className={`relative inline-flex ${locked ? 'text-text-muted' : 'text-accent-text'}`}
              aria-hidden="true"
            >
              <span className={`${icon} size-36px`} />
              <span
                className={`absolute -top-1 left-[calc(100%-6px)] min-w-18px rounded-full px-1 text-center text-11px leading-16px font-600 tabular-nums ring-2 ring-surface ${locked ? 'bg-divider text-text-muted' : 'bg-accent text-on-accent'}`}
              >
                {count ?? '—'}
              </span>
            </span>
            <span className="max-w-full truncate text-14px leading-18px">{label}</span>
          </span>
        </Button>
      ))}
    </div>
  );
}

/** 待审批来自目录响应，刷新或翻页后仍可见；提交成功也不会开放入口。 */
function JoinSystemAction({ system }: { system: AllSystemInfo }) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: requestSystemJoin,
    onSuccess: () => {
      void message.success('加入申请已提交');
      return client.invalidateQueries({ queryKey: systemCatalogKey });
    },
    onError: (error) => void message.error(error.message),
  });

  if (system.joinRequestPending || mutation.isSuccess) {
    return (
      <Tag className="m-0!" color="gold" variant="filled">
        待审批
      </Tag>
    );
  }

  return (
    <Typography.Link
      role="button"
      tabIndex={0}
      aria-disabled={mutation.isPending}
      className="inline-flex items-center gap-1 text-12px! layout-focus"
      aria-label={`申请加入 ${system.systemName}`}
      onClick={() => {
        if (!mutation.isPending) mutation.mutate(system.systemName);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (!event.repeat) event.currentTarget.click();
        }
      }}
    >
      <span className="i-lucide-user-round-plus size-12px shrink-0" aria-hidden="true" />
      <span>{mutation.isPending ? '提交中…' : '申请加入'}</span>
    </Typography.Link>
  );
}

const riskLevelColors: Partial<Record<string, string>> = {
  A: 'red',
  B: 'orange',
  C: 'gold',
};

/** 卡片保留等级文字，预设色随主题适配。 */
function RiskTag({ level }: { level?: string }) {
  const grade = level?.trim().toUpperCase();
  return (
    <Tag
      variant="outlined"
      color={grade ? riskLevelColors[grade.charAt(0)] : undefined}
      className="m-0! inline-flex! h-18px! shrink-0! items-center rounded-full! bg-surface! px-1.5! text-11px! leading-none! font-600!"
      title="系统重要性等级"
    >
      <span>{grade ? `${grade} 级` : '未分级'}</span>
    </Tag>
  );
}

/** 我的系统卡片根据目录角色显示标签。 */
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

/** 负责人以姓氏头像堆叠展示，超出部分收进 +N；姓名与编号放在悬停提示里。 */
function Owners({ value }: { value: string | undefined }) {
  const people = peopleList(value);
  if (people.length === 0) {
    return <span className="shrink-0 text-12px text-text-muted">负责人未配置</span>;
  }
  return (
    <Avatar.Group
      size={24}
      max={{
        count: 3,
        style: {
          background: 'var(--color-divider)',
          color: 'var(--color-text-secondary)',
          fontSize: 12,
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
            size={24}
            className="bg-hover! text-accent-text! text-12px! font-500! cursor-default"
            aria-label={person.name}
          >
            {person.initial}
          </Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
}

/** 两份目录共用卡片；入口状态由目录传入，实际访问仍由路由校验。 */
export function SystemCard({
  system,
  onDetails,
  entriesLocked = false,
}: {
  system: MySystemInfo | AllSystemInfo;
  onDetails: () => void;
  entriesLocked?: boolean;
}) {
  const description = descriptionText(system.systemDesc);
  const isMine = 'role' in system;
  const subtitle = [
    system.systemChineseName || '暂无中文名称',
    system.ownGroup && organizationName(system.ownGroup),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <article
      className={`
        ${systemCardFrame}
        transition-[border-color,box-shadow] duration-200
        hover:border-accent-border-hover
        hover:shadow-[0_8px_24px_var(--color-tree-filter-shadow)]
        focus-within:border-accent motion-reduce:transition-none
      `}
      aria-label={`${system.systemName} ${isMine ? '我的系统' : '所有系统'}`}
    >
      <div className={`flex flex-1 flex-col gap-2.5 ${systemCardPadding}`}>
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 flex min-w-0 items-center gap-1.5">
              <Tooltip title={`${system.systemName} · 查看系统详情`}>
                <Button
                  type="text"
                  onClick={onDetails}
                  aria-label={`查看 ${system.systemName} 详情`}
                  className={`
                    inline-flex! h-24px! min-w-0! max-w-full! items-center! p-0! text-text! text-18px! font-600! leading-24px!
                    hover:text-accent-text! hover:bg-transparent! focus-visible:outline-2
                    focus-visible:outline-solid focus-visible:outline-accent [&>span]:truncate
                  `}
                >
                  {system.systemName}
                </Button>
              </Tooltip>
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
          {!entriesLocked && (
            <SystemActions
              systemName={system.systemName}
              isMember={isMine || system.userRelation === true}
            />
          )}
        </div>
        <Typography.Paragraph
          ellipsis={{ rows: 2, tooltip: { title: description, placement: 'top' } }}
          className="m-0! text-14px! leading-18px! text-text-secondary! break-words"
        >
          {description}
        </Typography.Paragraph>
        {/* 描述按实际行数排版；同行卡片等高时把剩余高度放在入口上方，入口仍逐行对齐。 */}
        <div className="mt-auto pt-1">
          <SystemEntries system={system} locked={entriesLocked} />
        </div>
      </div>
      <div
        className={`flex min-w-0 flex-wrap items-center justify-between gap-2 ${systemCardPadding} ${systemCardFooter}`}
      >
        <Owners value={system.systemCharges} />
        {isMine && <SystemRoleTag system={system} />}
        {!isMine && entriesLocked && <JoinSystemAction system={system} />}
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
