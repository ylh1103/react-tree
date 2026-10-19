/**
 * Redux Store 的装配入口；统一注册 Slice 并设置启动主题，使用 Redux Toolkit 默认中间件。
 * Store 管理显示偏好和抽屉等客户端状态，服务端业务清单交给 React Query。
 */
import { configureStore } from '@reduxjs/toolkit';
import preferencesReducer from './slices/preferencesSlice.ts';
import { readBootstrapTheme } from './preferences/themeBootstrap.ts';
import type { ThemeMode } from '../types/preferences.ts';
import { defaultUserSettings } from '../types/preferences.ts';

/** Store 启动选项；业务 API 由各 Slice 直接调用，不参与 Store 装配。 */
export interface AppStoreOptions {
  /** 配置读取前的显示主题，不代表配置已经初始化，也不会直接写回服务端。 */
  themeMode?: ThemeMode;
}

/** 创建相互独立的 Store；保留默认中间件的不可变与可序列化检查。 */
export function createAppStore({
  themeMode = defaultUserSettings.themeMode,
}: AppStoreOptions = {}) {
  return configureStore({
    // 新增 Slice 在此注册 reducer；请求与业务流程放在对应 API 和 thunk 中。
    reducer: { preferences: preferencesReducer },
    // 启动时用传入的 themeMode 显示主题；savedThemeMode 保存同一值，供配置读取失败时恢复。
    // 此时 initialized 为 false；首次读取结束后变为 true，读取失败也算结束。
    // 配置读取成功前不允许编辑，也不更新本地主题缓存；这些限制还需结合 status 判断。
    preloadedState: {
      preferences: {
        ...preferencesReducer(undefined, { type: 'preferences/init' }),
        themeMode,
        savedThemeMode: themeMode,
      },
    },
  });
}
// HTML 已提前设置最小配色；此处只恢复用户选择到状态，完整 DOM 主题由 AppThemeProvider 接管。
export const store = createAppStore({ themeMode: readBootstrapTheme() });
/** 应用及同步订阅共用的 Store 类型，随 reducer 和中间件配置自动推导。 */
export type AppStore = ReturnType<typeof createAppStore>;
/** 根状态与派发类型保持由真实 Store 推导，新增 Slice 后无需手写维护。 */
export type RootState = ReturnType<typeof store.getState>;
/** 包含默认 thunk 中间件的派发类型，支持在 thunk 内继续派发其他 thunk。 */
export type AppDispatch = typeof store.dispatch;
