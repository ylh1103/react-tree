/** 持久化边界回归：不同账号、匿名、延迟请求和跨页签会话切换。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { mockPreferencesBrowser } from './helpers/preferencesBrowser.mjs';
import { userStorageKey, currentUserStorageKey } from '../src/utils/userStorage.ts';
import { loginStorageKey, writeLoginUser } from '../src/utils/loginStorage.ts';
import { startLoginSessionSync } from '../src/utils/loginSessionSync.ts';
import { readMockSettings, saveMockSettings } from '../src/mocks/preferences.ts';
import {
  readBootstrapTheme,
  bootstrapThemeKey,
  claimAnonymousThemeSelection,
  rememberAnonymousTheme,
} from '../src/store/preferences/themeBootstrap.ts';
import { readSplitPaneLayout } from '../src/components/SplitPane/model/layout.ts';
import { createUserSettingsSyncTransport } from '../src/store/preferences/sync.ts';
import {
  startUserSettingsEffects,
  startUserSettingsSession,
} from '../src/store/preferences/effects.ts';
import { createAppStore } from '../src/store/index.ts';
import { createDemoLoginUser } from '../src/mocks/login.ts';
import {
  changeLandingTheme,
  loadUserSettings,
  saveUserSettings,
} from '../src/store/slices/preferencesSlice.ts';
import { setUserInfo } from '../src/store/slices/userSlice.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';
import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
import { executeMockRequest } from '../src/mocks/adapterImplementation.ts';
import { mockConfig } from '../src/mocks/config.ts';
import { AxiosHeaders } from 'axios';

function browser(t) {
  const values = mockPreferencesBrowser(t);
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: globalThis.window.localStorage,
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });
  const login = (ystId, userType = '1') =>
    values.set(
      loginStorageKey,
      JSON.stringify({
        version: 1,
        loggedIn: true,
        user: { ystId, userType, openId: 'same-open-id' },
      }),
    );
  return { values, login };
}

test('个人文档、启动主题、分栏按稳定用户隔离，不读取旧公共数据', (t) => {
  const { values, login } = browser(t);
  values.set(bootstrapThemeKey, 'dark');
  values.set('pane', JSON.stringify({ width: 600, visible: false }));
  assert.equal(readBootstrapTheme(), 'system');
  assert.deepEqual(readSplitPaneLayout('pane', 290), { width: 290, visible: true });
  login('A:/中文');
  const keyA = currentUserStorageKey(bootstrapThemeKey);
  assert.match(keyA, /A%3A%2F/);
  values.set(keyA, 'dark');
  values.set(currentUserStorageKey('pane'), JSON.stringify({ width: 420, visible: false }));
  saveMockSettings('A:/中文', '{"themeMode":"dark","future":42}');
  login('B');
  assert.equal(readBootstrapTheme(), 'system');
  assert.deepEqual(readSplitPaneLayout('pane', 290), { width: 290, visible: true });
  assert.equal(JSON.parse(readMockSettings('B')).future, undefined);
  saveMockSettings('B', '{"themeMode":"light"}');
  login('A:/中文', '0');
  assert.equal(currentUserStorageKey(bootstrapThemeKey), keyA);
  assert.equal(readBootstrapTheme(), 'dark');
  assert.equal(JSON.parse(readMockSettings('A:/中文')).future, 42);
  assert.deepEqual(readSplitPaneLayout('pane', 290), { width: 420, visible: false });
  values.delete(loginStorageKey);
  assert.equal(readBootstrapTheme(), 'system');
  assert.equal(userStorageKey('x', { getItem: () => '{broken' }), 'x:anonymous');
});

test('延迟 Mock 保存固定在发起请求的账号，内存回退也不串用户', async (t) => {
  const { login } = browser(t);
  const delay = mockConfig.delayMs;
  t.after(() => {
    mockConfig.delayMs = delay;
  });
  mockConfig.delayMs = 10;
  login('request-A');
  const request = executeMockRequest({
    url: '/api/user-settings',
    method: 'PUT',
    params: { ystId: 'request-A' },
    headers: new AxiosHeaders(),
    data: { userSetting: '{"themeMode":"dark"}' },
  });
  login('request-B');
  await request;
  assert.equal(JSON.parse(readMockSettings('request-B')).themeMode, undefined);
  assert.equal(JSON.parse(readMockSettings('request-A')).themeMode, 'dark');
  t.mock.method(localStorage, 'setItem', () => {
    throw Error('blocked');
  });
  saveMockSettings('request-A', '{"themeMode":"light"}');
  // 只禁用写入时存量持久化仍优先；完整不可用时使用同用户内存副本。
  t.mock.method(localStorage, 'getItem', (key) => {
    if (key === loginStorageKey)
      return JSON.stringify({ version: 1, loggedIn: true, user: { ystId: 'request-A' } });
    throw Error('blocked');
  });
  assert.equal(JSON.parse(readMockSettings('request-A')).themeMode, 'light');
});

test('设置通知通道按用户创建，旧用户成功响应不写新用户启动缓存', async (t) => {
  const { values, login } = browser(t);
  const names = [];
  globalThis.window.BroadcastChannel = class {
    constructor(name) {
      names.push(name);
    }
    close() {}
  };
  login('effects-A');
  const a = createUserSettingsSyncTransport();
  login('effects-B');
  const b = createUserSettingsSyncTransport();
  assert.notEqual(names[0], names[1]);
  a.close();
  b.close();
  let resolve;
  mockUserSettingsApi(t, {
    load: async () => defaultUserSettings,
    save: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  const store = createAppStore({ userInfo: { ...createDemoLoginUser('1'), ystId: 'effects-B' } });
  t.after(startUserSettingsEffects(store, null));
  await store.dispatch(loadUserSettings());
  const request = store.dispatch(saveUserSettings({ themeMode: 'dark' }));
  login('effects-C');
  resolve({ ...defaultUserSettings, themeMode: 'dark' });
  await request;
  assert.equal(values.has(currentUserStorageKey(bootstrapThemeKey)), false);
});

test('会话有一事通 ID 后才读取，账号切换取消旧保存且不发送旧队列', async (t) => {
  const { login } = browser(t);
  const reads = [];
  const writes = [];
  let finishSave;
  mockUserSettingsApi(t, {
    load: async (ystId) => {
      reads.push(ystId);
      return { ...defaultUserSettings, themeMode: ystId === 'session-B' ? 'light' : 'system' };
    },
    save: (ystId, settings, signal) => {
      writes.push({ ystId, signal });
      return new Promise((resolve) => {
        finishSave = () => resolve(settings);
      });
    },
  });

  const store = createAppStore();
  t.after(startUserSettingsSession(store));
  assert.deepEqual(reads, []);
  assert.equal((await store.dispatch(loadUserSettings())).meta.condition, true);

  const user = createDemoLoginUser('1');
  store.dispatch(setUserInfo({ ...user, ystId: ' ' }));
  await new Promise(setImmediate);
  assert.match(store.getState().preferences.error, /缺少一事通 ID/);
  assert.deepEqual(reads, []);
  assert.equal(
    (await store.dispatch(saveUserSettings({ themeMode: 'dark' }))).meta.condition,
    true,
  );

  login('session-A');
  store.dispatch(setUserInfo({ ...user, ystId: 'session-A' }));
  await new Promise(setImmediate);
  store.dispatch(setUserInfo({ ...user, ystId: 'session-A', userType: '0' }));
  assert.deepEqual(reads, ['session-A']);
  const saving = store.dispatch(saveUserSettings({ themeMode: 'dark' }));
  const queued = store.dispatch(saveUserSettings({ layoutMode: 'compact' }));
  assert.equal(writes[0].ystId, 'session-A');

  login('session-B');
  store.dispatch(setUserInfo({ ...user, ystId: 'session-B' }));
  assert.equal(writes[0].signal.aborted, true);
  finishSave();
  await Promise.all([saving, queued]);
  assert.deepEqual(reads, ['session-A', 'session-B']);
  assert.equal(writes.length, 1);
  assert.equal(store.getState().preferences.themeMode, 'light');
  assert.equal(store.getState().preferences.layoutMode, 'default');

  store.dispatch(setUserInfo(null));
  assert.equal(store.getState().preferences.initialized, false);
  assert.equal(store.getState().preferences.themeMode, defaultUserSettings.themeMode);
  assert.deepEqual(reads, ['session-A', 'session-B']);
});

test('落地页游客切换主题同步其他匿名页签，接收方不写缓存且登录后停止接收', async (t) => {
  const { values, login } = browser(t);
  const { window } = globalThis;
  const sender = createAppStore();
  const receiver = createAppStore();
  const stop = startUserSettingsSession(receiver);
  const load = t.mock.fn(async () => ({ ...defaultUserSettings, themeMode: 'light' }));
  const save = t.mock.fn();
  mockUserSettingsApi(t, { load, save });
  const writes = t.mock.method(window.localStorage, 'setItem');
  const themeKey = userStorageKey(bootstrapThemeKey);
  const notify = (key = themeKey, storageArea = window.localStorage) => {
    const event = new Event('storage');
    Object.assign(event, { key, storageArea, newValue: values.get(key) ?? null });
    window.dispatchEvent(event);
  };
  try {
    sender.dispatch(changeLandingTheme('dark'));
    const writesAfterSelection = writes.mock.callCount();
    notify(themeKey, {});
    notify(`${bootstrapThemeKey}:user:other`);
    assert.equal(receiver.getState().preferences.themeMode, 'system');
    notify();
    assert.equal(receiver.getState().preferences.themeMode, 'dark');
    assert.equal(writes.mock.callCount(), writesAfterSelection);
    assert.equal(load.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);

    const user = createDemoLoginUser('1');
    login(user.ystId);
    receiver.dispatch(setUserInfo(user));
    await new Promise(setImmediate);
    notify();
    assert.equal(receiver.getState().preferences.themeMode, 'light');
    assert.equal(load.mock.callCount(), 1);
  } finally {
    stop();
  }
  receiver.dispatch(setUserInfo(null));
  notify();
  assert.equal(receiver.getState().preferences.themeMode, 'light');
});

test('游客主题无需请求即可切换，登录接续时只保存给认领账号一次', async (t) => {
  let stopAccount;
  let stopOtherAccount;
  t.after(() => {
    stopAccount?.();
    stopOtherAccount?.();
  });
  const { values } = browser(t);
  const serverSettings = { ...defaultUserSettings, themeMode: 'light', layoutGap: 12 };
  const reads = [];
  const writes = [];
  let loadError = true;
  mockUserSettingsApi(t, {
    load: async (ystId) => {
      reads.push(ystId);
      if (loadError) throw new Error('读取失败');
      return serverSettings;
    },
    save: async (ystId, settings) => {
      writes.push({ ystId, settings });
      return settings;
    },
  });
  const guest = createAppStore();
  const stopGuest = startUserSettingsSession(guest);
  guest.dispatch(changeLandingTheme('light'));
  guest.dispatch(changeLandingTheme('dark'));
  assert.equal(guest.getState().preferences.themeMode, 'dark');
  assert.equal(readBootstrapTheme(), 'dark');
  assert.deepEqual(reads, []);
  assert.deepEqual(writes, []);
  stopGuest();

  const user = createDemoLoginUser('1');
  writeLoginUser(user);
  claimAnonymousThemeSelection();
  const account = createAppStore({ userInfo: user, themeMode: readBootstrapTheme() });
  stopAccount = startUserSettingsSession(account);
  await new Promise(setImmediate);
  assert.equal(account.getState().preferences.status, 'load-error');
  assert.equal(account.getState().preferences.themeMode, 'dark');
  assert.deepEqual(writes, []);
  loadError = false;
  await account.dispatch(loadUserSettings()).unwrap();
  await new Promise(setImmediate);
  assert.equal(account.getState().preferences.savedThemeMode, 'dark');
  assert.deepEqual(writes, [
    { ystId: user.ystId, settings: { ...serverSettings, themeMode: 'dark' } },
  ]);

  values.delete(loginStorageKey);
  rememberAnonymousTheme('dark');
  const otherUser = { ...user, ystId: 'next-user' };
  writeLoginUser(otherUser);
  claimAnonymousThemeSelection();
  const otherAccount = createAppStore({ userInfo: otherUser, themeMode: readBootstrapTheme() });
  stopOtherAccount = startUserSettingsSession(otherAccount);
  await new Promise(setImmediate);
  assert.equal(otherAccount.getState().preferences.themeMode, 'light');
  assert.equal(writes.length, 1);
});

test('其他页签切换/退出/清空会话时只重启一次，卸载后解除监听', (t) => {
  const { values, login } = browser(t);
  login('session-A');
  let changes = 0;
  const stop = startLoginSessionSync(() => changes++);
  globalThis.window.dispatchEvent(new Event('focus'));
  assert.equal(changes, 0);
  login('session-B');
  globalThis.window.dispatchEvent(new Event('focus'));
  globalThis.window.dispatchEvent(new Event('pageshow'));
  assert.equal(changes, 1);
  stop();
  for (const key of [loginStorageKey, null]) {
    const cleanup = startLoginSessionSync(() => changes++);
    values.clear();
    const event = new Event('storage');
    Object.assign(event, { key, storageArea: globalThis.window.localStorage });
    globalThis.window.dispatchEvent(event);
    assert.equal(changes, key === null ? 3 : 2);
    cleanup();
    login('session-B');
  }
  const cleanup = startLoginSessionSync(() => changes++);
  cleanup();
  values.clear();
  globalThis.window.dispatchEvent(new Event('focus'));
  assert.equal(changes, 3);
});

test('仅按一事通 ID 隔离，openId 变化不改变缓存键，也不作为缺失 ID 的回退', () => {
  const key = (user) =>
    userStorageKey('settings', {
      getItem: () => JSON.stringify({ version: 1, loggedIn: true, user }),
    });
  assert.equal(key({ ystId: '310798', openId: 'old' }), 'settings:user:310798');
  assert.equal(key({ ystId: '310798', openId: 'new' }), 'settings:user:310798');
  assert.notEqual(
    key({ ystId: '310798', openId: 'same' }),
    key({ ystId: '310799', openId: 'same' }),
  );
  assert.equal(key({ openId: '310798' }), 'settings:anonymous');
  assert.equal(key({ ystId: '', openId: '310798' }), 'settings:anonymous');
});
