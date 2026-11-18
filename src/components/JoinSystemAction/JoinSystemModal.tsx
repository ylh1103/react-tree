/** 选择申请角色、生成分享链接并展示系统负责人。 */
import { useState } from 'react';
import { Alert, App, Avatar, Button, Input, Modal, Radio, Space } from 'antd';
import { useHref } from 'react-router';
import { useAppSelector } from '@/store/hooks';
import type { SystemJoinTarget, SystemRole } from '@/types/systems';
import { systemJoinRequestPath } from '@/utils/systemJoinLink';
import { systemJoinRoleLabels } from '@/utils/systemRoles';
import { peopleList } from '@/utils/systemPeople';

const roleOptions = (Object.keys(systemJoinRoleLabels) as SystemRole[]).map((value) => ({
  value,
  label: systemJoinRoleLabels[value],
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
      void message.success('申请链接已复制');
    } catch {
      void message.warning('无法自动复制，请选中链接手动复制');
    }
  }

  return (
    <Modal
      open
      centered
      width={560}
      title={<span className="text-18px font-600">申请加入系统</span>}
      onCancel={onClose}
      footer={null}
    >
      <div className="grid min-w-0 gap-5 pt-2">
        <section
          aria-label="申请系统"
          className="flex min-w-0 items-center gap-3 rounded-ui border border-solid border-border-subtle bg-sidebar p-3"
        >
          <span
            className="flex size-40px shrink-0 items-center justify-center rounded-control bg-hover text-accent-text"
            aria-hidden="true"
          >
            <span className="i-lucide-file-code size-20px" />
          </span>
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <div className="text-16px font-600">{system.systemName}</div>
            {system.systemChineseName && (
              <div className="mt-0.5 text-13px text-text-secondary">{system.systemChineseName}</div>
            )}
          </div>
        </section>
        <section className="grid gap-2" aria-labelledby="join-system-role-label">
          <h3 id="join-system-role-label" className="m-0 text-14px font-600">
            申请角色
          </h3>
          <Radio.Group
            aria-labelledby="join-system-role-label"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <div className="grid grid-cols-3 gap-2 [@media(max-width:420px)]:grid-cols-1">
              {roleOptions.map(({ value, label }) => (
                <Radio
                  key={value}
                  value={value}
                  classNames={{ label: 'px-0!' }}
                  className={`m-0! min-w-0 min-h-44px items-center! justify-center! gap-2 rounded-control border border-solid px-3 text-13px! [@media(max-width:420px)]:justify-start! ${role === value ? 'border-accent bg-hover text-accent-text! font-600' : 'border-border-subtle hover:border-accent'}`}
                >
                  {label}
                </Radio>
              ))}
            </div>
          </Radio.Group>
        </section>
        {shareHref ? (
          <div className="grid min-w-0 gap-2 rounded-ui border border-solid border-border-subtle bg-sidebar p-3">
            <label htmlFor="join-system-link" className="font-600">
              申请链接
            </label>
            <Space.Compact block>
              <Input
                id="join-system-link"
                readOnly
                aria-describedby="join-system-link-help"
                className="min-w-0 truncate text-13px! text-text-secondary!"
                value={shareHref}
                onFocus={(event) => event.target.select()}
              />
              <Button
                type="primary"
                className="shrink-0"
                icon={<span className="i-lucide-copy size-14px" aria-hidden="true" />}
                onClick={() => void copyLink()}
              >
                复制链接
              </Button>
            </Space.Compact>
            <p id="join-system-link-help" className="m-0 text-13px text-text-secondary">
              复制链接后，请发送给系统负责人审批。
            </p>
          </div>
        ) : (
          <Alert showIcon type="warning" title="当前账号缺少姓名或 ystId，无法生成申请链接。" />
        )}
        <section className="grid min-w-0 gap-2" aria-labelledby="join-system-owner-label">
          <h3 id="join-system-owner-label" className="m-0 text-14px font-600">
            系统负责人
          </h3>
          {owners.length ? (
            <ul
              aria-labelledby="join-system-owner-label"
              className="m-0 grid list-none grid-cols-2 gap-2 p-0 [@media(max-width:420px)]:grid-cols-1"
            >
              {owners.map(({ key, name, id, initial }) => (
                <li key={key} className="min-w-0 max-w-full">
                  <Button
                    type="text"
                    block
                    className="h-auto! min-h-48px! min-w-0! justify-start! border-border-subtle! px-2.5! py-1.5! text-left! hover:bg-hover! layout-focus"
                    aria-label={`打开与 ${name}${id ? `（${id}）` : ''} 的会话`}
                    onClick={() =>
                      void message.info('会话功能尚未接入，请将复制的链接发给负责人。')
                    }
                  >
                    <Avatar
                      size={24}
                      className="shrink-0 bg-hover! text-accent-text! text-12px!"
                      aria-hidden="true"
                    >
                      {initial}
                    </Avatar>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate font-500">{name}</span>
                      {id && (
                        <span className="truncate text-12px text-text-secondary tabular-nums">
                          {id}
                        </span>
                      )}
                    </span>
                    <span
                      className="i-lucide-message-circle size-14px shrink-0 text-accent-text"
                      aria-hidden="true"
                    />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-text-secondary">暂无系统负责人</span>
          )}
        </section>
      </div>
    </Modal>
  );
}
