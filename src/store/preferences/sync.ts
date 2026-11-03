/**
 * 跨页签配置通知通道：优先使用 BroadcastChannel，不可用时回退 storage 事件。
 * 只传递变更信号，不传递配置正文；Store 订阅和请求协调由 effects.ts 统一管理。
 */
import { currentUserStorageKey } from '../../utils/userStorage.ts';
/** 通知通道契约；取消接收与关闭通道分别释放监听和底层资源。 */
export interface UserSettingsSyncTransport {
  publish: () => void;
  subscribe: (listener: () => void) => () => void;
  close: () => void;
}

const syncResource = 'parameter-management:display-settings:v1';
const changedMessage = 'user-settings-changed';

/** 只传递变更通知，接收方重新读取设置接口，不在广播中传递配置正文。 */
export function createUserSettingsSyncTransport(): UserSettingsSyncTransport | null {
  if (typeof window === 'undefined') return null;
  // 通道固定在创建时的身份，其他用户的保存通知不会触发刷新。
  const syncKey = currentUserStorageKey(syncResource);

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
