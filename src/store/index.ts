/**
 * Redux Store 的装配入口；统一注册 Slice 并设置启动主题和图标，使用 Redux Toolkit 默认中间件。
 * Store 管理显示偏好和抽屉等客户端状态，服务端业务清单交给 React Query。
 */
import { configureStore } from '@reduxjs/toolkit';
import preferencesReducer from './slices/preferencesSlice.ts';
import { readBootstrapTheme } from './preferences/themeBootstrap.ts';
import { readBootstrapLoading } from './preferences/loadingBootstrap.ts';
import type { LoadingStyleId } from '../types/loading.ts';
import type { ThemeMode } from '../types/preferences.ts';
import { defaultUserSettings } from '../types/preferences.ts';

/** Store 启动选项；业务 API 由各 Slice 直接调用，不参与 Store 装配。 */
export interface AppStoreOptions {
  /** 配置读取前的显示主题，不代表配置已经初始化，也不会直接写回服务端。 */
  themeMode?: ThemeMode;
  /** 配置读取前的图标提示，同时作为读取失败时的回退值，不代表服务端配置已初始化。 */
  loadingStyle?: LoadingStyleId;
}

/** 创建相互独立的 Store；保留默认中间件的不可变与可序列化检查。 */
export function createAppStore({
  themeMode = defaultUserSettings.themeMode,
  loadingStyle = defaultUserSettings.loadingStyle,
}: AppStoreOptions = {}) {
  return configureStore({
    // 新增 Slice 在此注册 reducer；请求与业务流程放在对应 API 和 thunk 中。
    reducer: { preferences: preferencesReducer },
    // themeMode/loadingStyle 先采用启动提示，saved 字段保存相同值，供首次配置读取失败时回退。
    // 这些初始 saved 值尚不代表本次请求已获服务端确认，因此保留 initialized=false 和初始请求状态。
    // 首次读取失败也会结束等待；编辑资格与缓存写入仍需结合 status 判断，不能仅检查 initialized。
    preloadedState: {
      preferences: {
        ...preferencesReducer(undefined, { type: 'preferences/init' }),
        themeMode,
        savedThemeMode: themeMode,
        loadingStyle,
        savedLoadingStyle: loadingStyle,
      },
    },
  });
}
// HTML 已选好本次启动的配色和图标；Store 读取相同缓存建立显示基线，不把配置标记为已初始化。
// 后续完整 DOM 配色由 AppThemeProvider 接管，HTML 图标保留原方案直到交接时被移除。
export const store = createAppStore({
  themeMode: readBootstrapTheme(),
  loadingStyle: readBootstrapLoading(),
});
/** 应用及同步订阅共用的 Store 类型，随 reducer 和中间件配置自动推导。 */
export type AppStore = ReturnType<typeof createAppStore>;
/** 根状态与派发类型保持由真实 Store 推导，新增 Slice 后无需手写维护。 */
export type RootState = ReturnType<typeof store.getState>;
/** 包含默认 thunk 中间件的派发类型，支持在 thunk 内继续派发其他 thunk。 */
export type AppDispatch = typeof store.dispatch;
