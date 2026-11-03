/** 系统路由的统一授权边界；导航来源只描述已提交路由，授权结果始终保存在 Query。 */
import {
  createContext,
  RouterContextProvider,
  type DataRouter,
  type MiddlewareFunction,
} from 'react-router';
import { store } from '@/store/index.ts';
import { queryClient } from '@/queries/client.ts';
import { requireSystemAccess, systemAccessOptions } from '@/queries/systems.ts';
import type { SystemAccessIdentity } from '@/types/user.ts';

interface SystemNavigationSource {
  systemName: string | null;
  user: SystemAccessIdentity | null;
  /** 同次导航的 action/loader 可分阶段执行，只记录已检查的键，结果仍以 Query 当前状态为准。 */
  checkedKey?: string;
}

const navigationSourceContext = createContext<SystemNavigationSource | null>(null);

/**
 * 每次导航独立快照来源路由与身份；初始化时 router 尚未赋值，按首次进入处理。
 * 使用已提交 matches 而非浏览器地址或上次请求目标，兼容 POP、重定向与取消导航。
 */
export function createSystemNavigationContext(getRouter: () => DataRouter | undefined) {
  return () => {
    const context = new RouterContextProvider();
    const state = getRouter()?.state;
    context.set(navigationSourceContext, {
      systemName: state?.initialized
        ? (state.matches.find((match) => match.route.id === 'system')?.params.systemName ?? null)
        : null,
      // 根登录 middleware 随后可能恢复新身份，此处保留恢复前的来源身份用于比较。
      user: store.getState().user.userInfo,
    });
    return context;
  };
}

/** 系统内导航仅复用同身份、成功且未失效的结果；进入、跨系统及失效后等待最新授权。 */
export const systemAccessMiddleware: MiddlewareFunction = async ({ params, context, request }) => {
  request.signal.throwIfAborted();
  const systemName = params.systemName;
  if (!systemName) return;
  const source = context.get(navigationSourceContext);
  const user = store.getState().user.userInfo;
  const options = systemAccessOptions(systemName, user);
  const state = queryClient.getQueryState(options.queryKey);
  const key = JSON.stringify(options.queryKey);
  const sameWorkspace =
    source?.systemName === systemName &&
    source.user?.openId === user?.openId &&
    source.user?.userType === user?.userType;
  const canReuse =
    (sameWorkspace || source?.checkedKey === key) &&
    state?.status === 'success' &&
    !state.isInvalidated;
  if (!canReuse) await requireSystemAccess(systemName);
  // Query 在途请求可能被其他导航/布局复用；不因单次导航取消而全局取消，取消后不得继续业务 loader。
  request.signal.throwIfAborted();
  if (source) source.checkedKey = key;
};
