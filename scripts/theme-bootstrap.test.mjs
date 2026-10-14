import assert from 'node:assert/strict';
import test from 'node:test';
import { createAppStore } from '../src/store/index.ts';
import {
  loadUserSettings,
  refreshUserSettings,
  saveThemeMode,
  saveUserSettings,
} from '../src/store/slices/preferencesSlice.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';
import {
  readBootstrapTheme,
  startThemePersistence,
} from '../src/store/preferences/themeBootstrap.ts';

function mockStorage(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete globalThis.window;
  });
  return values;
}

test('首屏主题缓存仅接受有效模式，存储不可用安全回退', (t) => {
  const values = mockStorage(t);
  assert.equal(readBootstrapTheme(), 'system');
  for (const mode of ['light', 'dark', 'system']) {
    values.set('react-tree:theme-mode:v2:anonymous', mode);
    assert.equal(readBootstrapTheme(), mode);
  }
  values.set('react-tree:theme-mode:v2:anonymous', 'invalid');
  assert.equal(readBootstrapTheme(), 'system');
  Object.defineProperty(globalThis.window, 'localStorage', {
    get() {
      throw new Error('blocked');
    },
  });
  assert.equal(readBootstrapTheme(), 'system');
});

test('刷新等待服务端时保留暗色缓存，读取成功后使用服务端主题', async (t) => {
  mockStorage(t);
  let resolve;
  const loading = new Promise((yes) => {
    resolve = yes;
  });
  const store = createAppStore({ load: () => loading, save: async (value) => value }, 'dark');
  t.after(startThemePersistence(store));
  const request = store.dispatch(loadUserSettings());
  assert.equal(store.getState().preferences.initialized, false);
  assert.equal(store.getState().preferences.themeMode, 'dark');
  resolve({ ...defaultUserSettings, themeMode: 'system' });
  await request;
  assert.equal(store.getState().preferences.themeMode, 'system');
  assert.equal(readBootstrapTheme(), 'system');
});

test('只缓存成功保存及同步的主题，乐观切换和失败保存不污染刷新主题', async (t) => {
  mockStorage(t);
  let persisted = { ...defaultUserSettings, themeMode: 'dark' };
  let reject;
  let save = () =>
    new Promise((_, no) => {
      reject = no;
    });
  const store = createAppStore(
    { load: async () => persisted, save: (value) => save(value) },
    'dark',
  );
  t.after(startThemePersistence(store));
  await store.dispatch(loadUserSettings());
  assert.equal(readBootstrapTheme(), 'dark');
  const request = store.dispatch(saveThemeMode('light'));
  assert.equal(store.getState().preferences.themeMode, 'light');
  assert.equal(readBootstrapTheme(), 'dark');
  reject(new Error('保存失败'));
  await request;
  assert.equal(readBootstrapTheme(), 'dark');
  save = async (value) => value;
  await store.dispatch(saveThemeMode('system'));
  assert.equal(readBootstrapTheme(), 'system');
  persisted = { ...defaultUserSettings };
  await store.dispatch(refreshUserSettings());
  assert.equal(readBootstrapTheme(), 'system');
});

test('服务端读取失败保留启动暗色，避免再次闪为浅色', async (t) => {
  mockStorage(t);
  const store = createAppStore(
    {
      load: async () => {
        throw new Error('读取失败');
      },
      save: async (value) => value,
    },
    'dark',
  );
  t.after(startThemePersistence(store));
  await store.dispatch(loadUserSettings());
  assert.equal(store.getState().preferences.themeMode, 'dark');
  assert.equal(store.getState().preferences.status, 'load-error');
});

test('连续保存后续失败时，首屏主题缓存仍保留较早已确认的主题', async (t) => {
  mockStorage(t);
  let release;
  const first = new Promise((resolve) => {
    release = resolve;
  });
  let calls = 0;
  const store = createAppStore({
    load: async () => ({ ...defaultUserSettings }),
    save: async (settings) => {
      if (++calls === 1) await first;
      else throw Error('后续保存失败');
      return settings;
    },
  });
  t.after(startThemePersistence(store));
  await store.dispatch(loadUserSettings());
  const theme = store.dispatch(saveThemeMode('dark'));
  const radius = store.dispatch(saveUserSettings({ borderRadius: 24 }));
  release();
  await Promise.all([theme, radius]);
  assert.equal(store.getState().preferences.status, 'save-error');
  assert.equal(readBootstrapTheme(), 'dark');
});
