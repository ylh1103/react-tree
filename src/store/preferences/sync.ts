/**
 * 跨页签显示设置同步：广播仅通知发生变化，接收方重新读取服务端配置。
 * 本地读取/保存期间合并通知；同步失败保留现有配置，返回的清理函数释放请求和所有订阅。
 */
import type { AppStore } from '../index.ts';
import { refreshUserSettings } from '../slices/preferencesSlice.ts';

export interface UserSettingsSyncTransport {
  publish: () => void;
  subscribe: (listener: () => void) => () => void;
  close: () => void;
}

const syncKey = 'parameter-management:display-settings:v1';
const changedMessage = 'user-settings-changed';

/** 只传递变更通知，接收方重新读取设置接口，不在广播中传递配置正文。 */
export function createUserSettingsSyncTransport(): UserSettingsSyncTransport | null {
  if (typeof window === 'undefined') return null;

  try {
    if (typeof window.BroadcastChannel === 'function') {
      const channel = new window.BroadcastChannel(syncKey);
      return {
        publish: () => channel.postMessage(changedMessage),
        subscribe: (listener) => {
          const receive = (event: MessageEvent) => {
            if (event.data === changedMessage) listener();
          };
          channel.addEventListener('message', receive);
          return () => channel.removeEventListener('message', receive);
        },
        close: () => channel.close(),
      };
    }
  } catch {
    // 部分环境禁用 BroadcastChannel，使用 storage 事件回退。
  }
  try {
    const storage = window.localStorage;
    return {
      publish: () => storage.setItem(syncKey, `${Date.now()}:${Math.random()}`),
      subscribe: (listener) => {
        const receive = (event: StorageEvent) => {
          if (event.key === syncKey && event.storageArea === storage && event.newValue !== null) {
            listener();
          }
        };
        window.addEventListener('storage', receive);
        return () => window.removeEventListener('storage', receive);
      },
      close: () => {},
    };
  } catch {
    return null;
  }
}

/** 保存成功后通知其他页签；通知在本地请求期间排队并合并。 */
export function startUserSettingsSync(
  store: AppStore,
  transport = createUserSettingsSyncTransport(),
) {
  let stopped = false;
  // 用布尔值合并多次通知；请求期间有新通知时，结束后最多再补一次读取。
  let queued = false;
  let refreshing = false;
  let activeRequest: { abort: () => void } | null = null;
  let previousSaveRevision = store.getState().preferences.saveRevision;

  const flush = async () => {
    const { initialized, status } = store.getState().preferences;
    if (
      stopped ||
      !queued ||
      refreshing ||
      !initialized ||
      status === 'loading' ||
      status === 'saving'
    ) {
      return;
    }
    // 本地保存期间暂缓刷新，避免服务端旧快照干扰乐观 UI；Store 更新时会再次尝试 flush。
    queued = false;
    refreshing = true;
    try {
      const request = store.dispatch(refreshUserSettings());
      activeRequest = request;
      await request;
    } finally {
      activeRequest = null;
      refreshing = false;
      if (!stopped && queued) void flush();
    }
  };
  const receive = () => {
    queued = true;
    void flush();
  };
  const unsubscribeTransport = transport?.subscribe(receive);
  const unsubscribeStore = store.subscribe(() => {
    const revision = store.getState().preferences.saveRevision;
    // 只在本地保存成功时广播；接收通知后的 refresh 不递增版本，避免页签相互通知形成循环。
    const saved = previousSaveRevision !== revision;
    previousSaveRevision = revision;
    if (saved) {
      try {
        transport?.publish();
      } catch {
        // 通知不可用不影响已经完成的服务端保存。
      }
    }
    if (queued) void flush();
  });
  const onResume = () => {
    // 切回页签会同时触发 focus 和 visibilitychange，只需一次读取。
    if (store.getState().preferences.initialized && !refreshing) receive();
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') onResume();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', onResume);
    window.addEventListener('pageshow', onResume);
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    stopped = true;
    activeRequest?.abort();
    unsubscribeStore();
    unsubscribeTransport?.();
    transport?.close();
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', onResume);
      window.removeEventListener('pageshow', onResume);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}
