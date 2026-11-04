/** 验证配置副作用合并后的交互边界：字段级缓存、保存广播及统一清理不互相干扰。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createAppStore } from '../src/store/index.ts';
import { startUserSettingsEffects } from '../src/store/preferences/effects.ts';
import {
  bootstrapControlRadiusKey,
  bootstrapThemeKey as bootstrapThemeKeyResource,
} from '../src/store/preferences/themeBootstrap.ts';
import { bootstrapLoadingKey as bootstrapLoadingKeyResource } from '../src/store/preferences/loadingBootstrap.ts';
import {
  loadUserSettings,
  saveUserSettings,
  openUserSettings,
} from '../src/store/slices/preferencesSlice.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';
import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
import { mockPreferencesBrowser } from './helpers/preferencesBrowser.mjs';

const bootstrapThemeKey = `${bootstrapThemeKeyResource}:anonymous`;

const bootstrapLoadingKey = `${bootstrapLoadingKeyResource}:anonymous`;

test('一个订阅处理主题、图标、圆角缓存和保存广播，字段不变时不重写，停止后均不再触发', async (t) => {
  mockPreferencesBrowser(t);
  const writes = t.mock.method(globalThis.window.localStorage, 'setItem');
  const publish = t.mock.fn();
  const close = t.mock.fn();
  const unsubscribe = t.mock.fn();
  mockUserSettingsApi(t, {
    load: async () => defaultUserSettings,
    save: async (settings) => settings,
  });
  const store = createAppStore();
  const subscribe = t.mock.method(store, 'subscribe');
  const stop = startUserSettingsEffects(store, { publish, subscribe: () => unsubscribe, close });
  t.after(stop);
  assert.equal(subscribe.mock.callCount(), 1);
  await store.dispatch(loadUserSettings()).unwrap();
  assert.deepEqual(
    writes.mock.calls.map(({ arguments: args }) => args),
    [
      [bootstrapThemeKey, defaultUserSettings.themeMode],
      [bootstrapLoadingKey, defaultUserSettings.loadingStyle],
      [`${bootstrapControlRadiusKey}:anonymous`, String(defaultUserSettings.controlBorderRadius)],
    ],
  );
  assert.equal(publish.mock.callCount(), 0);
  store.dispatch(openUserSettings());
  assert.equal(writes.mock.callCount(), 3);
  await store.dispatch(saveUserSettings({ themeMode: 'dark' })).unwrap();
  assert.equal(writes.mock.callCount(), 4);
  assert.deepEqual(writes.mock.calls[3].arguments, [bootstrapThemeKey, 'dark']);
  await store.dispatch(saveUserSettings({ loadingStyle: 'data-wave' })).unwrap();
  assert.equal(writes.mock.callCount(), 5);
  assert.deepEqual(writes.mock.calls[4].arguments, [bootstrapLoadingKey, 'data-wave']);
  await store.dispatch(saveUserSettings({ controlBorderRadius: 12 })).unwrap();
  assert.equal(writes.mock.callCount(), 6);
  assert.deepEqual(writes.mock.calls[5].arguments, [
    `${bootstrapControlRadiusKey}:anonymous`,
    '12',
  ]);
  assert.equal(publish.mock.callCount(), 3);
  stop();
  stop();
  assert.equal(unsubscribe.mock.callCount(), 1);
  assert.equal(close.mock.callCount(), 1);
  await store.dispatch(saveUserSettings(defaultUserSettings)).unwrap();
  assert.equal(writes.mock.callCount(), 6);
  assert.equal(publish.mock.callCount(), 3);
});

test('主题缓存写入失败不阻塞图标和广播，恢复后只补写失败字段', async (t) => {
  const values = mockPreferencesBrowser(t);
  let blocked = true;
  const writes = t.mock.method(globalThis.window.localStorage, 'setItem', (key, value) => {
    if (key === bootstrapThemeKey && blocked) throw Error('主题缓存不可写');
    values.set(key, value);
  });
  const publish = t.mock.fn();
  mockUserSettingsApi(t, {
    load: async () => defaultUserSettings,
    save: async (settings) => settings,
  });
  const store = createAppStore();
  t.after(startUserSettingsEffects(store, { publish, subscribe: () => () => {}, close() {} }));
  await store.dispatch(loadUserSettings()).unwrap();
  await store.dispatch(saveUserSettings({ themeMode: 'dark', loadingStyle: 'data-wave' })).unwrap();
  assert.equal(values.has(bootstrapThemeKey), false);
  assert.equal(values.get(bootstrapLoadingKey), 'data-wave');
  assert.equal(publish.mock.callCount(), 1);
  const attempts = writes.mock.callCount();
  blocked = false;
  store.dispatch(openUserSettings());
  assert.equal(values.get(bootstrapThemeKey), 'dark');
  assert.equal(writes.mock.callCount(), attempts + 1);
  assert.deepEqual(writes.mock.calls.at(-1).arguments, [bootstrapThemeKey, 'dark']);
  store.dispatch(openUserSettings());
  assert.equal(writes.mock.callCount(), attempts + 1);
  assert.equal(publish.mock.callCount(), 1);
});

test('统一清理取消启动配置读取，迟到响应不能更新配置或缓存', async (t) => {
  const values = mockPreferencesBrowser(t);
  let resolve;
  let signal;
  mockUserSettingsApi(t, {
    load: (requestSignal) => {
      signal = requestSignal;
      return new Promise((yes) => {
        resolve = yes;
      });
    },
    save: async (settings) => settings,
  });
  const store = createAppStore();
  const stop = startUserSettingsEffects(store, null);
  t.after(stop);
  const loading = store.dispatch(loadUserSettings());
  stop();
  assert.equal(signal.aborted, true);
  resolve({ ...defaultUserSettings, themeMode: 'dark', loadingStyle: 'data-wave' });
  const action = await loading;
  assert.equal(loadUserSettings.rejected.match(action), true);
  assert.equal(store.getState().preferences.savedThemeMode, defaultUserSettings.themeMode);
  assert.equal(store.getState().preferences.savedLoadingStyle, defaultUserSettings.loadingStyle);
  assert.equal(values.size, 0);
});
