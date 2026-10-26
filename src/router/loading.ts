/**
 * 共享路由匹配上下文，并根据目标地址及当前布局选择加载提示。
 * 骨架必须在页面 chunk 加载之前可用；同一清单内只切换选中项时保留当前工作区。
 */
import { createContext, createElement } from 'react';
import { matchRoutes, type RouteObject } from 'react-router';

export const RouteLoadingContext = createContext<RouteObject[]>([]);

export function matchPageSkeleton(
  routes: RouteObject[],
  pathname: string,
  layoutId?: string,
  currentPathname?: string,
) {
  const matches = matchRoutes(routes, pathname);
  if (!matches || (layoutId && !matches.some(({ route }) => route.id === layoutId))) return null;
  const target = matches.at(-1);
  const current = currentPathname ? matchRoutes(routes, currentPathname)?.at(-1) : undefined;
  // 同一系统内只改变应用/类型等参数时，保留已加载的页面和侧栏。
  if (
    current &&
    current.route === target?.route &&
    current.params.systemName === target.params.systemName
  ) {
    return null;
  }
  // 首次等待与后续导航复用同一声明，不在 handle 中重复登记骨架。
  const Skeleton = target?.route.HydrateFallback;
  return Skeleton ? createElement(Skeleton) : null;
}

/** matchRoutes 会按路由规则解码参数，避免直接匹配编码后的 pathname。 */
export function matchLoadingParams(routes: RouteObject[], pathname: string) {
  return matchRoutes(routes, pathname)?.at(-1)?.params ?? {};
}
