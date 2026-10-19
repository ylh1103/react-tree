/** 验证默认 thunk 中间件的跨 thunk 编排，以及共用设置 API 时的 Store 状态、请求与队列隔离。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createAppStore } from '../src/store/index.ts';
import { createAppAsyncThunk } from '../src/store/createAppAsyncThunk.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';
import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
import {
  cancelPreferencesRequests,
  loadUserSettings,
  resetPreferences,
  saveUserSettings,
} from '../src/store/slices/preferencesSlice.ts';

test('共享 thunk 可派发设置 thunk，启动主题被实际读取的配置替换', async (t) => {
  let persisted = { ...defaultUserSettings, themeMode: 'light' };
  mockUserSettingsApi(t, {
    load: async () => persisted,
    save: async (settings) => (persisted = settings),
  });
  const store = createAppStore({ themeMode: 'dark' });
  assert.equal(store.getState().preferences.themeMode, 'dark');
  assert.equal(store.getState().preferences.initialized, false);

  const applySettings = createAppAsyncThunk(
    'store-test/apply-settings',
    async (changes, { dispatch, getState }) => {
      await dispatch(loadUserSettings()).unwrap();
      const loadedTheme = getState().preferences.themeMode;
      await dispatch(saveUserSettings(changes)).unwrap();
      return loadedTheme;
    },
  );

  const loadedTheme = await store.dispatch(applySettings({ layoutMode: 'compact' })).unwrap();
  assert.equal(loadedTheme, 'light');
  assert.deepEqual(persisted, {
    ...defaultUserSettings,
    themeMode: 'light',
    layoutMode: 'compact',
  });
  assert.equal(store.getState().preferences.layoutMode, 'compact');
  assert.equal(store.getState().preferences.themeMode, 'light');
  assert.equal(store.getState().preferences.status, 'ready');
});

test('共用设置 API 时取消一个 Store 的在途与排队保存，不阻塞或取消另一个 Store', async (t) => {
  let release;
  let firstSignal;
  let writes = 0;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  mockUserSettingsApi(t, {
    load: async () => ({ ...defaultUserSettings }),
    save: async (settings, signal) => {
      writes++;
      assert.equal(signal.aborted, false);
      if (writes === 1) {
        firstSignal = signal;
        await pending;
      }
      return settings;
    },
  });
  const first = createAppStore();
  const second = createAppStore();
  await Promise.all([
    first.dispatch(loadUserSettings()).unwrap(),
    second.dispatch(loadUserSettings()).unwrap(),
  ]);
  const saving = first.dispatch(saveUserSettings({ themeMode: 'dark' }));
  const queued = first.dispatch(saveUserSettings({ layoutMode: 'compact' }));
  try {
    // 第一个请求仍被挂起，第二份 Store 应能通过同一个 API 独立完成保存。
    await second.dispatch(saveUserSettings({ themeMode: 'light' })).unwrap();
    cancelPreferencesRequests(first.getState);
    first.dispatch(resetPreferences());
    assert.equal(firstSignal.aborted, true);
  } finally {
    release();
    await Promise.all([saving, queued]);
  }
  assert.equal(writes, 2);
  assert.equal(first.getState().preferences.themeMode, defaultUserSettings.themeMode);
  assert.equal(first.getState().preferences.initialized, false);
  assert.equal(second.getState().preferences.themeMode, 'light');
  assert.equal(second.getState().preferences.status, 'ready');
});
