import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  parseUserSettings,
  type ThemeMode,
  type LayoutMode,
  type UserSettings,
  type UserSettingsApi,
} from '../features/preferences/types.ts';

interface PreferencesState {
  initialized: boolean;
  refreshRequestId: string | null;
  layoutMode: LayoutMode;
  savedLayoutMode: LayoutMode;
  themeMode: ThemeMode;
  savedThemeMode: ThemeMode;
  navigationIconOnly: boolean;
  savedNavigationIconOnly: boolean;
  headerToolsIconOnly: boolean;
  savedHeaderToolsIconOnly: boolean;
  failedSettings: Partial<UserSettings> | null;
  settingsOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'saving' | 'load-error' | 'save-error';
  error: string | null;
  failedLayoutMode: LayoutMode | null;
}
interface ThunkConfig {
  state: { preferences: PreferencesState };
  extra: { userSettingsApi: UserSettingsApi };
}

export const loadUserSettings = createAsyncThunk<UserSettings, void, ThunkConfig>(
  'preferences/load',
  async (_, { extra, signal }) => parseUserSettings(await extra.userSettingsApi.load(signal)),
  {
    condition: (_, { getState }) => ['idle', 'load-error'].includes(getState().preferences.status),
  },
);
/** 后台同步不切换首屏或保存状态。 */
export const refreshUserSettings = createAsyncThunk<UserSettings, void, ThunkConfig>(
  'preferences/refresh',
  async (_, { extra, signal }) => parseUserSettings(await extra.userSettingsApi.load(signal)),
  {
    condition: (_, { getState }) => {
      const { initialized, status, refreshRequestId } = getState().preferences;
      return (
        initialized && status !== 'loading' && status !== 'saving' && refreshRequestId === null
      );
    },
  },
);

export const saveUserSettings = createAsyncThunk<UserSettings, Partial<UserSettings>, ThunkConfig>(
  'preferences/save',
  async (changes, { extra, signal, getState }) => {
    const { layoutMode, themeMode, navigationIconOnly, headerToolsIconOnly } =
      getState().preferences;
    return parseUserSettings(
      await extra.userSettingsApi.save(
        { layoutMode, themeMode, navigationIconOnly, headerToolsIconOnly, ...changes },
        signal,
      ),
    );
  },
  {
    condition: (_, { getState }) => ['ready', 'save-error'].includes(getState().preferences.status),
  },
);

const initialState: PreferencesState = {
  initialized: false,
  refreshRequestId: null,
  layoutMode: 'default',
  savedLayoutMode: 'default',
  themeMode: 'light',
  savedThemeMode: 'light',
  navigationIconOnly: false,
  savedNavigationIconOnly: false,
  headerToolsIconOnly: false,
  savedHeaderToolsIconOnly: false,
  failedSettings: null,
  settingsOpen: false,
  status: 'idle',
  error: null,
  failedLayoutMode: null,
};
function applySavedSettings(state: PreferencesState, action: PayloadAction<UserSettings>) {
  state.layoutMode = state.savedLayoutMode = action.payload.layoutMode;
  state.themeMode = state.savedThemeMode = action.payload.themeMode;
  state.navigationIconOnly = state.savedNavigationIconOnly = action.payload.navigationIconOnly;
  state.headerToolsIconOnly = state.savedHeaderToolsIconOnly = action.payload.headerToolsIconOnly;
  state.initialized = true;
  state.status = 'ready';
  state.error = null;
  state.failedLayoutMode = null;
  state.failedSettings = null;
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    openUserSettings(state) {
      state.settingsOpen = true;
    },
    closeUserSettings(state) {
      state.settingsOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserSettings.pending, (state) => {
        state.refreshRequestId = null;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadUserSettings.fulfilled, (state, action) => {
        applySavedSettings(state, action);
      })
      .addCase(loadUserSettings.rejected, (state, action) => {
        state.navigationIconOnly = state.savedNavigationIconOnly = initialState.navigationIconOnly;
        state.headerToolsIconOnly = state.savedHeaderToolsIconOnly =
          initialState.headerToolsIconOnly;
        state.initialized = true;
        state.layoutMode = state.savedLayoutMode = initialState.layoutMode;
        state.themeMode = state.savedThemeMode;
        state.status = 'load-error';
        state.error = action.error.message || '用户设置读取失败';
      })
      .addCase(refreshUserSettings.pending, (state, action) => {
        state.refreshRequestId = action.meta.requestId;
      })
      .addCase(refreshUserSettings.fulfilled, (state, action) => {
        if (state.refreshRequestId !== action.meta.requestId) return;
        state.refreshRequestId = null;
        applySavedSettings(state, action);
      })
      .addCase(refreshUserSettings.rejected, (state, action) => {
        if (state.refreshRequestId === action.meta.requestId) state.refreshRequestId = null;
        // 同步失败保留当前配置，下一次通知或回到页签时重试。
      })
      .addCase(saveUserSettings.pending, (state, action) => {
        // 开始本地写入后，之前的后台读取结果已失效。
        state.refreshRequestId = null;
        if (action.meta.arg.layoutMode) state.layoutMode = action.meta.arg.layoutMode;
        if (action.meta.arg.themeMode) state.themeMode = action.meta.arg.themeMode;
        if (typeof action.meta.arg.navigationIconOnly === 'boolean')
          state.navigationIconOnly = action.meta.arg.navigationIconOnly;
        if (typeof action.meta.arg.headerToolsIconOnly === 'boolean')
          state.headerToolsIconOnly = action.meta.arg.headerToolsIconOnly;
        state.status = 'saving';
        state.error = null;
        state.failedLayoutMode = null;
        state.failedSettings = null;
      })
      .addCase(saveUserSettings.fulfilled, (state, action) => {
        applySavedSettings(state, action);
      })
      .addCase(saveUserSettings.rejected, (state, action) => {
        state.layoutMode = state.savedLayoutMode;
        state.navigationIconOnly = state.savedNavigationIconOnly;
        state.headerToolsIconOnly = state.savedHeaderToolsIconOnly;
        state.themeMode = state.savedThemeMode;
        state.status = 'save-error';
        state.error = action.error.message || '用户设置保存失败';
        state.failedLayoutMode = action.meta.arg.layoutMode ?? null;
        state.failedSettings = action.meta.arg;
      });
  },
});
export const { openUserSettings, closeUserSettings } = preferencesSlice.actions;
export default preferencesSlice.reducer;

export const saveLayoutMode = (layoutMode: LayoutMode) => saveUserSettings({ layoutMode });
export const saveThemeMode = (themeMode: ThemeMode) => saveUserSettings({ themeMode });
