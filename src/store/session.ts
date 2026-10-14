/** 会话协调层：并发 loader 共享初始化，失效时先阻止渲染再清理旧用户缓存。 */
import { store } from './index.ts';
import { expireSession, initializeSession } from './slices/sessionSlice.ts';
import { resetPreferences, cancelPreferencesRequests } from './slices/preferencesSlice.ts';
import { queryClient } from '../queries/client.ts';
import { HttpError, onAccessFailure, cancelHttpRequests } from '../http/request.ts';
import { parseSession } from '../types/session.ts';

let pending: ReturnType<ReturnType<typeof initializeSession>> | undefined;
/** 返回有效会话；Promise 保存在协调层，不放 Redux。 */
export async function requireSession() {
  const state = store.getState().session;
  if (state.status === 'ready' && state.user) {
    try {
      return parseSession(state.user);
    } catch {
      invalidateSession();
      throw new HttpError(401, '登录状态已失效');
    }
  }
  if (state.status === 'expired') throw new HttpError(401, '登录状态已失效');
  if (!pending) {
    const request = store.dispatch(initializeSession());
    pending = request;
    void request.finally(() => {
      if (pending === request) pending = undefined;
    });
  }
  try {
    return await pending.unwrap();
  } catch (error) {
    if (store.getState().session.status === 'expired') throw new HttpError(401, '登录状态已失效');
    throw new HttpError(0, '登录信息读取失败，请重试', error);
  }
}
export function invalidateSession() {
  pending?.abort();
  pending = undefined;
  cancelHttpRequests();
  cancelPreferencesRequests(store.getState);
  store.dispatch(expireSession());
  store.dispatch(resetPreferences());
  void queryClient.cancelQueries();
  queryClient.clear();
}
/** 用户显式重新登录时才重新发起初始化，不从错误页自动无限重试。 */
export async function retrySession() {
  invalidateSession();
  const request = store.dispatch(initializeSession());
  pending = request;
  try {
    await request.unwrap();
  } finally {
    if (pending === request) pending = undefined;
  }
}
export function startAccessFailureHandling() {
  return onAccessFailure((error, config) => {
    if (error.status === 401) {
      invalidateSession();
      return;
    }
    const access = /^\/api\/systems\/(.+)\/access$/.exec(config.url ?? '');
    const name = config.params?.systemName ?? (access ? decodeURIComponent(access[1]) : undefined);
    if (!name) return;
    cancelHttpRequests(name, config);
    const user = store.getState().session.user;
    if (!user) return;
    // 先发布拒绝结果，SystemLayout 立即移除 Outlet，再取消业务请求。
    queryClient.setQueryData(['system-access', user.ystId, name], { denied: true });
    void queryClient.cancelQueries({
      predicate: (query) =>
        query.queryKey[0] !== 'system-access' &&
        query.queryKey.some((key) => key === name || key === `applications:${name}`),
    });
    queryClient.removeQueries({
      predicate: (query) =>
        query.queryKey[0] !== 'system-access' &&
        query.queryKey.some((key) => key === name || key === `applications:${name}`),
    });
  });
}

/** 即使用户不导航，也在会话到期时移除工作区；订阅和计时器随 HMR 清理。 */
export function startSessionLifetime() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let previous = '';
  const schedule = () => {
    const user = store.getState().session.user;
    const identity = user ? `${user.ystId}:${user.expireTime}` : '';
    if (identity === previous) return;
    previous = identity;
    clearTimeout(timer);
    if (user)
      timer = setTimeout(
        () => {
          // 超长会话分段计时，不能因为 setTimeout 的整数上限提前失效。
          if (Date.now() >= Number(user.expireTime) * 1000) invalidateSession();
          else {
            previous = '';
            schedule();
          }
        },
        Math.max(0, Math.min(Number(user.expireTime) * 1000 - Date.now(), 2_147_483_647)),
      );
  };
  const unsubscribe = store.subscribe(schedule);
  schedule();
  return () => {
    unsubscribe();
    clearTimeout(timer);
  };
}
