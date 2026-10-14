/**
 * 应用根节点：会话与设置初始化完成后再渲染工作区和设置抽屉。
 * Ant Design 的消息/弹窗上下文在此建立；配置读取失败后的回退由 preferences Slice 负责。
 */
import { App as AntdApp, Alert, Button, Result } from 'antd';
import { type CSSProperties } from 'react';
import { useAppSelector } from './store/hooks';
import { retrySession } from './store/session';
import { Outlet } from 'react-router';
import { useLayoutPreferences } from './hooks/useLayoutPreferences';
import { UserSettingsDrawer } from './layouts/UserSettingsDrawer';
import { ResourceLoading } from './components/ResourceLoading';

export default function App() {
  const { layoutMode, layoutGap } = useLayoutPreferences();
  const initialized = useAppSelector((state) => state.preferences.initialized);
  const sessionStatus = useAppSelector((state) => state.session.status);
  const sessionError = useAppSelector((state) => state.session.error);
  const settingsError = useAppSelector((state) =>
    state.preferences.status === 'load-error' ? state.preferences.error : null,
  );
  if (sessionStatus === 'expired' || sessionStatus === 'error')
    return (
      <AntdApp>
        <Result
          status="warning"
          title={sessionError ?? '登录状态已失效'}
          extra={
            <Button
              type="primary"
              onClick={() =>
                void retrySession()
                  .then(() => window.location.reload())
                  .catch(() => {})
              }
            >
              重新获取会话
            </Button>
          }
        />
      </AntdApp>
    );
  return (
    <AntdApp component={false}>
      {!initialized || sessionStatus !== 'ready' ? (
        <ResourceLoading />
      ) : (
        <>
          <div className="h-full overflow-auto">
            <div
              className="h-full min-w-1280px [&[data-layout=compact]]:[--layout-gap:0px]"
              data-layout={layoutMode}
              style={
                { '--layout-gap': `${layoutMode === 'compact' ? 0 : layoutGap}px` } as CSSProperties
              }
            >
              {settingsError && (
                <Alert
                  type="warning"
                  showIcon
                  title={settingsError}
                  action={
                    <Button onClick={() => void retrySession().catch(() => {})}>重新读取</Button>
                  }
                />
              )}
              <Outlet />
            </div>
          </div>
          <UserSettingsDrawer />
        </>
      )}
    </AntdApp>
  );
}
