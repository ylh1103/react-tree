import { ConfigProvider } from 'antd';
import { AppstoreOutlined, ApartmentOutlined, CodeOutlined } from '@ant-design/icons';
import { NavLink, Outlet } from 'react-router';

export default function App() {
  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, fontSize: 14 } }}>
      <div className="app-shell">
        <header className="app-header">
          <svg className="app-logo" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M3 11 14 7v21L3 25Z" fill="#fa3155" />
            <path d="m14 2 9 4v24l-9-4Z" fill="#1677ff" />
            <path d="m23 6 7-3v19l-7 4Z" fill="#22b5ef" />
          </svg>
          <h1>灵动参数管家</h1>
        </header>
        <div className="app-body">
          <aside className="app-sidebar">
            <nav aria-label="主导航">
              <NavLink to="/applications" className="sidebar-link">
                <AppstoreOutlined aria-hidden="true" />
                <span>应用</span>
              </NavLink>
              <NavLink to="/parameters" className="sidebar-link">
                <ApartmentOutlined aria-hidden="true" />
                <span>参数</span>
              </NavLink>
              <NavLink to="/workspace" className="sidebar-link">
                <CodeOutlined aria-hidden="true" />
                <span>工作台</span>
              </NavLink>
            </nav>
          </aside>
          <div className="app-content">
            <Outlet />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
