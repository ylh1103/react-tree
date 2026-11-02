/** 登录导航与路由前置检查；本地会话只控制入口，系统权限继续由各业务 loader 校验。 */
import { replace, type MiddlewareFunction } from 'react-router';
import { store } from '@/store/index.ts';
import { setUserInfo } from '@/store/slices/userSlice.ts';
import { readLoginUser, removeLoginUser } from '@/utils/loginStorage.ts';
import { cancelPreferencesRequests, closeUserSettings } from '@/store/slices/preferencesSlice.ts';

/** 仅接受站内地址，排除外部 URL、反斜杠及登录页自身，避免开放重定向和循环。 */
export function loginReturnTo(value: string | null): string {
  if (
    !value?.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    Array.from(value).some((character) => character.charCodeAt(0) < 32)
  )
    return '/';
  try {
    const url = new URL(value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid' || isLoginPath(url.pathname)) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

/** 与 Router 的路径解码保持一致，编码后的登录路径也不能作为回跳目标。 */
function isLoginPath(pathname: string) {
  try {
    return /^\/login\/*$/i.test(decodeURIComponent(pathname));
  } catch {
    return false;
  }
}

export function loginPath(returnTo: string) {
  return `/login?${new URLSearchParams({ redirect: loginReturnTo(returnTo) })}`;
}

/**
 * 先成功移除凭据再清理内存身份，防止退出失败却显示未登录。
 * 取消在途和排队设置保存后整页替换到登录页，释放查询缓存、业务请求与编辑草稿，避免下次登录复用。
 */
export function logoutUser(returnTo: string) {
  const destination = loginPath(returnTo);
  removeLoginUser();
  cancelPreferencesRequests(store.getState);
  store.dispatch(closeUserSettings());
  store.dispatch(setUserInfo(null));
  window.location.replace(destination);
}

/** Router 请求会移除 hash；首次直达页面时从相同浏览器地址补齐锚点。 */
function requestDestination(url: URL) {
  const current = typeof window === 'undefined' ? null : window.location;
  const hash =
    current?.pathname === url.pathname && current.search === url.search ? current.hash : '';
  return `${url.pathname}${url.search}${url.hash || hash}`;
}

/** 根路由每次导航恢复身份，供公开页和业务页共用；只同步资料，不限制访问。 */
export const restoreLoginMiddleware: MiddlewareFunction = () => {
  store.dispatch(setUserInfo(readLoginUser()));
};

/**
 * 仅挂在受保护路由分组，消费根 middleware 已恢复的身份，避免重复读取存储。
 * Router 在并行 loader 前完成检查，也覆盖无 loader 的导航；系统权限仍由 requireSystemAccess 校验。
 */
export const loginMiddleware: MiddlewareFunction = ({ request }) => {
  if (!store.getState().user.userInfo)
    throw replace(loginPath(requestDestination(new URL(request.url))));
};
