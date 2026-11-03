/** 创建应用唯一的浏览器路由；v7 显式启用 middleware，确保登录检查先于并行 loader。 */
import { createBrowserRouter, type DataRouter } from 'react-router';
import { routes } from './routes';
import { createSystemNavigationContext } from './systemAccess';

// createBrowserRouter 初始化期间也会调用 getContext，先提供空引用再绑定实例。
const routerRef: { current?: DataRouter } = {};

export const router = createBrowserRouter(routes, {
  future: { v8_middleware: true },
  getContext: createSystemNavigationContext(() => routerRef.current),
});

routerRef.current = router;
