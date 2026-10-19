/**
 * Redux Store 的装配入口；可注入设置 API 和启动主题，供应用与测试使用。
 * Store 管理显示偏好和抽屉等客户端状态，服务端业务清单交给 React Query。
 */
import { configureStore } from '@reduxjs/toolkit';
import preferencesReducer from './slices/preferencesSlice.ts';
import { userSettingsApi } from '../api/preferences.ts';
import { readBootstrapTheme } from './preferences/themeBootstrap.ts';
import type { ThemeMode, UserSettingsApi } from '../types/preferences.ts';
import { defaultUserSettings } from '../types/preferences.ts';

/** 可注入启动主题和设置 API；启动主题只影响等待配置时的显示，不代表配置已经初始化。 */
export function createAppStore(
  api: UserSettingsApi = userSettingsApi,
  themeMode: ThemeMode = defaultUserSettings.themeMode,
) {
  return configureStore({
    reducer: { preferences: preferencesReducer },
    // 当前值和回退基线先沿用启动选择，读取失败时仍能保留配色。
    // initialized 保持 false；只有有效服务端配置进入状态机后，才允许编辑并更新启动缓存。
    preloadedState: {
      preferences: {
        ...preferencesReducer(undefined, { type: 'preferences/init' }),
        themeMode,
        savedThemeMode: themeMode,
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { userSettingsApi: api } } }),
  });
}
// HTML 已提前设置最小配色；此处只恢复用户选择到状态，完整 DOM 主题由 AppThemeProvider 接管。
export const store = createAppStore(userSettingsApi, readBootstrapTheme());
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
