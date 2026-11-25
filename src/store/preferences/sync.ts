/**
 * 跨页签配置同步：账号偏好广播变更信号，游客主题由浏览器存储同步。
 * Store 订阅和账号请求协调由 effects.ts 统一管理。
 */
import { currentUserStorageKey, userStorageKey } from '../../utils/userStorage.ts';
import { defaultUserSettings } from '../../types/preferences.ts';
import { parseThemeMode, type ThemeMode } from '../../types/themeMode.ts';
import { bootstrapThemeKey } from './themeBootstrap.ts';
/** 通知通道契约；取消接收与关闭通道分别释放监听和底层资源。 */
interface UserSettingsSyncTransport {
  publish: () => void;
  subscribe: (listener: () => void) => () => void;
  close: () => void;
}

const syncResource = 'parameter-management:display-settings:v1';
const changedMessage = 'user-settings-changed';

/** 游客页签只接收匿名首屏主题；读取当前缓存避免排队事件应用已被覆盖的旧值。 */
export function subscribeToAnonymousTheme(applyTheme: (mode: ThemeMode) => void) {
  if (typeof window === 'undefined') return;
  const browser = window;
  let storage: Storage;
  try {
    storage = browser.localStorage;
  } catch {
    return;
  }
  const themeKey = userStorageKey(bootstrapThemeKey);
  const receive = (event: StorageEvent) => {
    if (event.storageArea !== storage || (event.key !== themeKey && event.key !== null)) return;
    let cached: string | null;
    try {
      cached = storage.getItem(themeKey);
    } catch {
      return;
    }
    applyTheme(parseThemeMode(cached?.split('|', 1)[0]) ?? defaultUserSettings.themeMode);
  };
  browser.addEventListener('storage', receive);
  return () => browser.removeEventListener('storage', receive);
}

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
