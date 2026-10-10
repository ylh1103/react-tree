import { createBrowserRouter, Navigate } from 'react-router';
import type { RouteObject } from 'react-router';
import type { ReactNode } from 'react';
import App from './App';
import AppLayout from './layouts/AppLayout';
import { navigationItems } from './layouts/navigation';
import LayoutPage from './pages/LayoutPage';
import SiteLayout from './layouts/SiteLayout';
import SystemLayout from './layouts/SystemLayout';
import SystemsHomePage from './pages/SystemsHomePage';
import SystemOverviewPage from './pages/SystemOverviewPage';
import RouteStatusPage from './pages/RouteStatusPage';
import { DatabaseParametersPage, SystemApplicationsPage } from './pages/SystemCollectionPage';
import { routeManifest } from './routeManifest';
import UserSettingsPage from './pages/UserSettingsPage';

const pages: Record<string, ReactNode> = {
  root: <App />,
  site: <SiteLayout />,
  home: <SystemsHomePage />,
  system: <SystemLayout />,
  workspace: <AppLayout />,
  'system-index': <Navigate to="overview" replace />,
  overview: <SystemOverviewPage />,
  application: <SystemApplicationsPage />,
  database: <DatabaseParametersPage />,
  setting: <UserSettingsPage />,
  'database-setting': <UserSettingsPage />,
};

function bindPage(route: RouteObject): RouteObject {
  const menu = navigationItems.find((item) => item.to.slice(1) === route.id);
  const element =
    pages[route.id ?? ''] ??
    (menu ? <LayoutPage title={menu.label} splitPane={menu.splitPane} /> : <RouteStatusPage />);
  if (route.index) return { ...route, element };
  return { ...route, element, children: route.children?.map(bindPage) };
}

export const router = createBrowserRouter(routeManifest.map(bindPage));
