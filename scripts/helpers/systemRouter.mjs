/** 使用真实系统 middleware 与导航来源上下文，避免测试绕过集中授权边界。 */
import { createMemoryRouter } from 'react-router';
import {
  createSystemNavigationContext,
  systemAccessMiddleware,
} from '../../src/router/systemAccess.ts';

export function createSystemTestRouter(
  children,
  { loader, initialEntries = ['/outside'], middleware = [] } = {},
) {
  let activeRouter;
  const router = createMemoryRouter(
    [
      {
        middleware,
        children: [
          { path: '/outside' },
          {
            id: 'system',
            path: '/systems/:systemName',
            middleware: [systemAccessMiddleware],
            loader,
            children,
          },
        ],
      },
    ],
    {
      initialEntries,
      future: { v8_middleware: true },
      getContext: createSystemNavigationContext(() => activeRouter),
    },
  );
  activeRouter = router;
  return router;
}

export function waitForRouter(router) {
  if (router.state.initialized && router.state.navigation.state === 'idle')
    return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (state.initialized && state.navigation.state === 'idle') {
        unsubscribe();
        resolve();
      }
    });
  });
}
