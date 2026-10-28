/** 系统卡片按身份、摘要、参数入口和负责人分层展示；关系标签仅展示接口信息，不参与授权。 */
import { Button, Descriptions, Dropdown, Modal, Tag, Tooltip } from 'antd';
import { useNavigate } from 'react-router';
import type { AllSystemInfo, MySystemInfo, SystemInfo } from '@/types/systems';
import { descriptionText } from '@/utils/systems';
import { platformHome } from '@/router/paths';
import { peopleNames, systemRoleLabels } from '../model/presentation';

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

/** 数量与对应参数入口一起展示；零数量和缺失数量不影响进入工作区。 */
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
          className={`
            h-64px! min-w-0! justify-start! gap-2! px-3! text-13px! bg-sidebar! hover:bg-hover!
            hover:border-accent-border-hover! shadow-none! motion-reduce:transition-none!
          `}
          icon={<span className={`${icon} w-18px h-18px text-accent-text`} aria-hidden="true" />}
          onClick={() => navigate(platformHome(system.systemName, platform))}
          aria-label={`进入 ${system.systemName} ${label}`}
        >
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="text-12px leading-20px text-text-secondary">{label}</span>
            <span className="text-11px leading-18px text-text-muted">
              <strong className="mr-1 text-15px font-600 tabular-nums text-text">
                {count ?? '—'}
              </strong>
              {unit}
            </span>
          </span>
        </Button>
      ))}
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
  return (
    <article
      className={`
        workspace-panel flex flex-col min-w-0 overflow-hidden transition-colors
        hover:border-accent-border-hover focus-within:border-accent motion-reduce:transition-none
      `}
      aria-label={`${system.systemName} ${isMine ? '我的系统' : '所有系统'}`}
    >
      <div className="flex-1 p-4">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="flex h-40px w-40px shrink-0 items-center justify-center rounded-control bg-hover text-accent-text"
            aria-hidden="true"
          >
            <span className="i-lucide-boxes h-21px w-21px" />
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
                    hover:text-accent-text! focus-visible:outline-2 focus-visible:outline-solid
                    focus-visible:outline-accent [&>span]:truncate
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
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Tag variant="filled" className="m-0! shrink-0! text-11px! leading-20px!">
            {isMine
              ? systemRoleLabels[system.role] || '角色未配置'
              : system.userRelation
                ? '已加入'
                : '未加入'}
          </Tag>
          <span className="text-11px leading-20px text-text-muted" title="系统风险等级">
            风险等级：{system.sysRiskLevel || '未配置'}
          </span>
        </div>
        <div className="mt-3 text-12px leading-20px text-text-muted">
          <span
            className="block truncate"
            title={`架构办子系统编码：${system.systemArchNo || '未配置'}`}
            aria-label={`架构办子系统编码：${system.systemArchNo || '未配置'}`}
          >
            架构编码：{system.systemArchNo || '未配置'}
          </span>
        </div>
        <Tooltip title={description}>
          <p className="m-0 mt-1 h-40px text-12px leading-20px text-text-secondary line-clamp-2 break-words">
            {description}
          </p>
        </Tooltip>
      </div>
      <SystemEntries system={system} />
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-t-solid border-divider text-12px leading-20px text-text-muted">
        <span className="i-lucide-user-round h-14px w-14px shrink-0" aria-hidden="true" />
        <Tooltip title={system.systemCharges || '暂未配置'}>
          <span className="min-w-0 flex-1 truncate">
            负责人：{peopleNames(system.systemCharges)}
          </span>
        </Tooltip>
        <Button
          type="text"
          size="small"
          onClick={onDetails}
          aria-label={`查看 ${system.systemName} 完整资料`}
          className="shrink-0 text-12px! text-text-secondary!"
        >
          详情
          <span className="i-lucide-chevron-right h-12px w-12px" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
/** 长文本与人员编号在详情中完整显示；描述仅以安全文本展示，绝不注入接口 HTML。 */
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
