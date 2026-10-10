import { navigationItems } from './layouts/navigation.ts';
import type { RouteObject } from 'react-router';

/** 实际路由结构供页面绑定和匹配测试共用。 */
export const routeManifest: RouteObject[] = [
  {
    id: 'root',
    children: [
      {
        id: 'site',
        children: [
          { id: 'home', index: true },
          { id: 'site-not-found', path: '*' },
        ],
      },
      {
        id: 'system',
        path: 'systems/:systemName',
        children: [
          {
            id: 'workspace',
            children: [
              { id: 'system-index', index: true },
              ...navigationItems.map(({ to }) => ({
                id: to.slice(1),
                path: to === '/application' ? 'application/:appName?' : to.slice(1),
              })),
              { id: 'database-setting', path: 'db/setting' },
              { id: 'database', path: 'db/:paramTypeName?' },
              { id: 'system-not-found', path: '*' },
            ],
          },
        ],
      },
    ],
  },
];
