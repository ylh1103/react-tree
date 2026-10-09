import { createBrowserRouter, Navigate } from 'react-router';
import App from './App';
import AppLayout from './layouts/AppLayout';
import { navigationItems } from './layouts/navigation';
import LayoutPage from './pages/LayoutPage';

export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        Component: AppLayout,
        children: [
          { index: true, element: <Navigate to="/overview" replace /> },
          { path: 'layout', element: <Navigate to="/overview" replace /> },
          ...navigationItems.map(({ to, label, splitPane }) => ({
            path: to.slice(1),
            element: <LayoutPage title={label} splitPane={splitPane} />,
          })),
        ],
      },
    ],
  },
]);
