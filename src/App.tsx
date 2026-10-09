import { App as AntdApp, ConfigProvider } from 'antd';
import { Outlet } from 'react-router';

export default function App() {
  return (
    <ConfigProvider theme={{ token: { borderRadius: 4, fontSize: 14 } }}>
      <AntdApp component={false}>
        <Outlet />
      </AntdApp>
    </ConfigProvider>
  );
}
