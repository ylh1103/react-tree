/** 页头身份卡片：集中展示头像、姓名和账号，保留分组菜单的键盘操作与入口授权边界。 */
import { App, Alert, Button, Dropdown } from 'antd';
import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openUserSettings } from '@/store/slices/preferencesSlice';
import { logoutUser } from '@/router/login';

const UserProfileModal = lazy(() => import('./UserProfileModal'));
const menuItemClass = 'min-h-40px px-3! rounded-control!';

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

/** 详情模块加载失败时保留用户操作，退出和配置入口不受影响。 */
class UserProfileBoundary extends Component<
  { children: ReactNode; open: boolean; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      this.props.open ? (
        <div className="fixed right-4 top-16 z-1300 w-320px">
          <Alert
            type="warning"
            showIcon
            title="个人资料加载失败，请刷新页面重试"
            closable={{ onClose: this.props.onClose }}
          />
        </div>
      ) : null
    ) : (
      this.props.children
    );
  }
}

export function HeaderUserMenu() {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const userName = useAppSelector((state) => state.user.userInfo?.userName);
  const ystId = useAppSelector((state) => state.user.userInfo?.ystId);
  // 这里只控制平台入口展示；工作区访问统一由 requireSystemAccess 校验。
  const isPlatformUser = useAppSelector((state) => state.user.userInfo?.userType === '0');
  // null 表示尚未打开；关闭后保留模块挂载，让 Modal 完成关闭动画。
  const [profileOpen, setProfileOpen] = useState<boolean | null>(null);
  if (!userName) return null;

  return (
    <>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          selectable: false,
          // 局部统一操作行尺寸，保留 Ant Design 的键盘导航、焦点及危险操作状态。
          className: 'bg-transparent! shadow-none! p-2! pt-0!',
          items: [
            { type: 'divider', className: 'mx-3! mt-0! mb-2!' },
            accountMenuItem('profile', '个人资料', 'i-lucide-user-round'),
            accountMenuItem('settings', '用户配置', 'i-lucide-settings-2'),
            accountMenuItem('legacy', '旧版本', 'i-lucide-history'),
            isPlatformUser
              ? accountMenuItem('platform-management', '平台管理', 'i-lucide-users-round')
              : null,
            { type: 'divider', className: 'mx-3! my-2!' },
            accountMenuItem('logout', '退出登录', 'i-lucide-log-out', true),
          ],
          onClick: ({ key }) => {
            if (key === 'profile') setProfileOpen(true);
            if (key === 'settings') dispatch(openUserSettings());
            if (key === 'legacy') void message.info('暂无可用的旧版本入口');
            if (key === 'platform-management' && isPlatformUser)
              void message.info('暂无可用的平台管理入口');
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
        popupRender={(menu) => (
          <div className="w-72 rounded-ui border border-solid border-border-subtle bg-surface shadow-xl">
            <div className="flex items-center gap-2.5 px-5 py-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hover text-lg font-600 text-accent-text"
              >
                {userName.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="break-all text-14px font-600 leading-20px">{userName}</div>
                <div className="mt-0.5 break-all text-13px leading-20px tabular-nums [color:color-mix(in_srgb,var(--color-text-secondary)_80%,var(--color-text))]">
                  {ystId || '—'}
                </div>
              </div>
            </div>
            {menu}
          </div>
        )}
      >
        <Button
          type="text"
          shape="circle"
          aria-label={`${userName}，用户菜单`}
          title={userName}
          // 头像本身也是菜单按钮，直接复用 Button 的圆形外观和交互，保持首屏依赖轻量。
          className="h-32px! w-32px! min-w-32px! p-0! bg-hover! hover:bg-accent-bg-hover! text-accent-text! text-14px! font-600 layout-focus"
        >
          {userName.slice(0, 1)}
        </Button>
      </Dropdown>
      {profileOpen !== null && (
        <UserProfileBoundary open={profileOpen} onClose={() => setProfileOpen(false)}>
          <Suspense
            fallback={
              profileOpen ? (
                <div className="fixed right-4 top-16 z-1300 w-320px">
                  <Alert
                    type="info"
                    showIcon
                    title="正在加载个人资料…"
                    closable={{ onClose: () => setProfileOpen(false) }}
                  />
                </div>
              ) : null
            }
          >
            <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
          </Suspense>
        </UserProfileBoundary>
      )}
    </>
  );
}
