import { App as AntdApp, ConfigProvider } from 'antd';
import { Outlet } from 'react-router';
import { appTheme } from './styles/theme';
import { LayoutPreferencesProvider } from './features/preferences/LayoutPreferences';

export default function App() {
  return (
    <ConfigProvider theme={appTheme}>
      <AntdApp component={false}>
        <LayoutPreferencesProvider>
          <Outlet />
        </LayoutPreferencesProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
