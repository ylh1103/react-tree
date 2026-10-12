/**
 * 应用根节点：等待用户配置初始化，再渲染路由工作区和设置抽屉。
 * Ant Design 的消息/弹窗上下文在此建立；配置读取失败后的回退由 preferences Slice 负责。
 */
import { App as AntdApp } from 'antd';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { loadUserSettings } from './store/slices/preferencesSlice';
import { Outlet } from 'react-router';
import { useLayoutPreferences } from './hooks/useLayoutPreferences';
import { UserSettingsDrawer } from './layouts/UserSettingsDrawer';
import { ResourceLoading } from './components/ResourceLoading';

export default function App() {
  const { layoutMode } = useLayoutPreferences();
  const initialized = useAppSelector((state) => state.preferences.initialized);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!initialized) void dispatch(loadUserSettings());
  }, [dispatch, initialized]);
  return (
    <AntdApp component={false}>
      {!initialized ? (
        <ResourceLoading />
      ) : (
        <>
          <div className="app-viewport">
            <div className="app-desktop-shell" data-layout={layoutMode}>
              <Outlet />
            </div>
          </div>
          <UserSettingsDrawer />
        </>
      )}
    </AntdApp>
  );
}
