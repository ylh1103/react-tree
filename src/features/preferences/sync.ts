import type { createAppStore } from '../../store/index.ts';
import { refreshUserSettings } from '../../store/preferencesSlice.ts';

export interface UserSettingsSyncTransport {
  publish: () => void;
  subscribe: (listener: () => void) => () => void;
  close: () => void;
}

const syncKey = 'react-tree:user-settings:v1';
const changedMessage = 'user-settings-changed';

/** 只传递变更通知，接收方始终以自己的服务端配置为准。 */
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
  store: ReturnType<typeof createAppStore>,
  transport = createUserSettingsSyncTransport(),
) {
  let stopped = false;
  let queued = false;
  let refreshing = false;
  let activeRequest: { abort: () => void } | null = null;
  let previousStatus = store.getState().preferences.status;

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
    const status = store.getState().preferences.status;
    const saved = previousStatus === 'saving' && status === 'ready';
    previousStatus = status;
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
