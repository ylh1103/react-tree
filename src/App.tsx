/**
 * 应用根节点：显示偏好初始化完成后渲染工作区和设置抽屉，不依赖登录资料。
 * Ant Design 的消息/弹窗上下文在此建立；配置读取失败后的回退由 preferences Slice 负责。
 */
import { App as AntdApp, Alert, Button } from 'antd';
import { type CSSProperties } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { loadUserSettings } from './store/slices/preferencesSlice';
import { Outlet } from 'react-router';
import { useLayoutPreferences } from './hooks/useLayoutPreferences';
import { UserSettingsDrawer } from './layouts/UserSettingsDrawer';
import { ResourceLoading } from './components/ResourceLoading';

export default function App() {
  const dispatch = useAppDispatch();
  const { layoutMode, layoutGap } = useLayoutPreferences();
  const initialized = useAppSelector((state) => state.preferences.initialized);
  const settingsError = useAppSelector((state) =>
    state.preferences.status === 'load-error' ? state.preferences.error : null,
  );
  return (
    <AntdApp component={false}>
      {!initialized ? (
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
                    <Button onClick={() => void dispatch(loadUserSettings())}>重新读取</Button>
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
