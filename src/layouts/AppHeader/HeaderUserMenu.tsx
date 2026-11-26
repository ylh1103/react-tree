/** 页头用户菜单：集中展示头像、姓名和账号，保留分组菜单的键盘操作与入口授权边界。 */
import { App, Button, Dropdown, Modal } from 'antd';
import { lazy, useState } from 'react';
import { DeferredPanel } from '../DeferredPanel';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openUserSettings } from '@/store/slices/preferencesSlice';
import { logoutUser } from '@/router/middleware/login';
import { legacyHref, platformManagementHref } from './headerResources';
import { headerMenuFocusClass } from './headerMenuStyles';
import { newTabMenuItem } from './newTabMenuItem';

const UserProfileContent = lazy(() => import('./UserProfileContent'));
const menuItemClass = `min-h-40px px-3! rounded-control! ${headerMenuFocusClass}`;
const newTabIcon = (
  <span className="i-lucide-arrow-up-right block size-14px text-text-muted" aria-hidden="true" />
);

/** 共用菜单项外观，退出项继承 Ant Design 的危险操作配色。 */
function accountMenuItem(key: string, label: string, icon: string, danger = false) {
  return {
    key,
    label,
    danger,
    className: menuItemClass,
    icon: <span className={`${icon} size-4`} aria-hidden="true" />,
  };
}

export function HeaderUserMenu() {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const userName = useAppSelector((state) => state.user.userInfo?.userName);
  const ystId = useAppSelector((state) => state.user.userInfo?.ystId);
  // 平台角色用于显示身份及菜单入口；工作区访问统一由 requireSystemAccess 校验。
  const userType = useAppSelector((state) => state.user.userInfo?.userType);
  const isPlatformUser = userType === '0';
  // null 表示尚未打开；关闭后保留模块挂载，让 Modal 完成关闭动画。
  const [profileOpen, setProfileOpen] = useState<boolean | null>(null);
  if (!userName) return null;
  const avatarColors = isPlatformUser
    ? 'bg-[#d00016]! text-[#ffffff]! [html[data-theme=dark]_&]:bg-[#dc1028]! [html[data-theme=dark]_&]:text-[#ffffff]!'
    : 'bg-hover! text-accent-text!';
  const roleLabel = isPlatformUser ? '平台人员' : userType === '1' ? '普通用户' : '未提供角色';

  return (
    <>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        align={{ offset: [0, 12] }}
        menu={{
          selectable: false,
          className: 'w-72 max-w-[calc(100vw-32px)] p-3!',
          items: [
            {
              type: 'group',
              key: 'identity',
              // 抵消分组列表的默认横向缩进，让组内操作与退出登录对齐。
              className: '[&>ul]:mx-0! [&>div]:p-0!',
              label: (
                <div className="mb-2 flex items-center gap-3 rounded-control bg-sidebar px-3 py-3">
                  <span
                    aria-hidden="true"
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-600 ${avatarColors}`}
                  >
                    {userName.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="break-all text-15px font-600 text-text leading-22px">
                      {userName}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-12px leading-18px">
                      <span className="break-all text-text-secondary tabular-nums">
                        {ystId || '—'}
                      </span>
                      {isPlatformUser && (
                        <span className={`rounded-full px-1.5 font-500 ${avatarColors}`}>
                          {roleLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ),
              children: [
                accountMenuItem('profile', '个人资料', 'i-lucide-user-round'),
                accountMenuItem('settings', '用户配置', 'i-lucide-settings-2'),
                {
                  ...accountMenuItem('legacy', '旧版本', 'i-lucide-history'),
                  ...newTabMenuItem('旧版本', legacyHref),
                  extra: newTabIcon,
                },
                isPlatformUser
                  ? {
                      ...accountMenuItem('platform-management', '平台管理', 'i-lucide-users-round'),
                      ...newTabMenuItem('平台管理', platformManagementHref),
                      extra: newTabIcon,
                    }
                  : null,
              ],
            },
            { type: 'divider', className: 'mx-3! my-2!' },
            accountMenuItem('logout', '退出登录', 'i-lucide-log-out', true),
          ],
          onClick: ({ key }) => {
            if (key === 'profile') setProfileOpen(true);
            if (key === 'settings') dispatch(openUserSettings());
            if (key === 'logout') {
              try {
                const { pathname, search, hash } = window.location;
                logoutUser(`${pathname}${search}${hash}`);
              } catch {
                void message.error('退出登录失败，请确认浏览器允许本地存储后重试。');
              }
            }
          },
        }}
      >
        <Button
          type="text"
          shape="circle"
          aria-label={`${userName}，${roleLabel}，用户菜单`}
          title={isPlatformUser ? `${userName}（平台人员）` : userName}
          // 头像本身也是菜单按钮，直接复用 Button 的圆形外观和交互，保持首屏依赖轻量。
          className={`h-32px! w-32px! min-w-32px! p-0! text-14px! font-600 layout-focus ${avatarColors} ${
            isPlatformUser
              ? 'hover:bg-[#b50013]! [html[data-theme=dark]_&]:hover:bg-[#c5001a]!'
              : 'hover:bg-accent-bg-hover!'
          }`}
        >
          {userName.slice(0, 1)}
        </Button>
      </Dropdown>
      {profileOpen !== null && (
        <Modal
          aria-label="个人资料"
          open={profileOpen}
          onCancel={() => setProfileOpen(false)}
          width={500}
          centered
          closable={false}
          classNames={{
            container:
              'relative isolate overflow-hidden p-3! rounded-[calc(var(--ui-radius)_+_16px)]! border border-solid border-white/40 bg-transparent! backdrop-blur-3px',
            body: 'min-h-480px p-0!',
          }}
          footer={null}
        >
          <DeferredPanel title="个人资料">
            <UserProfileContent />
          </DeferredPanel>
        </Modal>
      )}
    </>
  );
}
