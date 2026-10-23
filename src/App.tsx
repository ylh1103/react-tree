/**
 * 应用根节点：偏好首次读取期间保留启动动画，结束等待后渲染 Outlet；设置面板首次打开再下载。
 * initialized 表示首次等待已经结束，并不保证读取成功；失败时 Slice 提供回退配置，此处展示重试入口。
 * Ant Design 的消息/弹窗上下文在此建立；可展示内容通过交接边界结束 HTML 启动画面。
 */
import { App as AntdApp, Alert, Button } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUserSettings } from '@/store/slices/preferencesSlice';
import { Outlet } from 'react-router';
import { AppViewport } from '@/layouts/LayoutFrame';
import { DeferredUserSettingsDrawer } from '@/layouts/UserSettingsDrawer/Deferred';
import { ResourceLoading } from '@/components/ResourceLoading';
import { BootstrapLoadingHandoff } from '@/components/ResourceLoading/BootstrapHandoff';

export default function App() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((state) => state.preferences.initialized);
  const settingsError = useAppSelector((state) =>
    state.preferences.status === 'load-error' ? state.preferences.error : null,
  );
  return (
    <AntdApp component={false}>
      {!initialized ? (
        <ResourceLoading />
      ) : (
        <BootstrapLoadingHandoff>
          <AppViewport>
            {settingsError && (
              <Alert
                type="warning"
                showIcon
                title={settingsError}
                action={<Button onClick={() => void dispatch(loadUserSettings())}>重新读取</Button>}
              />
            )}
            <Outlet />
          </AppViewport>
          <DeferredUserSettingsDrawer />
        </BootstrapLoadingHandoff>
      )}
    </AntdApp>
  );
}
