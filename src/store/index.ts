/**
 * Redux Store 的装配入口；可注入设置 API 和启动主题，供应用与测试使用。
 * Store 管理身份、用户配置和抽屉等客户端状态，服务端业务清单交给 React Query。
 */
import { configureStore, type Middleware } from '@reduxjs/toolkit';
import preferencesReducer from './slices/preferencesSlice.ts';
import sessionReducer, { updateSessionSettings } from './slices/sessionSlice.ts';
import {
  saveUserSettings,
  refreshUserSettings,
  loadUserSettings,
} from './slices/preferencesSlice.ts';
import { parseSettingsDocument } from '../types/userSettings.ts';
import { userSettingsApi } from '../api/preferences.ts';
import { readBootstrapTheme } from './preferences/themeBootstrap.ts';
import type { ThemeMode, UserSettingsApi } from '../types/preferences.ts';
import { defaultUserSettings } from '../types/preferences.ts';

/** 仅同步被偏好状态机接受的响应，后台旧读取不能覆盖新保存的会话文档。 */
const syncSessionSettings: Middleware = (api) => (next) => (action) => {
  const before = api.getState() as {
    session: ReturnType<typeof sessionReducer>;
    preferences: ReturnType<typeof preferencesReducer>;
  };
  // 先让 reducer 处理响应，再依据处理前的请求编号判断响应是否属于有效配置请求。
  const result = next(action);
  if (!before.session.user) return result;
  const saved =
    saveUserSettings.fulfilled.match(action) && before.preferences.saveRequestId !== null;
  const refreshed =
    refreshUserSettings.fulfilled.match(action) &&
    before.preferences.refreshRequestId === action.meta.requestId;
  const loaded =
    loadUserSettings.fulfilled.match(action) &&
    before.preferences.loadRequestId === action.meta.requestId;
  if (saved || refreshed || loaded) {
    const payload = (action as ReturnType<typeof saveUserSettings.fulfilled>).payload;
    try {
      api.dispatch(
        updateSessionSettings(
          // 正式 API 返回完整文档；注入的 API 若只返回配置字段，则合并原会话文档保留其他字段。
          payload.document ??
            JSON.stringify({
              ...parseSettingsDocument(before.session.user.userSetting),
              ...payload,
            }),
        ),
      );
    } catch {
      /* 无效文档必须重新读取，不能用默认设置覆盖它。 */
    }
  }
  return result;
};

/** 可注入启动主题和设置 API；启动主题只影响等待配置时的显示，不代表登录或配置已经初始化。 */
export function createAppStore(
  api: UserSettingsApi = userSettingsApi,
  themeMode: ThemeMode = defaultUserSettings.themeMode,
) {
  return configureStore({
    reducer: { preferences: preferencesReducer, session: sessionReducer },
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
      getDefaultMiddleware({ thunk: { extraArgument: { userSettingsApi: api } } }).concat(
        syncSessionSettings,
      ),
  });
}
// HTML 已提前设置最小配色；此处只恢复用户选择到状态，完整 DOM 主题由 AppThemeProvider 接管。
export const store = createAppStore(userSettingsApi, readBootstrapTheme());
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
