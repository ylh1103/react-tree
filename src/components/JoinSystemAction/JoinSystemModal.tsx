/** 选择申请角色、生成分享链接并展示系统负责人。 */
import { useEffect, useState } from 'react';
import { Alert, App, Button, Input, Modal, Radio, Space } from 'antd';
import { useHref } from 'react-router';
import PersonChatButton from '@/components/PersonChatButton';
import { useAppSelector } from '@/store/hooks';
import type { SystemJoinTarget, SystemRole } from '@/types/systems';
import { systemJoinRequestPath } from '@/utils/systemJoinLink';
import { systemJoinRoleLabels } from '@/utils/systemRoles';
import { peopleList } from '@/utils/systemPeople';

/** 角色图标与定位说明；V/D/R 暂不区分操作权限，仅描述身份，不承诺具体权限。 */
const roleMetadata: Record<SystemRole, { description: string; icon: string }> = {
  V: {
    description: '仅查看参数，不可编辑和发布',
    icon: 'i-lucide-eye',
  },
  D: {
    description: '可编辑并发布参数',
    icon: 'i-lucide-code-xml',
  },
  R: {
    description: '编辑发布参数，并管理系统成员',
    icon: 'i-lucide-user-round-check',
  },
};

const roleOptions = (Object.keys(systemJoinRoleLabels) as SystemRole[]).map((value) => ({
  value,
  label: systemJoinRoleLabels[value],
  ...roleMetadata[value],
}));

export default function JoinSystemModal({
  system,
  onClose,
}: {
  system: SystemJoinTarget;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const ystId = useAppSelector((state) => state.user.userInfo?.ystId);
  const userName = useAppSelector((state) => state.user.userInfo?.userName)?.trim();
  const [role, setRole] = useState<SystemRole>('R');
  const [copied, setCopied] = useState(false);
  // 复制反馈 2 秒后恢复，切换角色会生成新链接，也同步重置。
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const href = useHref(
    ystId && userName
      ? systemJoinRequestPath({
          ystId,
          userName,
          systemName: system.systemName,
          systemChineseName: system.systemChineseName,
          role,
        })
      : '.',
  );
  const shareHref = ystId && userName ? new URL(href, window.location.href).href : '';
  const owners = [
    ...new Map(peopleList(system.systemCharges).map((person) => [person.key, person])).values(),
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareHref);
      setCopied(true);
    } catch {
      void message.warning('无法自动复制，请选中链接手动复制');
    }
  }

  return (
    <Modal
      open
      centered
      width="min(580px, calc(100vw - 32px))"
      title={<span className="text-18px font-600 text-text">申请加入系统</span>}
      onCancel={onClose}
      footer={null}
      classNames={{ body: 'pt-3!' }}
    >
      <div className="grid min-w-0 gap-5">
        <section
          aria-label="申请系统"
          className="flex min-w-0 items-center gap-3 rounded-ui border border-solid border-border-subtle bg-sidebar px-3.5 py-3"
        >
          <span
            className="flex size-40px shrink-0 items-center justify-center rounded-control bg-hover text-accent-text"
            aria-hidden="true"
          >
            <span className="i-lucide-layers size-18px" />
          </span>
          <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            <div className="text-15px font-600 leading-22px text-text">{system.systemName}</div>
            {system.systemChineseName && (
              <div className="mt-0.5 text-12px leading-18px text-text-secondary">
                {system.systemChineseName}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-2.5" aria-labelledby="join-system-role-label">
          <h3 id="join-system-role-label" className="m-0 text-13px font-600 leading-20px text-text">
            申请角色
          </h3>
          <Radio.Group
            aria-labelledby="join-system-role-label"
            className="w-full"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setCopied(false);
            }}
          >
            <div className="grid grid-cols-3 gap-3 [@media(max-width:500px)]:grid-cols-1">
              {roleOptions.map(({ value, label, description, icon }) => {
                const selected = role === value;
                return (
                  <Radio
                    key={value}
                    value={value}
                    classNames={{
                      icon: 'absolute! top-3.5! right-3.5! m-0! z-1',
                      label: 'flex! h-full w-full min-w-0 flex-col p-3.5! pt-3!',
                    }}
                    className={`relative m-0! flex! h-full w-full min-w-0 items-stretch! rounded-ui border border-solid p-0! after:hidden! transition-[border-color,background-color,box-shadow] duration-150 motion-reduce:transition-none ${
                      selected
                        ? 'border-accent bg-hover shadow-[0_1px_4px_var(--color-tree-preview-shadow)]'
                        : 'border-border-subtle bg-surface hover:border-accent-border hover:bg-sidebar/60'
                    }`}
                  >
                    <span
                      className={`flex h-20px items-center pr-6 transition-colors duration-150 motion-reduce:transition-none ${
                        selected ? 'text-accent-text' : 'text-text-secondary'
                      }`}
                      aria-hidden="true"
                    >
                      <span className={`${icon} size-18px`} />
                    </span>
                    <span className="mt-2.5 text-14px font-600 leading-20px text-text">
                      {label}
                    </span>
                    <span className="mt-1 text-12px font-400 leading-18px text-text-secondary [text-wrap:pretty]">
                      {description}
                    </span>
                  </Radio>
                );
              })}
            </div>
          </Radio.Group>
        </section>

        {shareHref ? (
          <section className="grid min-w-0 gap-2">
            <label htmlFor="join-system-link" className="text-13px font-600 leading-20px text-text">
              申请链接
            </label>
            <Space.Compact block>
              <Input
                id="join-system-link"
                readOnly
                aria-describedby="join-system-link-help"
                className="h-36px! min-w-0 truncate bg-sidebar! font-mono text-12px! text-text-secondary!"
                value={shareHref}
                onFocus={(event) => event.target.select()}
              />
              <Button
                type="primary"
                className="h-36px! min-w-104px! shrink-0 active:scale-[0.98] transition-transform duration-100 motion-reduce:transition-none"
                icon={
                  <span
                    className={`${copied ? 'i-lucide-check' : 'i-lucide-copy'} size-14px`}
                    aria-hidden="true"
                  />
                }
                onClick={() => void copyLink()}
              >
                {copied ? '已复制' : '复制链接'}
              </Button>
            </Space.Compact>
            <p id="join-system-link-help" className="m-0 text-12px leading-18px text-text-muted">
              复制链接后，请发送给下方系统负责人审批。
            </p>
          </section>
        ) : (
          <Alert showIcon type="warning" title="当前账号缺少姓名或 ystId，无法生成申请链接。" />
        )}

        <section className="grid min-w-0 gap-2.5" aria-labelledby="join-system-owner-label">
          <div className="flex items-center justify-between gap-2">
            <h3
              id="join-system-owner-label"
              className="m-0 flex items-center gap-2 text-13px font-600 leading-20px text-text"
            >
              系统负责人
              <span className="rounded-full bg-sidebar px-2 py-0.5 text-11px font-500 leading-16px text-text-secondary tabular-nums">
                {owners.length}
              </span>
            </h3>
          </div>
          {owners.length ? (
            <ul
              aria-labelledby="join-system-owner-label"
              className="m-0 grid max-h-184px list-none grid-cols-2 gap-2.5 overflow-y-auto overscroll-contain p-0 [@media(max-width:440px)]:grid-cols-1"
            >
              {owners.map(({ key, name, id, initial }) => (
                <li key={key} className="min-w-0 max-w-full">
                  <PersonChatButton name={name} id={id} initial={initial} />
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-13px text-text-secondary">暂无系统负责人</span>
          )}
        </section>
      </div>
    </Modal>
  );
}
