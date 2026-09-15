import { createBrowserRouter, Navigate } from 'react-router';
import App from './App';
import ApplicationListPage from './pages/ApplicationListPage';
import ParameterListPage from './pages/ParameterListPage';
import ListErrorPage from './pages/ListErrorPage';
import { applicationLoader } from './features/applications/api';
import { parameterLoader } from './features/parameters/api';

export const router = createBrowserRouter([
  {
    Component: App,
    hydrateFallbackElement: <p role="status">正在加载列表…</p>,
    children: [
      { index: true, element: <Navigate to="/applications" replace /> },
      {
        path: 'applications',
        loader: applicationLoader,
        Component: ApplicationListPage,
        ErrorBoundary: ListErrorPage,
      },
      {
        path: 'parameters',
        loader: parameterLoader,
        Component: ParameterListPage,
        ErrorBoundary: ListErrorPage,
      },
    ],
  },
]);
