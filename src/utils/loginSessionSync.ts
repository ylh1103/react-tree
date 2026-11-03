/** 共享浏览器会话变化时重启页面，避免旧身份页面继续使用缓存、请求或草稿。 */
import { loginStorageKey } from './loginStorage.ts';

/** 只监听会话，不监听业务存储；回调先释放应用资源，再由入口重载。 */
export function startLoginSessionSync(onChange: () => void): () => void {
  let initial: string | null;
  try {
    initial = window.localStorage.getItem(loginStorageKey);
  } catch {
    return () => {};
  }
  let changed = false;
  const check = () => {
    if (changed) return;
    try {
      if (window.localStorage.getItem(loginStorageKey) === initial) return;
    } catch {
      return;
    }
    changed = true;
    onChange();
  };
  const onStorage = (event: StorageEvent) => {
    if (
      event.storageArea === window.localStorage &&
      (event.key === loginStorageKey || event.key === null)
    )
      check();
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') check();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', check);
  window.addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', check);
    window.removeEventListener('pageshow', check);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
