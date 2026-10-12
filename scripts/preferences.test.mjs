import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createAppStore } from '../src/store/index.ts';
import {
  loadUserSettings,
  saveLayoutMode,
  saveThemeMode,
  saveUserSettings,
  openUserSettings,
  closeUserSettings,
} from '../src/store/preferencesSlice.ts';
import { createUserSettingsApi } from '../src/features/preferences/api.ts';
import { parseUserSettings, defaultUserSettings } from '../src/features/preferences/types.ts';
import { createMockUserSettingsMiddleware } from './mockUserSettings.ts';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('配置请求超时结束首屏等待，回退默认配置并允许重试', async (t) => {
  const server = createServer(() => {});
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const api = createUserSettingsApi(`http://127.0.0.1:${server.address().port}/settings`, 100);
  const store = createAppStore(api);
  await store.dispatch(loadUserSettings());
  const state = store.getState().preferences;
  assert.equal(state.initialized, true);
  assert.equal(state.status, 'load-error');
  assert.equal(state.layoutMode, 'default');
  assert.match(state.error, /请求超时/);
});

test('启动读取后端配置，并发读取只发送一次，读取前不允许写入', async () => {
  const request = deferred();
  let loads = 0;
  let saves = 0;
  const store = createAppStore({
    load: () => {
      loads++;
      return request.promise;
    },
    save: async () => {
      saves++;
      return { layoutMode: 'default' };
    },
  });
  const first = store.dispatch(loadUserSettings());
  await store.dispatch(loadUserSettings());
  await store.dispatch(saveLayoutMode('compact'));
  assert.equal(loads, 1);
  assert.equal(saves, 0);
  request.resolve({ layoutMode: 'compact' });
  await first;
  assert.equal(store.getState().preferences.layoutMode, 'compact');
  assert.equal(store.getState().preferences.status, 'ready');
});

test('修改立即生效，保存期间禁止重叠写入，服务端确认后更新基线', async () => {
  const request = deferred();
  let saves = 0;
  const store = createAppStore({
    load: async () => ({ layoutMode: 'default' }),
    save: () => {
      saves++;
      return request.promise;
    },
  });
  await store.dispatch(loadUserSettings());
  const saving = store.dispatch(saveLayoutMode('compact'));
  assert.equal(store.getState().preferences.layoutMode, 'compact');
  assert.equal(store.getState().preferences.savedLayoutMode, 'default');
  assert.equal(store.getState().preferences.status, 'saving');
  await store.dispatch(saveLayoutMode('default'));
  assert.equal(saves, 1);
  request.resolve({ layoutMode: 'compact' });
  await saving;
  assert.equal(store.getState().preferences.savedLayoutMode, 'compact');
  assert.equal(store.getState().preferences.status, 'ready');
});

test('保存失败恢复已保存布局，保留失败目标以便重试', async () => {
  let failing = true;
  const store = createAppStore({
    load: async () => ({ layoutMode: 'default' }),
    save: async (settings) => {
      if (failing) throw Error('模拟保存失败');
      return settings;
    },
  });
  await store.dispatch(loadUserSettings());
  await store.dispatch(saveLayoutMode('compact'));
  assert.equal(store.getState().preferences.layoutMode, 'default');
  assert.equal(store.getState().preferences.status, 'save-error');
  assert.equal(store.getState().preferences.failedLayoutMode, 'compact');
  assert.equal(store.getState().preferences.error, '模拟保存失败');
  failing = false;
  await store.dispatch(saveLayoutMode(store.getState().preferences.failedLayoutMode));
  assert.equal(store.getState().preferences.layoutMode, 'compact');
  assert.equal(store.getState().preferences.error, null);
});

test('读取失败允许重试；抽屉开关不会被后端响应覆盖', async () => {
  let failing = true;
  const store = createAppStore({
    load: async () => {
      if (failing) throw Error('模拟读取失败');
      return { layoutMode: 'compact' };
    },
    save: async (settings) => settings,
  });
  store.dispatch(openUserSettings());
  await store.dispatch(loadUserSettings());
  assert.equal(store.getState().preferences.status, 'load-error');
  failing = false;
  await store.dispatch(loadUserSettings());
  assert.equal(store.getState().preferences.settingsOpen, true);
  store.dispatch(closeUserSettings());
  assert.equal(store.getState().preferences.settingsOpen, false);
});

test('异常后端布局响应不会进入 Redux', async () => {
  assert.throws(() => parseUserSettings({ layoutMode: 'invalid' }), /格式错误/);
  assert.throws(() => parseUserSettings({ error: '业务失败' }), /格式错误/);
  const store = createAppStore({
    load: async () => parseUserSettings({ layoutMode: 'invalid' }),
    save: async (settings) => settings,
  });
  await store.dispatch(loadUserSettings());
  assert.equal(store.getState().preferences.status, 'load-error');
  assert.equal(store.getState().preferences.layoutMode, 'default');
});

test('mock HTTP 接口读写、重新读取保留配置、错误响应不改动已保存值', async (t) => {
  const middleware = createMockUserSettingsMiddleware(0);
  const server = createServer((req, res) => {
    void middleware(req, res, () => {
      res.statusCode = 404;
      res.end();
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const url = 'http://127.0.0.1:' + server.address().port + '/mock-api/user-settings';
  const api = createUserSettingsApi(url);
  assert.deepEqual(await api.load(), {
    ...defaultUserSettings,
    layoutMode: 'default',
    themeMode: 'light',
  });
  await api.save({ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' });
  const reloaded = createAppStore(createUserSettingsApi(url));
  await reloaded.dispatch(loadUserSettings());
  assert.equal(reloaded.getState().preferences.layoutMode, 'compact');
  assert.equal(reloaded.getState().preferences.themeMode, 'dark');
  assert.equal(reloaded.getState().preferences.settingsOpen, false);
  await api.save({ ...defaultUserSettings, themeMode: 'system' });
  const systemReloaded = createAppStore(createUserSettingsApi(url));
  await systemReloaded.dispatch(loadUserSettings());
  assert.equal(systemReloaded.getState().preferences.themeMode, 'system');
  await api.save({ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' });
  assert.equal(
    (await fetch(url, { method: 'PUT', body: JSON.stringify({ layoutMode: 'invalid' }) })).status,
    400,
  );
  assert.equal(
    (
      await fetch(url, {
        method: 'PUT',
        body: JSON.stringify({ layoutMode: 'default', themeMode: 'invalid' }),
      })
    ).status,
    400,
  );
  assert.equal((await fetch(url, { method: 'PUT', body: '{' })).status, 400);
  assert.equal((await fetch(url, { headers: { 'X-Mock-Error': 'load' } })).status, 503);
  assert.equal(
    (
      await fetch(url, {
        method: 'PUT',
        headers: { 'X-Mock-Error': 'save' },
        body: JSON.stringify({ layoutMode: 'default' }),
      })
    ).status,
    503,
  );
  assert.deepEqual(await api.load(), {
    ...defaultUserSettings,
    layoutMode: 'compact',
    themeMode: 'dark',
  });
  assert.equal((await fetch(url, { method: 'POST' })).status, 405);
});

test('主题兼容旧配置，拒绝异常主题值', () => {
  assert.deepEqual(parseUserSettings({ layoutMode: 'compact' }), {
    ...defaultUserSettings,
    layoutMode: 'compact',
    themeMode: 'light',
  });
  for (const themeMode of ['invalid', null, 1, undefined]) {
    assert.throws(() => parseUserSettings({ layoutMode: 'default', themeMode }), /格式错误/);
  }
});

test('切换主题立即生效，保存完整配置，布局切换保留主题', async () => {
  const request = deferred();
  const writes = [];
  const store = createAppStore({
    load: async () => ({ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'light' }),
    save: (settings) => {
      writes.push(settings);
      return request.promise;
    },
  });
  await store.dispatch(loadUserSettings());
  const saving = store.dispatch(saveThemeMode('dark'));
  assert.equal(store.getState().preferences.themeMode, 'dark');
  assert.equal(store.getState().preferences.savedThemeMode, 'light');
  assert.deepEqual(writes, [{ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' }]);
  await store.dispatch(saveLayoutMode('default'));
  assert.equal(writes.length, 1);
  request.resolve({ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' });
  await saving;
  assert.equal(store.getState().preferences.savedThemeMode, 'dark');

  const persisted = [];
  const nextStore = createAppStore({
    load: async () => ({ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' }),
    save: async (settings) => {
      persisted.push(settings);
      return settings;
    },
  });
  await nextStore.dispatch(loadUserSettings());
  await nextStore.dispatch(saveLayoutMode('default'));
  assert.deepEqual(persisted, [
    { ...defaultUserSettings, layoutMode: 'default', themeMode: 'dark' },
  ]);
  assert.equal(nextStore.getState().preferences.themeMode, 'dark');
});

test('主题保存失败回退，重试保持布局，异常保存响应也回退', async () => {
  let failing = true;
  const store = createAppStore({
    load: async () => ({ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'light' }),
    save: async (settings) => {
      if (failing) throw Error('模拟主题保存失败');
      return settings;
    },
  });
  await store.dispatch(loadUserSettings());
  await store.dispatch(saveThemeMode('dark'));
  assert.equal(store.getState().preferences.themeMode, 'light');
  assert.equal(store.getState().preferences.layoutMode, 'compact');
  assert.deepEqual(store.getState().preferences.failedSettings, { themeMode: 'dark' });
  failing = false;
  await store.dispatch(saveUserSettings(store.getState().preferences.failedSettings));
  assert.equal(store.getState().preferences.themeMode, 'dark');
  assert.equal(store.getState().preferences.savedThemeMode, 'dark');
  assert.equal(store.getState().preferences.error, null);

  const invalidStore = createAppStore({
    load: async () => ({ ...defaultUserSettings, layoutMode: 'default', themeMode: 'dark' }),
    save: async () => ({ layoutMode: 'default', themeMode: 'invalid' }),
  });
  await invalidStore.dispatch(loadUserSettings());
  await invalidStore.dispatch(saveThemeMode('light'));
  assert.equal(invalidStore.getState().preferences.themeMode, 'dark');
  assert.equal(invalidStore.getState().preferences.status, 'save-error');
});

test('图标显示选项兼容旧配置，拒绝非布尔值', () => {
  assert.deepEqual(parseUserSettings({ layoutMode: 'default' }), defaultUserSettings);
  for (const key of ['navigationIconOnly', 'headerToolsIconOnly']) {
    for (const value of ['true', 1, null, undefined]) {
      assert.throws(() => parseUserSettings({ ...defaultUserSettings, [key]: value }), /格式错误/);
    }
  }
});

test('图标显示独立保存、失败回退和重试，关闭开关与重置能持久化', async () => {
  let persisted = { ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' };
  let failing = false;
  const request = deferred();
  let delayed = true;
  const api = {
    load: async () => persisted,
    save: async (settings) => {
      if (delayed) await request.promise;
      if (failing) throw Error('模拟图标设置保存失败');
      persisted = settings;
      return settings;
    },
  };
  const store = createAppStore(api);
  await store.dispatch(loadUserSettings());
  const saving = store.dispatch(saveUserSettings({ navigationIconOnly: true }));
  assert.equal(store.getState().preferences.navigationIconOnly, true);
  assert.equal(store.getState().preferences.headerToolsIconOnly, false);
  request.resolve();
  await saving;
  delayed = false;
  failing = true;
  await store.dispatch(saveUserSettings({ headerToolsIconOnly: true }));
  assert.equal(store.getState().preferences.headerToolsIconOnly, false);
  assert.equal(store.getState().preferences.navigationIconOnly, true);
  assert.deepEqual(store.getState().preferences.failedSettings, { headerToolsIconOnly: true });
  failing = false;
  await store.dispatch(saveUserSettings(store.getState().preferences.failedSettings));
  assert.deepEqual(persisted, {
    layoutMode: 'compact',
    themeMode: 'dark',
    navigationIconOnly: true,
    headerToolsIconOnly: true,
  });
  await store.dispatch(saveUserSettings({ navigationIconOnly: false }));
  assert.equal(persisted.navigationIconOnly, false);
  assert.equal(persisted.headerToolsIconOnly, true);
  const reloaded = createAppStore(api);
  await reloaded.dispatch(loadUserSettings());
  assert.equal(reloaded.getState().preferences.headerToolsIconOnly, true);
  await store.dispatch(saveUserSettings(defaultUserSettings));
  assert.deepEqual(persisted, defaultUserSettings);
});

test('跟随系统保留用户选择，修改布局不覆盖主题，保存失败恢复系统模式', async () => {
  let persisted = { ...defaultUserSettings };
  let fail = false;
  const api = {
    load: async () => persisted,
    save: async (settings) => {
      if (fail) throw new Error('保存失败');
      persisted = settings;
      return settings;
    },
  };
  const store = createAppStore(api);
  await store.dispatch(loadUserSettings());
  await store.dispatch(saveThemeMode('system'));
  assert.equal(store.getState().preferences.themeMode, 'system');
  assert.equal(store.getState().preferences.savedThemeMode, 'system');
  await store.dispatch(saveLayoutMode('compact'));
  assert.equal(persisted.themeMode, 'system');
  const reloaded = createAppStore(api);
  await reloaded.dispatch(loadUserSettings());
  assert.equal(reloaded.getState().preferences.themeMode, 'system');
  fail = true;
  await store.dispatch(saveThemeMode('dark'));
  assert.equal(store.getState().preferences.themeMode, 'system');
  assert.equal(store.getState().preferences.status, 'save-error');
});
