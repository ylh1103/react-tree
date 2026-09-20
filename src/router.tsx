import { createBrowserRouter, Navigate } from 'react-router';
import App from './App';
import ApplicationListPage from './pages/ApplicationListPage';
import ParameterListPage from './pages/ParameterListPage';

export const router = createBrowserRouter([
  {
    Component: App,
    children: [
      { index: true, element: <Navigate to="/applications" replace /> },
      {
        path: 'applications',
        Component: ApplicationListPage,
      },
      {
        path: 'parameters',
        Component: ParameterListPage,
      },
    ],
  },
]);
