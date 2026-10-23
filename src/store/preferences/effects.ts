/**
 * 用户配置副作用入口：一个 Store 订阅统一处理启动缓存、保存广播和排队刷新。
 * 启动缓存只保存服务端确认值；跨页签只发通知，再读取服务端配置，避免广播循环。
 * 清理时释放 Store、通知和浏览器监听，并取消在途及排队请求，供应用入口/HMR 使用。
 */
import type { AppStore } from '../index.ts';
import type { ThemeMode } from '@/types/preferences.ts';
import type { LoadingStyleId } from '@/types/loading.ts';
import { cancelPreferencesRequests, refreshUserSettings } from '../slices/preferencesSlice.ts';
import { bootstrapThemeKey } from './themeBootstrap.ts';
import { bootstrapLoadingKey } from './loadingBootstrap.ts';
import { createUserSettingsSyncTransport } from './sync.ts';

/** 安装配置副作用；按字段去重缓存写入，按保存版本广播，读写期间合并外部刷新通知。 */
export function startUserSettingsEffects(
  store: AppStore,
  transport = createUserSettingsSyncTransport(),
) {
  // 只记录成功写入的值；字段分别处理，某一项存储失败不阻塞另一项，后续更新仍可重试。
  let persistedTheme: ThemeMode | undefined;
  let persistedLoading: LoadingStyleId | undefined;
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
    const current = store.getState().preferences;
    // initialized 也可能来自读取失败，不能据此确认回退值；重试期间同样不写缓存。
    // 连续保存中较早成功的请求会在 saving 时推进 saved*，必须保留这次已确认的缓存。
    if (current.initialized && current.status !== 'loading' && current.status !== 'load-error') {
      if (persistedTheme !== current.savedThemeMode) {
        try {
          window.localStorage.setItem(bootstrapThemeKey, current.savedThemeMode);
          persistedTheme = current.savedThemeMode;
        } catch {
          // 缓存不可用不影响当前主题或跨页签同步，后续 Store 更新可重试。
        }
      }
      if (persistedLoading !== current.savedLoadingStyle) {
        try {
          window.localStorage.setItem(bootstrapLoadingKey, current.savedLoadingStyle);
          persistedLoading = current.savedLoadingStyle;
        } catch {
          // 图标缓存独立失败，不影响已经写入的主题缓存。
        }
      }
    }
    const revision = current.saveRevision;
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
    if (stopped) return;
    stopped = true;
    // 先解除订阅，再取消请求，避免取消流程触发新的缓存写入或通知。
    unsubscribeStore();
    activeRequest?.abort();
    cancelPreferencesRequests(store.getState);
    unsubscribeTransport?.();
    transport?.close();
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', onResume);
      window.removeEventListener('pageshow', onResume);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}
