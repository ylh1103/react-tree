/**
 * 用户配置状态机：首次读取、后台同步、乐观保存、失败回退和重试。
 * 当前字段驱动即时 UI，saved 字段记录服务端确认值；requestId 阻止旧后台响应覆盖本地保存。
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  defaultUserSettings,
  parseUserSettings,
  type ThemeMode,
  type NavigationTheme,
  type LayoutMode,
  type UserSettings,
  type UserSettingsApi,
  type UserSettingsSnapshot,
} from '../../types/preferences.ts';

// initialized 决定是否结束首屏等待；读取失败也会置为 true，让页面使用回退配置。
// refreshRequestId 只标识后台读取；本地保存开始时清空它，使迟到的旧响应失效。
interface PreferencesState {
  initialized: boolean;
  loadRequestId: string | null;
  refreshRequestId: string | null;
  saveRequestId: string | null;
  saveRevision: number;
  saveChanges: Partial<UserSettings> | null;
  layoutMode: LayoutMode;
  savedLayoutMode: LayoutMode;
  layoutGap: number;
  savedLayoutGap: number;
  // 滑块拖动中的临时预览，不写入服务端配置。
  previewLayoutGap: number | null;
  borderRadius: number;
  savedBorderRadius: number;
  previewBorderRadius: number | null;
  controlBorderRadius: number;
  savedControlBorderRadius: number;
  previewControlBorderRadius: number | null;
  themeMode: ThemeMode;
  savedThemeMode: ThemeMode;
  navigationTheme: NavigationTheme;
  savedNavigationTheme: NavigationTheme;
  navigationIconOnly: boolean;
  savedNavigationIconOnly: boolean;
  headerToolsIconOnly: boolean;
  savedHeaderToolsIconOnly: boolean;
  // 保存失败的输入用于重试，与当前已回退的 UI 配置分开保存。
  failedSettings: Partial<UserSettings> | null;
  settingsOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'saving' | 'load-error' | 'save-error';
  error: string | null;
  failedLayoutMode: LayoutMode | null;
}

// 控制器按 Store 隔离且不进入 Redux，退出会话时同时取消读取与排队中的写入。
const activeRequests = new WeakMap<() => ThunkConfig['state'], Set<AbortController>>();
const requestRevisions = new WeakMap<() => ThunkConfig['state'], number>();
export function cancelPreferencesRequests(getState: () => ThunkConfig['state']) {
  requestRevisions.set(getState, (requestRevisions.get(getState) ?? 0) + 1);
  activeRequests.get(getState)?.forEach((controller) => controller.abort());
}
async function settingsRequest(
  getState: () => ThunkConfig['state'],
  signal: AbortSignal,
  request: (signal: AbortSignal) => Promise<UserSettingsSnapshot>,
) {
  const controller = new AbortController();
  const requests = activeRequests.get(getState) ?? new Set<AbortController>();
  activeRequests.set(getState, requests);
  requests.add(controller);
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  const identity = getState().session?.user?.ystId;
  try {
    signal.throwIfAborted();
    const result = await request(controller.signal);
    controller.signal.throwIfAborted();
    if (getState().session?.user?.ystId !== identity) throw new Error('忽略旧用户设置响应');
    return {
      ...parseUserSettings(result),
      ...(result.document ? { document: result.document } : {}),
    };
  } finally {
    signal.removeEventListener('abort', cancel);
    requests.delete(controller);
  }
}
interface ThunkConfig {
  state: { preferences: PreferencesState; session?: { user: { ystId: string } | null } };
  extra: { userSettingsApi: UserSettingsApi };
}

export const loadUserSettings = createAsyncThunk<UserSettingsSnapshot, void, ThunkConfig>(
  'preferences/load',
  async (_, { extra, signal, getState }) =>
    settingsRequest(getState, signal, (requestSignal) => extra.userSettingsApi.load(requestSignal)),
  {
    condition: (_, { getState }) => ['idle', 'load-error'].includes(getState().preferences.status),
  },
);
/** 后台同步不切换首屏或保存状态。 */
export const refreshUserSettings = createAsyncThunk<UserSettingsSnapshot, void, ThunkConfig>(
  'preferences/refresh',
  async (_, { extra, signal, getState }) =>
    settingsRequest(getState, signal, (requestSignal) => extra.userSettingsApi.load(requestSignal)),
  {
    condition: (_, { getState }) => {
      const { initialized, status, refreshRequestId } = getState().preferences;
      return (
        initialized && status !== 'loading' && status !== 'saving' && refreshRequestId === null
      );
    },
  },
);

// 每个 Store 独立串行保存完整快照；连续修改立即进入 Redux，后续请求不会被丢弃。
const saveQueues = new WeakMap<() => ThunkConfig['state'], Promise<void>>();
function currentSettings(state: PreferencesState): UserSettings {
  const {
    layoutMode,
    layoutGap,
    borderRadius,
    controlBorderRadius,
    themeMode,
    navigationTheme,
    navigationIconOnly,
    headerToolsIconOnly,
  } = state;
  return {
    layoutMode,
    layoutGap,
    borderRadius,
    controlBorderRadius,
    themeMode,
    navigationTheme,
    navigationIconOnly,
    headerToolsIconOnly,
  };
}
export const saveUserSettings = createAsyncThunk<
  UserSettingsSnapshot,
  Partial<UserSettings>,
  ThunkConfig
>(
  'preferences/save',
  async (changes, { extra, signal, getState }) => {
    const identity = getState().session?.user?.ystId;
    const revision = requestRevisions.get(getState) ?? 0;
    const settings = parseUserSettings({ ...currentSettings(getState().preferences), ...changes });
    const send = async () => {
      signal.throwIfAborted();
      if (
        getState().session?.user?.ystId !== identity ||
        (requestRevisions.get(getState) ?? 0) !== revision
      )
        throw new Error('会话已变化，取消旧用户设置保存');
      const saved = await settingsRequest(getState, signal, (requestSignal) =>
        extra.userSettingsApi.save(settings, requestSignal),
      );
      if (getState().session?.user?.ystId !== identity) throw new Error('忽略旧用户设置响应');
      return saved;
    };
    const previous = saveQueues.get(getState);
    const request = previous ? previous.then(send) : send();
    const settled = request.then(
      () => {},
      () => {},
    );
    saveQueues.set(getState, settled);
    try {
      return await request;
    } finally {
      if (saveQueues.get(getState) === settled) saveQueues.delete(getState);
    }
  },
  {
    condition: (_, { getState }) =>
      ['ready', 'saving', 'save-error'].includes(getState().preferences.status),
  },
);

const initialState: PreferencesState = {
  initialized: false,
  loadRequestId: null,
  refreshRequestId: null,
  saveRequestId: null,
  saveRevision: 0,
  saveChanges: null,
  layoutMode: 'default',
  savedLayoutMode: 'default',
  layoutGap: defaultUserSettings.layoutGap,
  savedLayoutGap: defaultUserSettings.layoutGap,
  previewLayoutGap: null,
  borderRadius: defaultUserSettings.borderRadius,
  savedBorderRadius: defaultUserSettings.borderRadius,
  previewBorderRadius: null,
  controlBorderRadius: defaultUserSettings.controlBorderRadius,
  savedControlBorderRadius: defaultUserSettings.controlBorderRadius,
  previewControlBorderRadius: null,
  themeMode: defaultUserSettings.themeMode,
  savedThemeMode: defaultUserSettings.themeMode,
  navigationTheme: defaultUserSettings.navigationTheme,
  savedNavigationTheme: defaultUserSettings.navigationTheme,
  navigationIconOnly: defaultUserSettings.navigationIconOnly,
  savedNavigationIconOnly: defaultUserSettings.navigationIconOnly,
  headerToolsIconOnly: defaultUserSettings.headerToolsIconOnly,
  savedHeaderToolsIconOnly: defaultUserSettings.headerToolsIconOnly,
  failedSettings: null,
  settingsOpen: false,
  status: 'idle',
  error: null,
  failedLayoutMode: null,
};
function updateSavedSettings(state: PreferencesState, settings: UserSettings) {
  state.savedLayoutMode = settings.layoutMode;
  state.savedLayoutGap = settings.layoutGap;
  state.savedBorderRadius = settings.borderRadius;
  state.savedControlBorderRadius = settings.controlBorderRadius;
  state.savedThemeMode = settings.themeMode;
  state.savedNavigationTheme = settings.navigationTheme;
  state.savedNavigationIconOnly = settings.navigationIconOnly;
  state.savedHeaderToolsIconOnly = settings.headerToolsIconOnly;
}
function applySavedSettings(
  state: PreferencesState,
  action: PayloadAction<UserSettings>,
  preservePreview = false,
) {
  Object.assign(state, parseUserSettings(action.payload));
  updateSavedSettings(state, action.payload);
  if (!preservePreview) {
    state.previewLayoutGap = null;
    state.previewBorderRadius = null;
    state.previewControlBorderRadius = null;
  }
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
    /** 登录响应初始化设置，避免首屏再次请求设置接口。 */
    initializePreferences(state, action: PayloadAction<UserSettings>) {
      applySavedSettings(state, action);
    },
    resetPreferences() {
      return initialState;
    },
    invalidPreferences(state, action: PayloadAction<string>) {
      state.initialized = true;
      state.status = 'load-error';
      state.error = action.payload;
    },
    openUserSettings(state) {
      state.settingsOpen = true;
    },
    closeUserSettings(state) {
      state.settingsOpen = false;
      state.previewLayoutGap = null;
      state.previewBorderRadius = null;
      state.previewControlBorderRadius = null;
    },
    previewLayoutGap(state, action: PayloadAction<number | null>) {
      state.previewLayoutGap = action.payload;
    },
    previewControlBorderRadius(state, action: PayloadAction<number | null>) {
      state.previewControlBorderRadius = action.payload;
    },
    previewBorderRadius(state, action: PayloadAction<number | null>) {
      state.previewBorderRadius = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserSettings.pending, (state, action) => {
        state.loadRequestId = action.meta.requestId;
        state.refreshRequestId = null;
        state.status = 'loading';
        state.previewLayoutGap = null;
        state.previewBorderRadius = null;
        state.previewControlBorderRadius = null;
        state.error = null;
      })
      .addCase(loadUserSettings.fulfilled, (state, action) => {
        if (state.loadRequestId !== action.meta.requestId) return;
        state.loadRequestId = null;
        applySavedSettings(state, action);
      })
      .addCase(loadUserSettings.rejected, (state, action) => {
        if (state.loadRequestId !== action.meta.requestId) return;
        state.loadRequestId = null;
        state.navigationTheme = state.savedNavigationTheme = initialState.navigationTheme;
        state.navigationIconOnly = state.savedNavigationIconOnly = initialState.navigationIconOnly;
        state.headerToolsIconOnly = state.savedHeaderToolsIconOnly =
          initialState.headerToolsIconOnly;
        state.initialized = true;
        state.layoutMode = state.savedLayoutMode = initialState.layoutMode;
        state.layoutGap = state.savedLayoutGap = initialState.layoutGap;
        state.borderRadius = state.savedBorderRadius = initialState.borderRadius;
        state.controlBorderRadius = state.savedControlBorderRadius =
          initialState.controlBorderRadius;
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
        state.saveChanges = {
          ...(state.status === 'saving' ? state.saveChanges : {}),
          ...action.meta.arg,
        };
        state.saveRequestId = action.meta.requestId;
        // 开始本地写入后，之前的后台读取结果已失效；只清理本次提交字段的预览。
        state.refreshRequestId = null;
        if (action.meta.arg.layoutGap !== undefined) state.previewLayoutGap = null;
        if (action.meta.arg.borderRadius !== undefined) state.previewBorderRadius = null;
        if (action.meta.arg.controlBorderRadius !== undefined)
          state.previewControlBorderRadius = null;
        if (action.meta.arg.layoutMode) state.layoutMode = action.meta.arg.layoutMode;
        if (typeof action.meta.arg.layoutGap === 'number')
          state.layoutGap = action.meta.arg.layoutGap;
        if (typeof action.meta.arg.controlBorderRadius === 'number')
          state.controlBorderRadius = action.meta.arg.controlBorderRadius;
        if (typeof action.meta.arg.borderRadius === 'number')
          state.borderRadius = action.meta.arg.borderRadius;
        if (action.meta.arg.themeMode) state.themeMode = action.meta.arg.themeMode;
        if (action.meta.arg.navigationTheme)
          state.navigationTheme = action.meta.arg.navigationTheme;
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
        if (!state.saveRequestId) return;
        state.saveRevision++;
        updateSavedSettings(state, action.payload);
        if (state.saveRequestId !== action.meta.requestId) return;
        applySavedSettings(state, action, true);
        state.saveRequestId = null;
        state.saveChanges = null;
      })
      .addCase(saveUserSettings.rejected, (state, action) => {
        if (state.saveRequestId !== action.meta.requestId) return;
        state.saveRequestId = null;
        state.layoutMode = state.savedLayoutMode;
        state.layoutGap = state.savedLayoutGap;
        state.borderRadius = state.savedBorderRadius;
        state.controlBorderRadius = state.savedControlBorderRadius;
        state.navigationIconOnly = state.savedNavigationIconOnly;
        state.headerToolsIconOnly = state.savedHeaderToolsIconOnly;
        state.themeMode = state.savedThemeMode;
        state.navigationTheme = state.savedNavigationTheme;
        state.status = 'save-error';
        state.error = action.error.message || '用户设置保存失败';
        state.failedSettings = state.saveChanges ?? action.meta.arg;
        state.failedLayoutMode = state.failedSettings.layoutMode ?? null;
        state.saveChanges = null;
      });
  },
});
export const {
  initializePreferences,
  resetPreferences,
  invalidPreferences,
  openUserSettings,
  closeUserSettings,
  previewLayoutGap,
  previewBorderRadius,
  previewControlBorderRadius,
} = preferencesSlice.actions;
export default preferencesSlice.reducer;

export const saveLayoutMode = (layoutMode: LayoutMode) => saveUserSettings({ layoutMode });
export const saveThemeMode = (themeMode: ThemeMode) => saveUserSettings({ themeMode });
