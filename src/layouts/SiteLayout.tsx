import { Outlet } from 'react-router';
import { AppHeader } from './AppHeader';

export default function SiteLayout() {
  return (
    <div className="flex flex-col h-100dvh overflow-hidden bg-canvas">
      <AppHeader />
      <main className="layout-scroll" id="app-page" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
