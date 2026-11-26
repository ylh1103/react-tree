import { App, Button, Dropdown } from 'antd';
import { useId } from 'react';
import type { SystemInfo } from '@/types/systems';

/** 卡片和列表共用系统操作菜单。 */
export default function SystemActions({
  system,
  isMember,
  showDelete,
  onDetails,
  onManage,
}: {
  system: SystemInfo;
  isMember: boolean;
  showDelete: boolean;
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
          if (key === 'details') onDetails();
          else if (key === 'settings') onManage();
          else if (key === 'leave' || key === 'delete') {
            const isDelete = key === 'delete';
            const chineseName = system.systemChineseName?.trim();
            modal.confirm({
              title: isDelete ? '确定删除此系统？' : '确定退出此系统？',
              content: (
                <div className="mt-3 rounded-control bg-sidebar px-3 py-2.5 [overflow-wrap:anywhere]">
                  <div className="text-14px font-600">{system.systemName}</div>
                  {chineseName && (
                    <div className="mt-0.5 text-13px text-text-secondary">{chineseName}</div>
                  )}
                </div>
              ),
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
