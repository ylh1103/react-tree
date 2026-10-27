/** 系统卡片复用参考图的身份区、双参数入口与底部摘要；角色和加入状态只展示，不参与授权。 */
import { Button, Descriptions, Modal, Tag, Tooltip } from 'antd';
import { useNavigate } from 'react-router';
import type { AllSystemInfo, MySystemInfo, SystemInfo } from '@/types/systems';
import { descriptionText } from '@/utils/systems';
import { platformHome } from '@/router/paths';
import { organizationName, peopleNames, systemRoleLabels } from '../model/presentation';

/** 我的系统预留三个操作入口，保持可交互外观并通过提示说明功能待接入。 */
function MySystemActions({ systemName }: { systemName: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-1"
      role="group"
      aria-label={`${systemName} 操作`}
    >
      {[
        { label: '系统管理', icon: 'i-lucide-settings' },
        { label: '用户权限管理', icon: 'i-lucide-users-round' },
        { label: '退出系统', icon: 'i-lucide-log-out' },
      ].map(({ label, icon }) => (
        <Tooltip key={label} title={`${label}（待接入）`}>
          <Button
            type="text"
            size="small"
            aria-label={`${systemName} ${label}（待接入）`}
            icon={<span className={`${icon} w-15px h-15px`} aria-hidden="true" />}
          />
        </Tooltip>
      ))}
    </div>
  );
}

/** 两个完整的 Ant Design 按钮提供参数入口，零数量系统仍可进入工作区。 */
function SystemEntries({ system }: { system: SystemInfo }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 my-5">
      {(
        [
          { platform: 'application', label: '应用参数', icon: 'i-lucide-file-code-2' },
          { platform: 'database', label: '数据库参数', icon: 'i-lucide-database' },
        ] as const
      ).map(({ platform, label, icon }) => (
        <div
          key={platform}
          className={platform === 'database' ? 'border-l border-l-solid border-divider' : ''}
        >
          <Button
            type="text"
            className="flex! flex-col! h-100px! w-full! gap-3! rounded-0! text-text! shadow-none! hover:bg-hover! focus-visible:outline-accent motion-reduce:transition-none!"
            onClick={() => navigate(platformHome(system.systemName, platform))}
            aria-label={`进入 ${system.systemName} ${label}`}
          >
            <span className={`${icon} w-34px h-34px text-accent`} aria-hidden="true" />
            <span className="text-14px">{label}</span>
          </Button>
        </div>
      ))}
    </div>
  );
}

/** 我的系统与全部系统共用结构，关系字段由各自接口返回，卡片不自行推断成员身份。 */
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
      className="workspace-panel flex flex-col min-w-0 overflow-hidden border-t-3 border-t-accent"
      aria-label={`${system.systemName} ${isMine ? '我的系统' : '所有系统'}`}
    >
      <div className="px-4 pt-3">
        <div className="flex items-start gap-2 min-w-0">
          <h2
            className="m-0 min-w-0 flex-1 text-17px leading-26px font-600 truncate"
            title={system.systemName}
          >
            {isMine ? (
              <Tooltip title="查看系统详情">
                <Button
                  type="text"
                  onClick={onDetails}
                  aria-label={`查看 ${system.systemName} 详情`}
                  className="block! max-w-full! h-auto! p-0! text-text! text-17px! font-600! leading-26px! [&>span]:truncate"
                >
                  {system.systemName}
                </Button>
              </Tooltip>
            ) : (
              system.systemName
            )}
          </h2>
          {!isMine && (
            <Tag variant="filled" className="m-0! shrink-0! text-12px!">
              {system.userRelation ? '已加入' : '未加入'}
            </Tag>
          )}
          {isMine ? (
            <MySystemActions systemName={system.systemName} />
          ) : (
            <Tooltip title="查看系统详情">
              <Button
                type="text"
                size="small"
                aria-label={`查看 ${system.systemName} 详情`}
                onClick={onDetails}
                className="shrink-0 text-text-secondary!"
                icon={<span className="i-lucide-info w-15px h-15px" aria-hidden="true" />}
              />
            </Tooltip>
          )}
        </div>
        <p
          className="m-0 mt-1 text-13px leading-22px text-text-secondary truncate"
          title={system.systemChineseName}
        >
          {system.systemChineseName || '暂无中文名称'}
        </p>
        <Tooltip title={system.systemCharges || '暂未配置'}>
          <p className="m-0 text-12px leading-22px text-text-muted truncate">
            系统负责人：{peopleNames(system.systemCharges)}
          </p>
        </Tooltip>
        <div className="flex items-center gap-2 text-12px leading-22px text-text-muted">
          <span
            className="min-w-0 flex-1 truncate"
            title={`架构办子系统编码：${system.systemArchNo}`}
          >
            {system.systemArchNo || '暂无架构编码'}
          </span>
          <span className="shrink-0" title="系统重要性等级">
            {system.sysRiskLevel ? `${system.sysRiskLevel} 级` : '等级未配置'}
          </span>
        </div>
      </div>
      <SystemEntries system={system} />
      <div className="flex items-start gap-3 px-4 py-3 bg-sidebar border-t border-t-solid border-divider">
        {isMine && (
          <Tag variant="filled" className="m-0! mt-0.5! shrink-0! whitespace-nowrap! text-12px!">
            {systemRoleLabels[system.role] || '角色未配置'}
          </Tag>
        )}
        <div className="min-w-0 flex-1">
          <Tooltip title={description}>
            <p className="m-0 text-13px leading-22px text-text-secondary truncate">{description}</p>
          </Tooltip>
          <div className="flex flex-wrap items-center gap-x-4 text-12px leading-22px text-text-muted">
            <span>
              应用数{' '}
              <strong className="text-text font-600 tabular-nums">{system.appCount ?? '—'}</strong>
            </span>
            <span>
              参数类型数{' '}
              <strong className="text-text font-600 tabular-nums">
                {system.paramTypeCount ?? '—'}
              </strong>
            </span>
          </div>
          <Tooltip
            title={[system.ownRoom, system.ownGroup].filter(Boolean).join(' / ') || '暂未配置'}
          >
            <p className="m-0 text-12px leading-22px text-text-muted truncate">
              {organizationName(system.ownRoom)} / {organizationName(system.ownGroup)}
            </p>
          </Tooltip>
        </div>
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
