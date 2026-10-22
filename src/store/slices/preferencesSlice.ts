/**
 * 用户配置状态机：首次读取、后台同步、乐观保存、失败回退和重试。
 * 当前字段驱动即时 UI，配置成功初始化后的 saved 字段记录服务端确认值；requestId 阻止旧后台响应覆盖本地保存。
 * 初始化前 Store 可临时注入启动主题和图标基线，但 initialized 保持 false，不能据此保存用户配置。
 * 流程入口：启动时调用 loadUserSettings，读取失败沿用同一入口重试；修改走 saveUserSettings。
 * 状态流转：idle → loading → ready/load-error；ready/save-error → saving → ready/save-error。
 * refreshUserSettings 只在后台更新，不进入 loading；抽屉关闭也不会取消已提交的保存。
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '../createAppAsyncThunk.ts';
import { userSettingsApi } from '../../api/preferences.ts';
import type { LoadingStyleId } from '../../types/loading.ts';
import {
  defaultUserSettings,
  parseUserSettings,
  type ThemeMode,
  type NavigationTheme,
  type LayoutMode,
  type UserSettings,
} from '../../types/preferences.ts';

/**
 * 用户偏好状态：继承 UserSettings 的可持久化配置，当前值驱动 UI，保存时乐观更新。
 * 本地仅补充读写和交互状态；saved* 保存确认基线，preview* 只用于临时预览。
 */
interface PreferencesState extends UserSettings {
  /** 首次读取成功前为启动图标提示，成功后为服务端确认方案；读取或保存失败时据此回退。 */
  savedLoadingStyle: LoadingStyleId;
  /** 是否结束首次配置等待；读取失败也置为 true，让页面展示回退配置与重试入口。 */
  initialized: boolean;
  /** 当前首次读取或重试的请求编号；用于忽略已失效的读取响应，null 表示无有效请求。 */
  loadRequestId: string | null;
  /** 当前后台同步的请求编号；本地保存开始时清空，防止迟到的旧响应覆盖本地修改。 */
  refreshRequestId: string | null;
  /** 最新一次保存的请求编号；只有该请求能结束保存状态或触发失败回退。 */
  saveRequestId: string | null;
  /** 每次被接受的保存成功都递增，供跨页签同步发布通知；不是服务端版本号。 */
  saveRevision: number;
  /** 合并连续保存中的修改项；最新请求失败时保留为重试输入，避免只重试最后一个字段。 */
  saveChanges: Partial<UserSettings> | null;
  /** 已确认的布局模式，供保存失败时回退；初始化前使用默认值。 */
  savedLayoutMode: LayoutMode;
  /** 已确认的模块间距（px），供保存失败时回退。 */
  savedLayoutGap: number;
  /** 滑块拖动时的模块间距预览（px），不写入服务端；null 表示使用当前配置。 */
  previewLayoutGap: number | null;
  /** 已确认的面板和列表节点圆角（px），供保存失败时回退。 */
  savedBorderRadius: number;
  /** 面板和列表节点的临时圆角预览（px）；null 表示使用当前配置，不单独持久化。 */
  previewBorderRadius: number | null;
  /** 已确认的控件基础圆角（px），供保存失败时回退。 */
  savedControlBorderRadius: number;
  /** 控件基础圆角的临时预览（px）；null 表示使用当前配置，不单独持久化。 */
  previewControlBorderRadius: number | null;
  /** 读取前为启动配色基线，读取后为服务端确认主题，用于失败回退和下一次启动缓存。 */
  savedThemeMode: ThemeMode;
  /** 已确认的导航配色策略，供保存失败时回退。 */
  savedNavigationTheme: NavigationTheme;
  /** 已确认的导航图标显示方式，供保存失败时回退。 */
  savedNavigationIconOnly: boolean;
  /** 已确认的顶栏工具图标显示方式，供保存失败时回退。 */
  savedHeaderToolsIconOnly: boolean;
  /** 保存失败后保留的修改项，供显式重试；与已经回退的 UI 配置分开保存。 */
  failedSettings: Partial<UserSettings> | null;
  /** 用户设置抽屉是否打开，只影响本地交互，不持久化。 */
  settingsOpen: boolean;
  /** 读写阶段：idle 未读取，loading 读取中，ready 可编辑，saving 保存中，其余为读写失败。 */
  status: 'idle' | 'loading' | 'ready' | 'saving' | 'load-error' | 'save-error';
  /** 最近一次首次读取或保存失败的提示文本；null 表示没有待展示错误。 */
  error: string | null;
  /** 保存失败时的目标布局模式，供布局重试入口使用；本次未修改布局时为 null。 */
  failedLayoutMode: LayoutMode | null;
}

/** 按 Store 跟踪在途设置请求的取消控制器；放在 Redux 外以保持状态可序列化。 */
const activeRequests = new WeakMap<() => PreferencesStoreState, Set<AbortController>>();
/** 每个 Store 的取消代次；排队保存以此判断入队后是否已经整体取消。 */
const requestRevisions = new WeakMap<() => PreferencesStoreState, number>();
/**
 * 中止在途请求并提升取消代次；排队但尚未发送的保存也会在发送前被拦截。
 * @param getState 目标 Store 的状态读取函数，同时作为请求集合与取消代次的隔离键。
 */
export function cancelPreferencesRequests(getState: () => PreferencesStoreState) {
  requestRevisions.set(getState, (requestRevisions.get(getState) ?? 0) + 1);
  activeRequests.get(getState)?.forEach((controller) => controller.abort());
}
/**
 * 所有设置读写的取消边界：同时响应 thunk 取消和配置流程的整体取消。
 * 请求结束后再次检查信号，防止被取消的响应进入配置状态机。
 * @param getState 定位所属 Store 的在途请求集合。
 * @param signal thunk 提供的取消信号，转发给内部请求控制器。
 * @param request 实际读写操作，必须继续传递 HTTP 取消信号。
 * @returns 校验后的平台配置；完整配置文档不进入状态机。
 */
async function settingsRequest(
  getState: () => PreferencesStoreState,
  signal: AbortSignal,
  request: (signal: AbortSignal) => Promise<UserSettings>,
) {
  const controller = new AbortController();
  const requests = activeRequests.get(getState) ?? new Set<AbortController>();
  activeRequests.set(getState, requests);
  requests.add(controller);
  /** 将 thunk 的取消事件转发到实际请求；请求结束后移除此监听。 */
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  try {
    signal.throwIfAborted();
    const result = await request(controller.signal);
    controller.signal.throwIfAborted();
    return parseUserSettings(result);
  } finally {
    signal.removeEventListener('abort', cancel);
    requests.delete(controller);
  }
}
/** 偏好请求协调器只读取本 Slice；其他 Slice 的新增不改变取消与串行保存的契约。 */
interface PreferencesStoreState {
  /** 当前 Store 的偏好状态；getState 函数同时作为请求集合与队列的隔离键。 */
  preferences: PreferencesState;
}

/** 首次配置读取或错误重试，不依赖用户资料初始化。 */
export const loadUserSettings = createAppAsyncThunk<UserSettings, void>(
  'preferences/load',
  async (_, { signal, getState }) =>
    settingsRequest(getState, signal, (requestSignal) => userSettingsApi.load(requestSignal)),
  {
    /** 仅未读取或读取失败时允许启动，避免重复读取以及覆盖正在编辑的配置。 */
    condition: (_, { getState }) => ['idle', 'load-error'].includes(getState().preferences.status),
  },
);
/** 后台同步不切换首屏或保存状态；已有读取或保存时拒绝启动，由同步协调层合并通知。 */
export const refreshUserSettings = createAppAsyncThunk<UserSettings, void>(
  'preferences/refresh',
  async (_, { signal, getState }) =>
    settingsRequest(getState, signal, (requestSignal) => userSettingsApi.load(requestSignal)),
  {
    /** 首次等待结束且没有读取、保存或后台同步时才允许刷新，避免并发覆盖。 */
    condition: (_, { getState }) => {
      const { initialized, status, refreshRequestId } = getState().preferences;
      return (
        initialized && status !== 'loading' && status !== 'saving' && refreshRequestId === null
      );
    },
  },
);

/** 每个 Store 的串行保存队列尾部；连续修改立即进入 Redux，完整快照按入队顺序发送。 */
const saveQueues = new WeakMap<() => PreferencesStoreState, Promise<void>>();

/** 只提取可持久化字段，不把预览值、抽屉状态、错误和请求编号发送给后端。 */
function currentSettings(state: PreferencesState): UserSettings {
  const {
    loadingStyle,
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
    loadingStyle,
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

/**
 * 提交部分配置修改：pending 先乐观更新 UI，再按 Store 串行保存入队时的完整快照。
 * 成功后推进确认基线，最新请求失败时回退并保留合并修改供重试；整体取消时拦截排队中的旧写入。
 */
export const saveUserSettings = createAppAsyncThunk<UserSettings, Partial<UserSettings>>(
  'preferences/save',
  async (changes, { signal, getState }) => {
    const revision = requestRevisions.get(getState) ?? 0;
    // pending reducer 已同步应用本次修改；在入队时固定快照，保证连续操作按发生顺序保存。
    const settings = parseUserSettings({ ...currentSettings(getState().preferences), ...changes });
    /** 轮到本快照时检查取消信号与取消代次，再发送可取消的保存请求。 */
    const send = async () => {
      signal.throwIfAborted();
      if ((requestRevisions.get(getState) ?? 0) !== revision) throw new Error('配置保存已取消');
      const saved = await settingsRequest(getState, signal, (requestSignal) =>
        userSettingsApi.save(settings, requestSignal),
      );
      return saved;
    };
    const previous = saveQueues.get(getState);
    const request = previous ? previous.then(send) : send();
    // 队列尾部始终转为 fulfilled，让前一次失败后仍可发送后续修改。
    // 原始 request 仍向 thunk 抛错，失败反馈与回退不会被这里吞掉。
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
    /** 只允许读取成功后的编辑和失败重试；首次读取未完成或失败时禁止覆盖服务端文档。 */
    condition: (_, { getState }) =>
      ['ready', 'saving', 'save-error'].includes(getState().preferences.status),
  },
);

/** 创建或重置 Slice 时使用的默认状态；各字段含义见 PreferencesState，默认值不代表已读取。 */
const initialState: PreferencesState = {
  loadingStyle: defaultUserSettings.loadingStyle,
  savedLoadingStyle: defaultUserSettings.loadingStyle,
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

/** 更新服务端确认基线；较早保存成功时也要推进基线，供后续保存失败正确回退。 */
function updateSavedSettings(state: PreferencesState, settings: UserSettings) {
  state.savedLoadingStyle = settings.loadingStyle;
  state.savedLayoutMode = settings.layoutMode;
  state.savedLayoutGap = settings.layoutGap;
  state.savedBorderRadius = settings.borderRadius;
  state.savedControlBorderRadius = settings.controlBorderRadius;
  state.savedThemeMode = settings.themeMode;
  state.savedNavigationTheme = settings.navigationTheme;
  state.savedNavigationIconOnly = settings.navigationIconOnly;
  state.savedHeaderToolsIconOnly = settings.headerToolsIconOnly;
}

/**
 * 将已确认配置同时应用到当前值和回退基线，并清除错误。
 * 保存完成时保留用户新一轮拖动的预览；初始化/后台读取则清除旧预览。
 * @param state 当前偏好状态，由 reducer 提供可修改的 Immer 草稿。
 * @param action 携带已确认配置的动作，只将平台配置白名单字段应用到状态。
 * @param preservePreview 是否保留用户尚未提交的滑块预览，默认清除。
 */
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

/** 汇总偏好同步动作和异步请求生命周期处理，生成供 Store 注册的 reducer。 */
const preferencesSlice = createSlice({
  /** Redux 动作类型前缀，用于区分用户偏好与其他状态模块。 */
  name: 'preferences',
  /** 首次创建与重置时采用的状态基线。 */
  initialState,
  /** 本地交互与配置重置动作；这些 reducer 自身不发送请求。 */
  reducers: {
    /** 清空显示偏好与请求标识，恢复默认状态；整体重置前应另行取消在途请求。 */
    resetPreferences() {
      return initialState;
    },
    /** 打开设置抽屉，不触发额外读取或保存。 */
    openUserSettings(state) {
      state.settingsOpen = true;
    },
    /** 关闭抽屉并丢弃未提交预览；已派发的自动保存继续由串行队列处理。 */
    closeUserSettings(state) {
      state.settingsOpen = false;
      state.previewLayoutGap = null;
      state.previewBorderRadius = null;
      state.previewControlBorderRadius = null;
    },
    /** 设置模块间距的临时预览；传 null 恢复使用当前配置，不发起保存。 */
    previewLayoutGap(state, action: PayloadAction<number | null>) {
      state.previewLayoutGap = action.payload;
    },
    /** 设置控件基础圆角的临时预览；传 null 取消预览，不发起保存。 */
    previewControlBorderRadius(state, action: PayloadAction<number | null>) {
      state.previewControlBorderRadius = action.payload;
    },
    /** 设置面板和列表节点圆角的临时预览；传 null 取消预览，不发起保存。 */
    previewBorderRadius(state, action: PayloadAction<number | null>) {
      state.previewBorderRadius = action.payload;
    },
  },
  /** 按请求生命周期维护加载、同步、乐观保存与失败回退，并通过请求编号过滤过期响应。 */
  extraReducers: (builder) => {
    builder
      // 首次读取或重试开始：记录有效请求，清除旧预览及错误，进入加载状态。
      .addCase(loadUserSettings.pending, (state, action) => {
        state.loadRequestId = action.meta.requestId;
        state.refreshRequestId = null;
        state.status = 'loading';
        state.previewLayoutGap = null;
        state.previewBorderRadius = null;
        state.previewControlBorderRadius = null;
        state.error = null;
      })
      // 首次读取成功：仅接受当前有效请求，将配置应用到 UI 和确认基线。
      .addCase(loadUserSettings.fulfilled, (state, action) => {
        if (state.loadRequestId !== action.meta.requestId) return;
        state.loadRequestId = null;
        applySavedSettings(state, action);
      })
      // 初始读取或手动重试失败都结束等待：保留主题、图标基线，其他显示项恢复默认，并保留错误供重试。
      .addCase(loadUserSettings.rejected, (state, action) => {
        if (state.loadRequestId !== action.meta.requestId) return;
        state.loadRequestId = null;
        state.loadingStyle = state.savedLoadingStyle;
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
        // 读取失败时保留已有主题和图标基线；其他显示项回到默认值，页面展示错误与重试入口。
        state.themeMode = state.savedThemeMode;
        state.status = 'load-error';
        state.error = action.error.message || '用户设置读取失败';
      })
      // 后台同步开始：只登记请求编号，保持当前 UI 与读写状态。
      .addCase(refreshUserSettings.pending, (state, action) => {
        state.refreshRequestId = action.meta.requestId;
      })
      // 后台同步成功：编号仍有效才应用服务端配置，已被本地保存作废的响应直接忽略。
      .addCase(refreshUserSettings.fulfilled, (state, action) => {
        if (state.refreshRequestId !== action.meta.requestId) return;
        state.refreshRequestId = null;
        applySavedSettings(state, action);
      })
      // 后台同步失败：只释放对应请求标识，保留当前配置，等待后续通知再次触发。
      .addCase(refreshUserSettings.rejected, (state, action) => {
        if (state.refreshRequestId === action.meta.requestId) state.refreshRequestId = null;
        // 同步失败保留当前配置，下一次通知或回到页签时重试。
      })
      // 保存入队：合并待保存修改并乐观更新 UI，同时使旧后台同步响应失效。
      .addCase(saveUserSettings.pending, (state, action) => {
        // 乐观更新：先改变当前 UI，saved* 暂不变；保存中仍允许用户继续修改并排队。
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
        if (action.meta.arg.loadingStyle) state.loadingStyle = action.meta.arg.loadingStyle;
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
      // 保存成功：推进确认基线与同步通知计数；只有最新请求才能结束保存并对齐 UI。
      .addCase(saveUserSettings.fulfilled, (state, action) => {
        if (!state.saveRequestId) return;
        state.saveRevision++;
        updateSavedSettings(state, action.payload);
        // 较早请求只确认回退基线，不覆盖较新操作的 UI；最后一次请求成功才整体对齐响应。
        if (state.saveRequestId !== action.meta.requestId) return;
        applySavedSettings(state, action, true);
        state.saveRequestId = null;
        state.saveChanges = null;
      })
      // 保存失败：仅最新请求触发回退，并保留连续操作的合并目标供显式重试。
      .addCase(saveUserSettings.rejected, (state, action) => {
        // 只处理当前最新请求的失败；回退到最近一次成功值，同时保留修改项供用户显式重试。
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
        state.loadingStyle = state.savedLoadingStyle;
        state.status = 'save-error';
        state.error = action.error.message || '用户设置保存失败';
        state.failedSettings = state.saveChanges ?? action.meta.arg;
        state.failedLayoutMode = state.failedSettings.layoutMode ?? null;
        state.saveChanges = null;
      });
  },
});

/** 对外提供状态重置、抽屉开关与滑块预览动作；配置初始化统一经过可取消的读取请求。 */
export const {
  resetPreferences,
  openUserSettings,
  closeUserSettings,
  previewLayoutGap,
  previewBorderRadius,
  previewControlBorderRadius,
} = preferencesSlice.actions;

/** 偏好状态的根 reducer，由应用 Store 注册到 preferences 节点。 */
export default preferencesSlice.reducer;

/** 仅修改布局模式的快捷保存入口，复用统一的串行保存、乐观更新与失败回退流程。 */
export const saveLayoutMode = (layoutMode: LayoutMode) => saveUserSettings({ layoutMode });

/** 主题修改复用设置串行保存、乐观更新及失败回退，不在 UI 事件中直接写启动缓存。 */
export const saveThemeMode = (themeMode: ThemeMode) => saveUserSettings({ themeMode });
