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
  previewLayoutGap,
  previewBorderRadius,
  previewControlBorderRadius,
} from '../src/store/slices/preferencesSlice.ts';
import { createUserSettingsApi } from '../src/api/preferences.ts';
import { parseUserSettings, defaultUserSettings } from '../src/types/preferences.ts';
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
  assert.equal(state.navigationIconOnly, true);
  assert.equal(state.headerToolsIconOnly, true);
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

test('连续修改立即生效，请求串行发送，较早响应不覆盖最新选择和预览', async () => {
  const first = deferred();
  const second = deferred();
  const writes = [];
  const store = createAppStore({
    load: async () => ({ ...defaultUserSettings }),
    save: async (settings) => {
      writes.push(settings);
      await (writes.length === 1 ? first.promise : second.promise);
      return settings;
    },
  });
  await store.dispatch(loadUserSettings());
  const saving = store.dispatch(saveLayoutMode('compact'));
  const next = store.dispatch(saveLayoutMode('default'));
  assert.equal(store.getState().preferences.layoutMode, 'default');
  assert.equal(writes.length, 1);
  store.dispatch(previewBorderRadius(12));
  first.resolve();
  await saving;
  assert.equal(writes.length, 2);
  assert.equal(store.getState().preferences.savedLayoutMode, 'compact');
  assert.equal(store.getState().preferences.layoutMode, 'default');
  assert.equal(store.getState().preferences.previewBorderRadius, 12);
  assert.equal(store.getState().preferences.status, 'saving');
  second.resolve();
  await next;
  assert.equal(store.getState().preferences.savedLayoutMode, 'default');
  assert.equal(store.getState().preferences.previewBorderRadius, 12);
  assert.equal(store.getState().preferences.status, 'ready');
});

test('保存期间重置不会被忽略，最后的完整配置为默认值', async () => {
  const first = deferred();
  const writes = [];
  const store = createAppStore({
    load: async () => ({ ...defaultUserSettings }),
    save: async (settings) => {
      writes.push(settings);
      if (writes.length === 1) await first.promise;
      return settings;
    },
  });
  await store.dispatch(loadUserSettings());
  const theme = store.dispatch(saveThemeMode('dark'));
  const radius = store.dispatch(saveUserSettings({ borderRadius: 24 }));
  const reset = store.dispatch(saveUserSettings(defaultUserSettings));
  assert.equal(store.getState().preferences.themeMode, defaultUserSettings.themeMode);
  assert.equal(store.getState().preferences.borderRadius, defaultUserSettings.borderRadius);
  assert.equal(writes.length, 1);
  first.resolve();
  await theme;
  assert.equal(store.getState().preferences.themeMode, defaultUserSettings.themeMode);
  await Promise.all([radius, reset]);
  assert.equal(writes.length, 3);
  assert.deepEqual(writes[2], defaultUserSettings);
  assert.equal(store.getState().preferences.status, 'ready');
});

test('队列中旧请求失败不打断新修改，全部失败后合并目标可重试', async () => {
  const first = deferred();
  let failing = true;
  let calls = 0;
  const store = createAppStore({
    load: async () => ({ ...defaultUserSettings }),
    save: async (settings) => {
      if (++calls === 1) await first.promise;
      if (failing) throw Error('同步失败');
      return settings;
    },
  });
  await store.dispatch(loadUserSettings());
  const theme = store.dispatch(saveThemeMode('dark'));
  const radius = store.dispatch(saveUserSettings({ borderRadius: 12 }));
  first.resolve();
  await theme;
  assert.equal(store.getState().preferences.status, 'saving');
  assert.equal(store.getState().preferences.themeMode, 'dark');
  await radius;
  assert.equal(store.getState().preferences.status, 'save-error');
  assert.equal(store.getState().preferences.themeMode, defaultUserSettings.themeMode);
  assert.deepEqual(store.getState().preferences.failedSettings, {
    themeMode: 'dark',
    borderRadius: 12,
  });
  failing = false;
  await store.dispatch(saveUserSettings(store.getState().preferences.failedSettings));
  assert.equal(store.getState().preferences.themeMode, 'dark');
  assert.equal(store.getState().preferences.borderRadius, 12);
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
    themeMode: 'system',
  });
  await api.save({
    ...defaultUserSettings,
    layoutMode: 'compact',
    layoutGap: 12,
    themeMode: 'dark',
  });
  const reloaded = createAppStore(createUserSettingsApi(url));
  await reloaded.dispatch(loadUserSettings());
  assert.equal(reloaded.getState().preferences.layoutMode, 'compact');
  assert.equal(reloaded.getState().preferences.themeMode, 'dark');
  assert.equal(reloaded.getState().preferences.layoutGap, 12);
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
    themeMode: 'system',
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
    save: async (settings) => {
      writes.push(settings);
      await request.promise;
      return settings;
    },
  });
  await store.dispatch(loadUserSettings());
  const saving = store.dispatch(saveThemeMode('dark'));
  assert.equal(store.getState().preferences.themeMode, 'dark');
  assert.equal(store.getState().preferences.savedThemeMode, 'light');
  assert.deepEqual(writes, [{ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' }]);
  const layoutSave = store.dispatch(saveLayoutMode('default'));
  assert.equal(writes.length, 1);
  request.resolve({ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' });
  await Promise.all([saving, layoutSave]);
  assert.equal(writes.length, 2);
  assert.equal(store.getState().preferences.layoutMode, 'default');
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

test('导航配色兼容旧配置，接受两种模式并拒绝无效值', () => {
  assert.equal(parseUserSettings({ layoutMode: 'default' }).navigationTheme, 'contrast');
  for (const navigationTheme of ['contrast', 'theme']) {
    assert.equal(
      parseUserSettings({ ...defaultUserSettings, navigationTheme }).navigationTheme,
      navigationTheme,
    );
  }
  for (const navigationTheme of ['dark', 'light', true, null, undefined]) {
    assert.throws(() => parseUserSettings({ ...defaultUserSettings, navigationTheme }), /格式错误/);
  }
});

test('导航配色立即生效，保存失败回退、重试、重新读取和重置保持正确配置', async () => {
  let persisted = { ...defaultUserSettings };
  const request = deferred();
  let failing = true;
  const api = {
    load: async () => ({ ...persisted }),
    save: async (settings) => {
      await request.promise;
      if (failing) throw Error('配色保存失败');
      persisted = settings;
      return settings;
    },
  };
  const store = createAppStore(api);
  await store.dispatch(loadUserSettings());
  const saving = store.dispatch(saveUserSettings({ navigationTheme: 'theme' }));
  assert.equal(store.getState().preferences.navigationTheme, 'theme');
  assert.equal(store.getState().preferences.savedNavigationTheme, 'contrast');
  request.resolve();
  await saving;
  assert.equal(store.getState().preferences.navigationTheme, 'contrast');
  assert.deepEqual(store.getState().preferences.failedSettings, { navigationTheme: 'theme' });
  failing = false;
  await store.dispatch(saveUserSettings(store.getState().preferences.failedSettings));
  assert.equal(persisted.navigationTheme, 'theme');
  await store.dispatch(saveThemeMode('dark'));
  assert.equal(persisted.navigationTheme, 'theme');
  const reloaded = createAppStore(api);
  await reloaded.dispatch(loadUserSettings());
  assert.equal(reloaded.getState().preferences.navigationTheme, 'theme');
  await store.dispatch(saveUserSettings(defaultUserSettings));
  assert.equal(persisted.navigationTheme, 'contrast');
});

test('图标显示选项兼容旧配置，拒绝非布尔值', () => {
  assert.deepEqual(parseUserSettings({ layoutMode: 'default' }), defaultUserSettings);
  assert.equal(defaultUserSettings.navigationIconOnly, true);
  assert.equal(defaultUserSettings.headerToolsIconOnly, true);
  for (const key of ['navigationIconOnly', 'headerToolsIconOnly']) {
    assert.equal(parseUserSettings({ layoutMode: 'default', [key]: false })[key], false);
    for (const value of ['true', 1, null, undefined]) {
      assert.throws(() => parseUserSettings({ ...defaultUserSettings, [key]: value }), /格式错误/);
    }
  }
});

test('模块间距兼容旧配置，接受范围内整数并拒绝无效值', () => {
  assert.equal(parseUserSettings({ layoutMode: 'default' }).layoutGap, 4);
  for (const layoutGap of [2, 4, 8, 12, 13, 16]) {
    assert.equal(parseUserSettings({ ...defaultUserSettings, layoutGap }).layoutGap, layoutGap);
  }
  for (const layoutGap of [0, -1, 25, 4.5, '12', null, undefined, NaN, Infinity]) {
    assert.throws(() => parseUserSettings({ ...defaultUserSettings, layoutGap }), /格式错误/);
  }
});

test('圆角兼容旧配置，接受直角和范围内整数，拒绝异常值', () => {
  assert.equal(parseUserSettings({ layoutMode: 'default' }).borderRadius, 8);
  for (const borderRadius of [0, 6, 8, 12, 16, 24]) {
    assert.equal(
      parseUserSettings({ ...defaultUserSettings, borderRadius }).borderRadius,
      borderRadius,
    );
  }
  for (const borderRadius of [-1, 25, 6.5, '6', null, undefined, NaN, Infinity]) {
    assert.throws(() => parseUserSettings({ ...defaultUserSettings, borderRadius }), /格式错误/);
  }
});

test('旧圆角配置保留为面板圆角，控件基础圆角独立使用默认值并校验范围', () => {
  const settings = parseUserSettings({ layoutMode: 'default', borderRadius: 12 });
  assert.equal(settings.borderRadius, 12);
  assert.equal(settings.controlBorderRadius, 6);
  for (const controlBorderRadius of [0, 4, 6, 8, 16, 24]) {
    assert.equal(
      parseUserSettings({ ...settings, controlBorderRadius }).controlBorderRadius,
      controlBorderRadius,
    );
  }
  for (const controlBorderRadius of [-1, 25, 4.5, '4', null, undefined, NaN]) {
    assert.throws(() => parseUserSettings({ ...settings, controlBorderRadius }), /格式错误/);
  }
});

test('控件圆角独立预览和保存，失败回退及重置不覆盖面板配置', async () => {
  let persisted = { ...defaultUserSettings, borderRadius: 12 };
  let failing = false;
  let saves = 0;
  const api = {
    load: async () => ({ ...persisted }),
    save: async (settings) => {
      saves++;
      if (failing) throw Error('控件圆角保存失败');
      persisted = settings;
      return settings;
    },
  };
  const store = createAppStore(api);
  await store.dispatch(loadUserSettings());
  store.dispatch(previewControlBorderRadius(8));
  assert.equal(store.getState().preferences.previewControlBorderRadius, 8);
  assert.equal(store.getState().preferences.borderRadius, 12);
  assert.equal(saves, 0);
  store.dispatch(closeUserSettings());
  assert.equal(store.getState().preferences.previewControlBorderRadius, null);
  await store.dispatch(saveUserSettings({ controlBorderRadius: 0 }));
  assert.equal(persisted.controlBorderRadius, 0);
  assert.equal(persisted.borderRadius, 12);
  failing = true;
  store.dispatch(previewControlBorderRadius(8));
  await store.dispatch(saveUserSettings({ controlBorderRadius: 8 }));
  assert.equal(store.getState().preferences.controlBorderRadius, 0);
  assert.equal(store.getState().preferences.previewControlBorderRadius, null);
  failing = false;
  await store.dispatch(saveUserSettings(store.getState().preferences.failedSettings));
  await store.dispatch(saveUserSettings({ borderRadius: 16 }));
  const reloaded = createAppStore(api);
  await reloaded.dispatch(loadUserSettings());
  assert.equal(reloaded.getState().preferences.controlBorderRadius, 8);
  assert.equal(reloaded.getState().preferences.borderRadius, 16);
  await store.dispatch(saveUserSettings(defaultUserSettings));
  assert.deepEqual(persisted, defaultUserSettings);
});

test('圆角预览不保存，直角能持久化，失败回退与重试、重置保留其他偏好', async () => {
  let persisted = { ...defaultUserSettings, layoutGap: 8, themeMode: 'dark' };
  let failing = false;
  let saves = 0;
  const api = {
    load: async () => ({ ...persisted }),
    save: async (settings) => {
      saves++;
      if (failing) throw Error('圆角保存失败');
      persisted = settings;
      return settings;
    },
  };
  const store = createAppStore(api);
  await store.dispatch(loadUserSettings());
  store.dispatch(previewBorderRadius(12));
  assert.equal(store.getState().preferences.previewBorderRadius, 12);
  assert.equal(saves, 0);
  store.dispatch(closeUserSettings());
  assert.equal(store.getState().preferences.previewBorderRadius, null);
  await store.dispatch(saveUserSettings({ borderRadius: 0 }));
  assert.equal(persisted.borderRadius, 0);
  assert.equal(persisted.layoutGap, 8);
  assert.equal(persisted.themeMode, 'dark');
  const reloaded = createAppStore(api);
  await reloaded.dispatch(loadUserSettings());
  assert.equal(reloaded.getState().preferences.borderRadius, 0);
  failing = true;
  store.dispatch(previewBorderRadius(16));
  await store.dispatch(saveUserSettings({ borderRadius: 16 }));
  assert.equal(store.getState().preferences.borderRadius, 0);
  assert.equal(store.getState().preferences.previewBorderRadius, null);
  assert.deepEqual(store.getState().preferences.failedSettings, { borderRadius: 16 });
  failing = false;
  await store.dispatch(saveUserSettings(store.getState().preferences.failedSettings));
  assert.equal(persisted.borderRadius, 16);
  await store.dispatch(saveThemeMode('system'));
  await store.dispatch(saveLayoutMode('compact'));
  assert.equal(persisted.borderRadius, 16);
  await store.dispatch(saveUserSettings(defaultUserSettings));
  assert.deepEqual(persisted, defaultUserSettings);
});

test('旧版较大间距读取为 16px，仍保留主题和其他配置', async () => {
  for (const layoutGap of [17, 20, 24]) {
    const legacy = { ...defaultUserSettings, layoutGap, themeMode: 'dark' };
    assert.deepEqual(parseUserSettings(legacy), { ...legacy, layoutGap: 16 });
    const store = createAppStore({ load: async () => legacy, save: async (settings) => settings });
    await store.dispatch(loadUserSettings());
    assert.equal(store.getState().preferences.layoutGap, 16);
    assert.equal(store.getState().preferences.savedLayoutGap, 16);
    assert.equal(store.getState().preferences.themeMode, 'dark');
    assert.equal(store.getState().preferences.status, 'ready');
  }
});

test('滑块预览不保存，关闭时清理，提交仅保存最终间距且失败恢复已保存值', async () => {
  const writes = [];
  let failing = false;
  const store = createAppStore({
    load: async () => ({ ...defaultUserSettings }),
    save: async (settings) => {
      writes.push(settings);
      if (failing) throw Error('保存失败');
      return settings;
    },
  });
  await store.dispatch(loadUserSettings());
  store.dispatch(previewLayoutGap(8));
  store.dispatch(previewLayoutGap(12));
  assert.equal(store.getState().preferences.previewLayoutGap, 12);
  assert.equal(store.getState().preferences.layoutGap, 4);
  assert.equal(writes.length, 0);
  store.dispatch(closeUserSettings());
  assert.equal(store.getState().preferences.previewLayoutGap, null);
  store.dispatch(previewLayoutGap(8));
  await store.dispatch(saveUserSettings({ layoutGap: 8 }));
  assert.deepEqual(writes, [{ ...defaultUserSettings, layoutGap: 8 }]);
  assert.equal(store.getState().preferences.previewLayoutGap, null);
  failing = true;
  store.dispatch(previewLayoutGap(12));
  await store.dispatch(saveUserSettings({ layoutGap: 12 }));
  assert.equal(store.getState().preferences.previewLayoutGap, null);
  assert.equal(store.getState().preferences.layoutGap, 8);
});

test('模块间距立即生效，失败回退和重试，切换布局、重新读取与重置保留正确值', async () => {
  let persisted = { ...defaultUserSettings };
  let failing = false;
  const request = deferred();
  let delayed = true;
  const api = {
    load: async () => ({ ...persisted }),
    save: async (settings) => {
      if (delayed) await request.promise;
      if (failing) throw Error('间距保存失败');
      persisted = settings;
      return settings;
    },
  };
  const store = createAppStore(api);
  await store.dispatch(loadUserSettings());
  const saving = store.dispatch(saveUserSettings({ layoutGap: 8 }));
  assert.equal(store.getState().preferences.layoutGap, 8);
  assert.equal(store.getState().preferences.savedLayoutGap, 4);
  request.resolve();
  await saving;
  delayed = false;
  failing = true;
  await store.dispatch(saveUserSettings({ layoutGap: 12 }));
  assert.equal(store.getState().preferences.layoutGap, 8);
  assert.deepEqual(store.getState().preferences.failedSettings, { layoutGap: 12 });
  failing = false;
  await store.dispatch(saveUserSettings(store.getState().preferences.failedSettings));
  assert.equal(store.getState().preferences.savedLayoutGap, 12);
  await store.dispatch(saveLayoutMode('compact'));
  await store.dispatch(saveThemeMode('dark'));
  assert.equal(persisted.layoutGap, 12);
  const reloaded = createAppStore(api);
  await reloaded.dispatch(loadUserSettings());
  assert.equal(reloaded.getState().preferences.layoutGap, 12);
  await store.dispatch(saveLayoutMode('default'));
  assert.equal(store.getState().preferences.layoutGap, 12);
  await store.dispatch(saveUserSettings(defaultUserSettings));
  assert.equal(persisted.layoutGap, 4);
});

test('图标显示独立保存、失败回退和重试，显示文字与重置能持久化', async () => {
  let persisted = {
    ...defaultUserSettings,
    layoutMode: 'compact',
    themeMode: 'dark',
    navigationIconOnly: false,
    headerToolsIconOnly: false,
  };
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
    ...defaultUserSettings,
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
