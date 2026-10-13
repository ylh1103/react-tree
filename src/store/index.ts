/**
 * Redux Store 的装配入口；可注入设置 API 和启动主题，供应用与测试使用。
 * Store 只管理用户配置和抽屉等客户端状态，服务端业务清单交给 React Query。
 */
import { configureStore } from '@reduxjs/toolkit';
import preferencesReducer from './slices/preferencesSlice.ts';
import { userSettingsApi } from '../api/preferences.ts';
import { readBootstrapTheme } from './preferences/themeBootstrap.ts';
import type { ThemeMode, UserSettingsApi } from '../types/preferences.ts';
import { defaultUserSettings } from '../types/preferences.ts';

export function createAppStore(
  api: UserSettingsApi = userSettingsApi,
  themeMode: ThemeMode = defaultUserSettings.themeMode,
) {
  return configureStore({
    reducer: { preferences: preferencesReducer },
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
export const store = createAppStore(userSettingsApi, readBootstrapTheme());
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
