import { Alert, App, Button, Dropdown } from 'antd';
import { useId } from 'react';
import type { SystemInfo } from '@/types/systems';

/** 卡片和列表共用系统操作菜单。 */
export default function SystemActions({
  system,
  isMember,
  showDelete,
  canManage,
  onDetails,
  onManage,
}: {
  system: SystemInfo;
  isMember: boolean;
  showDelete: boolean;
  canManage: boolean;
  onDetails: () => void;
  onManage: () => void;
}) {
  const { message, modal } = App.useApp();
  const menuId = useId();
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        // 菜单按 DOM 标识查找焦点，独立 ID 可避免命中其他系统已隐藏的菜单项。
        id: menuId,
        onClick: ({ key }) => {
          if ((key === 'settings' || key === 'users') && !canManage) return;
          if (key === 'details') onDetails();
          else if (key === 'settings') onManage();
          else if (key === 'leave' || key === 'delete') {
            const isDelete = key === 'delete';
            const chineseName = system.systemChineseName?.trim();
            modal.confirm({
              // 图标并入标题行，内容区与标题左对齐并占满弹窗宽度。
              icon: null,
              title: (
                <span className="flex items-center gap-2">
                  <span
                    className={`${isDelete ? 'i-lucide-trash-2 text-danger' : 'i-lucide-log-out text-warning'} size-20px shrink-0`}
                    aria-hidden="true"
                  />
                  {isDelete ? '确定删除此系统？' : '确定退出此系统？'}
                </span>
              ),
              content: (
                <div className="mt-4 mb-2 flex flex-col gap-3 [overflow-wrap:anywhere]">
                  <div className="rounded-control border border-border-secondary bg-sidebar px-3 py-2.5">
                    <div className="text-14px font-600">{system.systemName}</div>
                    {chineseName && (
                      <div className="mt-0.5 text-13px text-text-secondary">{chineseName}</div>
                    )}
                  </div>
                  <Alert
                    type={isDelete ? 'error' : 'warning'}
                    showIcon
                    title={
                      isDelete
                        ? '删除后系统及其应用、数据库参数将无法恢复，请谨慎操作'
                        : '退出后将无法访问该系统，需重新申请加入'
                    }
                  />
                </div>
              ),
              width: 480,
              centered: true,
              okText: isDelete ? '确认删除' : '确认退出',
              okButtonProps: { danger: isDelete },
              cancelText: '取消',
              focusable: { autoFocusButton: 'cancel' },
              onOk: () => {
                void message.info('此功能暂未接入');
              },
            });
          } else void message.info('此功能暂未接入');
        },
        items: [
          {
            key: 'details',
            label: '系统详情',
            icon: <span className="i-lucide-file-text size-16px" aria-hidden="true" />,
          },
          ...(canManage
            ? [
                {
                  key: 'settings',
                  label: '系统管理',
                  icon: <span className="i-lucide-settings size-16px" aria-hidden="true" />,
                },
                {
                  key: 'users',
                  label: '人员管理',
                  icon: <span className="i-lucide-users size-16px" aria-hidden="true" />,
                },
              ]
            : []),
          ...(isMember
            ? [
                {
                  key: 'leave',
                  label: '退出系统',
                  icon: <span className="i-lucide-log-out size-16px" aria-hidden="true" />,
                },
              ]
            : []),
          ...(showDelete
            ? [
                {
                  key: 'delete',
                  label: '删除系统',
                  danger: true,
                  icon: <span className="i-lucide-trash-2 size-16px" aria-hidden="true" />,
                },
              ]
            : []),
        ],
      }}
    >
      <Button
        type="text"
        size="small"
        aria-label={`${system.systemName} 更多操作`}
        className="shrink-0 text-text-muted!"
        icon={<span className="i-lucide-ellipsis w-16px h-16px" aria-hidden="true" />}
      />
    </Dropdown>
  );
}
