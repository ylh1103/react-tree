/** 设置面板按首次打开加载；外壳只订阅开关，下载和失败反馈不阻塞当前业务页面。 */
import { Component, lazy, Suspense, useEffect } from 'react';
import { Alert, Button } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeUserSettings } from '@/store/slices/preferencesSlice';

const UserSettingsDrawer = lazy(async () => {
  const module = await import('./index');
  return { default: module.UserSettingsDrawer };
});

interface DrawerBoundaryProps {
  open: boolean;
  onClose: () => void;
}

/** 下载期间也支持关闭和 Escape；反馈使用已有 Alert，不提前引入完整 Drawer。 */
function SettingsLoadFeedback({
  onClose,
  failed = false,
}: {
  onClose: () => void;
  failed?: boolean;
}) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);
  return (
    <div className="fixed right-4 top-16 z-1300 w-360px max-w-[calc(100vw_-_32px)]" role="status">
      <Alert
        type={failed ? 'error' : 'info'}
        showIcon
        title={failed ? '用户设置资源加载失败' : '正在加载用户设置…'}
        closable
        onClose={onClose}
        // 浏览器会缓存失败的模块请求；显式刷新才能同时恢复过期部署资源和原生 import 缓存。
        action={failed && <Button onClick={() => window.location.reload()}>刷新页面重试</Button>}
      />
    </div>
  );
}

/** 首次打开后保留模块挂载，让关闭动画和保存反馈沿用原抽屉的生命周期。 */
class SettingsDrawerBoundary extends Component<DrawerBoundaryProps> {
  state = { activated: false, failed: false };

  static getDerivedStateFromProps({ open }: DrawerBoundaryProps, state: { activated: boolean }) {
    return open && !state.activated ? { activated: true } : null;
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    const { open, onClose } = this.props;
    if (!this.state.activated) return null;
    if (this.state.failed) return open ? <SettingsLoadFeedback onClose={onClose} failed /> : null;
    return (
      <Suspense fallback={open ? <SettingsLoadFeedback onClose={onClose} /> : null}>
        <UserSettingsDrawer />
      </Suspense>
    );
  }
}

export function DeferredUserSettingsDrawer() {
  const open = useAppSelector((state) => state.preferences.settingsOpen);
  const dispatch = useAppDispatch();
  return <SettingsDrawerBoundary open={open} onClose={() => dispatch(closeUserSettings())} />;
}
