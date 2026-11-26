import { Avatar, Button, Input, Modal, theme } from 'antd';
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { AllSystemInfo, MySystemInfo } from '@/types/systems';
import { peopleList } from '@/utils/systemPeople';
import { descriptionText } from '@/utils/systems';
import { systemRoleLabels } from '@/utils/systemRoles';
import { riskLevelAppearance, systemAvatarTone, systemRoleTags } from '../systemAppearance';

/** 系统详情以身份、规模、归属和人员四组 Bento 卡片展示。 */
export default function SystemDetailsModal({
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

const peopleItemAppearance = 'rounded-ui! bg-[var(--people-item-bg)]! hover:bg-hover!';

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
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const people = peopleList(value);
  const previewLimit = 6;
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
          style={{ '--people-item-bg': token.controlItemBgHover } as CSSProperties}
          className={`m-0 grid list-none gap-2 p-0 ${showAll ? 'max-h-236px overflow-y-auto overscroll-contain' : ''} ${twoColumns ? 'min-[480px]:grid-cols-2' : ''}`}
        >
          {visiblePeople.map(({ key, name, id, initial }) => (
            <li
              key={key}
              className={`flex min-w-0 items-center gap-2 p-2 pr-3 ${peopleItemAppearance}`}
            >
              <Avatar
                size={36}
                className={`${systemAvatarTone} shrink-0 text-14px!`}
                aria-hidden="true"
              >
                {initial}
              </Avatar>
              <span className="min-w-0 break-words">
                <span className="block text-14px font-700 leading-5">{name}</span>
                {id && (
                  <span className="block text-12px leading-4 text-text-secondary tabular-nums">
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
      <span className="text-12px font-500 text-text-secondary tabular-nums">
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
