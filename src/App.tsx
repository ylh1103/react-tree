import { App as AntdApp } from 'antd';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { loadUserSettings } from './store/preferencesSlice';
import { Outlet } from 'react-router';
import { useLayoutPreferences } from './features/preferences/useLayoutPreferences';
import { UserSettingsDrawer } from './features/preferences/UserSettingsDrawer';
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
