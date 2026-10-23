import { startUserSettingsEffects } from '../src/store/preferences/effects.ts';
import { mockPreferencesBrowser as mockStorage } from './helpers/preferencesBrowser.mjs';
import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createServer } from 'vite';
import { createAppStore } from '../src/store/index.ts';
import {
  loadUserSettings,
  refreshUserSettings,
  saveThemeMode,
  saveUserSettings,
  openUserSettings,
  resetPreferences,
} from '../src/store/slices/preferencesSlice.ts';
import { themeVariablesByMode, applyTheme } from '../src/styles/theme.ts';
import { bootstrapLoadingKey } from '../src/store/preferences/loadingBootstrap.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';
import { readBootstrapTheme, bootstrapThemeKey } from '../src/store/preferences/themeBootstrap.ts';

test('首屏主题缓存仅接受有效模式，存储不可用安全回退', (t) => {
  const values = mockStorage(t);
  assert.equal(readBootstrapTheme(), 'system');
  for (const mode of ['light', 'dark', 'system']) {
    values.set(bootstrapThemeKey, mode);
    assert.equal(readBootstrapTheme(), mode);
  }
  values.set(bootstrapThemeKey, 'invalid');
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
  mockUserSettingsApi(t, { load: () => loading, save: async (value) => value });
  const store = createAppStore({ themeMode: 'dark' });
  t.after(startUserSettingsEffects(store, null));
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
  mockUserSettingsApi(t, { load: async () => persisted, save: (value) => save(value) });
  const store = createAppStore({ themeMode: 'dark' });
  t.after(startUserSettingsEffects(store, null));
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
  mockUserSettingsApi(t, {
    load: async () => {
      throw new Error('读取失败');
    },
    save: async (value) => value,
  });
  const store = createAppStore({ themeMode: 'dark' });
  t.after(startUserSettingsEffects(store, null));
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
  mockUserSettingsApi(t, {
    load: async () => ({ ...defaultUserSettings }),
    save: async (settings) => {
      if (++calls === 1) await first;
      else throw Error('后续保存失败');
      return settings;
    },
  });
  const store = createAppStore();
  t.after(startUserSettingsEffects(store, null));
  await store.dispatch(loadUserSettings());
  const theme = store.dispatch(saveThemeMode('dark'));
  const radius = store.dispatch(saveUserSettings({ borderRadius: 24 }));
  release();
  await Promise.all([theme, radius]);
  assert.equal(store.getState().preferences.status, 'save-error');
  assert.equal(readBootstrapTheme(), 'dark');
});

test('显示配置独立读取最新值，刷新和读取失败时仍维护启动缓存', async (t) => {
  const values = mockStorage(t);
  let persisted = { ...defaultUserSettings, themeMode: 'dark' };
  let fail = false;
  mockUserSettingsApi(t, {
    load: async () => {
      if (fail) throw new Error('配置不可读');
      return persisted;
    },
    save: async (settings) => settings,
  });
  const store = createAppStore();
  t.after(startUserSettingsEffects(store, null));
  await store.dispatch(loadUserSettings()).unwrap();
  assert.equal(values.get(bootstrapThemeKey), 'dark');
  const refreshed = createAppStore({ themeMode: readBootstrapTheme() });
  assert.equal(refreshed.getState().preferences.themeMode, 'dark');
  assert.equal(refreshed.getState().preferences.initialized, false);
  persisted = { ...defaultUserSettings, themeMode: 'light' };
  await store.dispatch(refreshUserSettings()).unwrap();
  assert.equal(readBootstrapTheme(), 'light');
  fail = true;
  store.dispatch(resetPreferences());
  await store.dispatch(loadUserSettings());
  assert.equal(store.getState().preferences.status, 'load-error');
  assert.equal(readBootstrapTheme(), 'light', '读取失败不覆盖最近确认的缓存');
});

test('无关操作不重复写缓存，停止监听和配置重置后都不写入', async (t) => {
  const values = mockStorage(t);
  let writes = 0;
  globalThis.window.localStorage.setItem = (key, value) => {
    if (key === bootstrapThemeKey) writes++;
    values.set(key, value);
  };
  mockUserSettingsApi(t, {
    load: async () => ({ ...defaultUserSettings, themeMode: 'dark' }),
    save: async (value) => value,
  });
  const store = createAppStore();
  const stop = startUserSettingsEffects(store, null);
  t.after(stop);
  await store.dispatch(loadUserSettings());
  assert.equal(writes, 1);
  store.dispatch(openUserSettings());
  await store.dispatch(refreshUserSettings());
  assert.equal(writes, 1);
  store.dispatch(resetPreferences());
  await store.dispatch(saveThemeMode('light'));
  assert.equal(writes, 1);
  stop();
  assert.equal(readBootstrapTheme(), 'dark');
});

test('取消订阅后成功保存也不再写入启动缓存', async (t) => {
  mockStorage(t);
  mockUserSettingsApi(t, {
    load: async () => ({ ...defaultUserSettings, themeMode: 'dark' }),
    save: async (value) => value,
  });
  const store = createAppStore();
  const stop = startUserSettingsEffects(store, null);
  t.after(stop);
  await store.dispatch(loadUserSettings());
  stop();
  await store.dispatch(saveThemeMode('light'));
  assert.equal(store.getState().preferences.savedThemeMode, 'light');
  assert.equal(readBootstrapTheme(), 'dark');
});

test('缓存写入失败后，后续操作可重试且不影响主题状态', async (t) => {
  const values = mockStorage(t);
  globalThis.window.localStorage.setItem = () => {
    throw new Error('blocked');
  };
  mockUserSettingsApi(t, {
    load: async () => ({ ...defaultUserSettings, themeMode: 'dark' }),
    save: async (value) => value,
  });
  const store = createAppStore();
  t.after(startUserSettingsEffects(store, null));
  await store.dispatch(loadUserSettings());
  assert.equal(store.getState().preferences.themeMode, 'dark');
  assert.equal(values.has(bootstrapThemeKey), false);
  globalThis.window.localStorage.setItem = (key, value) => values.set(key, value);
  store.dispatch(openUserSettings());
  assert.equal(readBootstrapTheme(), 'dark');
});

test('HTML 在外部资源前完成配色，缓存及系统回退与正式主题一致', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  const html = await vite.transformIndexHtml('/', await readFile('index.html', 'utf8'));
  const match = /<script id="theme-bootstrap">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(match, '首屏脚本必须内联在 HTML 中');
  assert.ok(html.indexOf('<meta charset=') < match.index);
  assert.ok(match.index < html.indexOf('<script type="module"'));
  assert.ok(match.index < html.indexOf('<link'));
  assert.ok(Buffer.byteLength(match[1]) < 3000, '内联脚本只携带最小配色，不能打包完整主题库');

  for (const { cached, system, expected, blocked, mediaAvailable = true } of [
    { cached: 'dark', system: false, expected: 'dark' },
    { cached: 'light', system: true, expected: 'light' },
    { cached: 'system', system: true, expected: 'dark' },
    { cached: 'system', system: false, expected: 'light' },
    { cached: null, system: true, expected: 'dark' },
    { cached: 'invalid', system: true, expected: 'dark' },
    { blocked: true, system: true, expected: 'dark' },
    { blocked: true, mediaAvailable: false, expected: 'light' },
  ]) {
    const values = new Map();
    const root = {
      dataset: {},
      style: { setProperty: (key, value) => values.set(key, value) },
    };
    const browser = {
      get localStorage() {
        if (blocked) throw new Error('blocked');
        return {
          getItem: (key) => {
            assert.equal(key, bootstrapThemeKey);
            return cached;
          },
        };
      },
      ...(mediaAvailable ? { matchMedia: () => ({ matches: system }) } : {}),
    };
    runInNewContext(match[1], { window: browser, document: { documentElement: root } });
    assert.equal(root.dataset.theme, expected);
    assert.equal(root.style.colorScheme, expected);
    assert.equal(root.style.backgroundColor, 'var(--color-canvas)');
    assert.equal(values.get('--color-canvas'), themeVariablesByMode[expected]['--color-canvas']);
    assert.equal(values.get('--color-text'), themeVariablesByMode[expected]['--color-text']);

    const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
    globalThis.document = { documentElement: root };
    try {
      const next = expected === 'light' ? 'dark' : 'light';
      applyTheme(next);
      assert.equal(values.get('--color-canvas'), themeVariablesByMode[next]['--color-canvas']);
      assert.equal(root.style.backgroundColor, 'var(--color-canvas)');
      assert.equal(root.dataset.theme, next, 'React 接管后通过变量切换，不被首屏颜色锁定');
    } finally {
      if (previous) Object.defineProperty(globalThis, 'document', previous);
      else delete globalThis.document;
    }
  }
});

test('统一启动插件固定注入顺序，兼容 head 变化及 charset 删除或移动', async (t) => {
  const template = await readFile('index.html', 'utf8');
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  for (const variant of [
    template,
    template.replace('</head>', '<!-- theme-bootstrap -->\n</head>'),
    template.replace('</head>', '<!-- renamed-theme-comment -->\n</head>'),
    template.replace('<head>', '<HEAD>').replace('</head>', '</HEAD>'),
    template.replace('<head>', '<head data-layout="app">'),
    template.replace('<meta charset="UTF-8" />', ''),
    template
      .replace('<meta charset="UTF-8" />', '')
      .replace('</head>', '<meta charset="UTF-8" />\n</head>'),
  ]) {
    const html = await vite.transformIndexHtml('/', variant);
    assert.equal((html.match(/<meta charset=/g) ?? []).length, 1);
    assert.equal((html.match(/<script id="theme-bootstrap">/g) ?? []).length, 1);
    assert.ok(html.includes('<div id="root"></div>'));
    assert.ok(html.indexOf('<meta charset=') < html.indexOf('<script id="theme-bootstrap">'));
    const charsetEnd = html.indexOf('>', html.indexOf('<meta charset=')) + 1;
    assert.ok(Buffer.byteLength(html.slice(0, charsetEnd)) <= 1024);
    assert.equal((html.match(/<script id="loading-bootstrap">/g) ?? []).length, 1);
    assert.equal((html.match(/<style id="loading-bootstrap-style">/g) ?? []).length, 1);
    assert.equal((html.match(/id="bootstrap-loading"/g) ?? []).length, 1);
    assert.ok(
      html.indexOf('<script id="theme-bootstrap">') <
        html.indexOf('<script id="loading-bootstrap">'),
    );
    assert.ok(
      html.indexOf('<script id="loading-bootstrap">') <
        html.indexOf('<style id="loading-bootstrap-style">'),
    );
    assert.ok(html.indexOf('<style id="loading-bootstrap-style">') < html.indexOf('<link'));
    assert.ok(html.indexOf('<script id="theme-bootstrap">') < html.indexOf('<link'));
  }
});

test('配色异常不阻断同一启动插件的图标选择及样式监听', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  const html = await vite.transformIndexHtml('/', await readFile('index.html', 'utf8'));
  const scripts = [
    ...html.matchAll(/<script id="(?:theme|loading)-bootstrap">([\s\S]*?)<\/script>/g),
  ];
  assert.equal(scripts.length, 2);
  const source = scripts.map((match) => match[1]).join('\n');
  for (const failure of ['media', 'style']) {
    const browser = {
      localStorage: { getItem: (key) => (key === bootstrapLoadingKey ? 'data-wave' : 'system') },
      matchMedia: () => {
        if (failure === 'media') throw new Error('media unavailable');
        return { matches: true };
      },
    };
    const root = {
      dataset: {},
      style: {
        setProperty: () => {
          throw new Error('style unavailable');
        },
      },
    };
    const listeners = [];
    runInNewContext(`${source}\nwindow.nextScriptRan = true;`, {
      window: browser,
      document: {
        documentElement: root,
        addEventListener: (type) => listeners.push(type),
      },
    });
    assert.equal(browser.nextScriptRan, true);
    assert.equal(root.dataset.bootstrapLoadingStyle, 'data-wave');
    assert.deepEqual(listeners, ['load', 'error', 'DOMContentLoaded']);
  }
});
