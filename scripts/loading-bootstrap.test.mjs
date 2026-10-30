import { startUserSettingsEffects } from '../src/store/preferences/effects.ts';
import { mockPreferencesBrowser as mockStorage } from './helpers/preferencesBrowser.mjs';
/**
 * 验证启动 HTML、Redux 初始显示与服务端确认缓存的一致性，覆盖读写失败、连续保存及样式等待。
 * HTML 脚本在独立 VM 中执行，样式事件由 EventTarget 模拟；不依赖真实浏览器的下载或绘制时序。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createServer } from 'vite';
import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
import { createAppStore } from '../src/store/index.ts';
import {
  loadUserSettings,
  refreshUserSettings,
  saveUserSettings,
  openUserSettings,
  resetPreferences,
} from '../src/store/slices/preferencesSlice.ts';
import {
  bootstrapLoadingKey,
  readBootstrapLoading,
} from '../src/store/preferences/loadingBootstrap.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';
import { loadingStyleIds } from '../src/types/loading.ts';
import { startBootstrapStyles, waitForBootstrapStyles } from '../src/utils/bootstrapStyles.ts';

/** 暂缓模拟接口完成，以便在读取或保存仍进行时断言 Store 和启动缓存的状态。 */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('启动图标仅接受当前白名单，非法缓存及不可访问的存储使用默认方案', (t) => {
  const values = mockStorage(t);
  assert.equal(readBootstrapLoading(), defaultUserSettings.loadingStyle);
  for (const id of loadingStyleIds) {
    values.set(bootstrapLoadingKey, id);
    assert.equal(readBootstrapLoading(), id);
  }
  for (const id of ['', 'data-unknown', '<script>alert(1)</script>']) {
    values.set(bootstrapLoadingKey, id);
    assert.equal(readBootstrapLoading(), defaultUserSettings.loadingStyle);
  }
  globalThis.window.localStorage.getItem = () => {
    throw Error('blocked');
  };
  assert.equal(readBootstrapLoading(), defaultUserSettings.loadingStyle);
  Object.defineProperty(globalThis.window, 'localStorage', {
    get() {
      throw Error('blocked');
    },
  });
  assert.equal(readBootstrapLoading(), defaultUserSettings.loadingStyle);
});

test('首次等待沿用缓存图标，加载成功才校准；读取失败及重试不覆盖缓存', async (t) => {
  const values = mockStorage(t);
  values.set(bootstrapLoadingKey, 'data-wave');
  const first = deferred();
  let loading = first.promise;
  mockUserSettingsApi(t, { load: () => loading, save: async (value) => value });
  const store = createAppStore({ loadingStyle: readBootstrapLoading() });
  t.after(startUserSettingsEffects(store, null));
  const request = store.dispatch(loadUserSettings());
  assert.equal(store.getState().preferences.loadingStyle, 'data-wave');
  assert.equal(store.getState().preferences.initialized, false);
  assert.equal(readBootstrapLoading(), 'data-wave');
  assert.equal(
    (await store.dispatch(saveUserSettings({ loadingStyle: 'flat-split' }))).meta.condition,
    true,
  );
  first.reject(Error('配置损坏'));
  await request;
  assert.equal(store.getState().preferences.loadingStyle, 'data-wave');
  assert.equal(store.getState().preferences.status, 'load-error');
  assert.equal(readBootstrapLoading(), 'data-wave');
  loading = Promise.resolve({ ...defaultUserSettings, loadingStyle: 'data-matrix' });
  await store.dispatch(loadUserSettings()).unwrap();
  assert.equal(store.getState().preferences.loadingStyle, 'data-matrix');
  assert.equal(readBootstrapLoading(), 'data-matrix');
});

test('乐观选择与失败保存不污染启动图标，后台同步及恢复默认更新确认缓存', async (t) => {
  mockStorage(t);
  const saving = deferred();
  let save = () => saving.promise;
  let persisted = { ...defaultUserSettings, loadingStyle: 'data-comet' };
  mockUserSettingsApi(t, { load: async () => persisted, save: (value) => save(value) });
  const store = createAppStore();
  t.after(startUserSettingsEffects(store, null));
  await store.dispatch(loadUserSettings()).unwrap();
  const request = store.dispatch(saveUserSettings({ loadingStyle: 'flat-split' }));
  assert.equal(store.getState().preferences.loadingStyle, 'flat-split');
  assert.equal(readBootstrapLoading(), 'data-comet');
  saving.reject(Error('保存失败'));
  await request;
  assert.equal(store.getState().preferences.loadingStyle, 'data-comet');
  assert.equal(readBootstrapLoading(), 'data-comet');
  save = async (value) => value;
  await store.dispatch(saveUserSettings({ loadingStyle: 'data-wave' })).unwrap();
  assert.equal(readBootstrapLoading(), 'data-wave');
  persisted = { ...defaultUserSettings, loadingStyle: 'data-matrix' };
  await store.dispatch(refreshUserSettings()).unwrap();
  assert.equal(readBootstrapLoading(), 'data-matrix');
  await store.dispatch(saveUserSettings(defaultUserSettings)).unwrap();
  assert.equal(readBootstrapLoading(), defaultUserSettings.loadingStyle);
});

test('连续保存中较早成功的图标推进缓存，后续保存失败仍保留成功基线', async (t) => {
  mockStorage(t);
  const first = deferred();
  let calls = 0;
  mockUserSettingsApi(t, {
    load: async () => defaultUserSettings,
    save: async (value) => {
      if (++calls === 1) await first.promise;
      else throw Error('后续保存失败');
      return value;
    },
  });
  const store = createAppStore();
  t.after(startUserSettingsEffects(store, null));
  await store.dispatch(loadUserSettings()).unwrap();
  const one = store.dispatch(saveUserSettings({ loadingStyle: 'flat-split' }));
  const two = store.dispatch(saveUserSettings({ loadingStyle: 'data-wave' }));
  first.resolve();
  await Promise.all([one, two]);
  assert.equal(store.getState().preferences.loadingStyle, 'flat-split');
  assert.equal(readBootstrapLoading(), 'flat-split');
});

test('存储写入失败后可重试，无关更新不重复写入，重置及取消订阅不写缓存', async (t) => {
  const values = mockStorage(t);
  let blocked = true;
  let writes = 0;
  globalThis.window.localStorage.setItem = (key, value) => {
    if (blocked) throw Error('blocked');
    if (key === bootstrapLoadingKey) writes++;
    values.set(key, value);
  };
  mockUserSettingsApi(t, {
    load: async () => ({ ...defaultUserSettings, loadingStyle: 'data-wave' }),
    save: async (value) => value,
  });
  const store = createAppStore();
  const stop = startUserSettingsEffects(store, null);
  t.after(stop);
  await store.dispatch(loadUserSettings());
  assert.equal(values.size, 0);
  blocked = false;
  store.dispatch(openUserSettings());
  assert.equal(writes, 1);
  store.dispatch(openUserSettings());
  await store.dispatch(refreshUserSettings());
  assert.equal(writes, 1);
  store.dispatch(resetPreferences());
  assert.equal(writes, 1);
  stop();
  await store.dispatch(loadUserSettings());
  await store.dispatch(saveUserSettings({ loadingStyle: 'flat-split' }));
  assert.equal(readBootstrapLoading(), 'data-wave');
});

test('HTML 内联五款正式图标及 UnoCSS，脚本先于外部资源；React 等待时使用同一方案', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  const html = await vite.transformIndexHtml('/', await readFile('index.html', 'utf8'));
  const script = /<script id="loading-bootstrap">([\s\S]*?)<\/script>/.exec(html);
  const css = /<style id="loading-bootstrap-style">([\s\S]*?)<\/style>/.exec(html);
  assert.ok(script);
  assert.ok(css);
  assert.ok(html.indexOf('<meta charset=') < script.index);
  assert.ok(script.index < html.indexOf('<script type="module"'));
  assert.ok(css.index < html.indexOf('<link'));
  assert.match(
    html,
    /id="root"><\/div>\s*<div id="bootstrap-loading"/,
    '启动画面必须与 React 根节点并列，挂载应用不能重建正在播放的 SVG',
  );
  assert.equal([...html.matchAll(/data-loading-style="/g)].length, loadingStyleIds.length);
  assert.doesNotMatch(css[1], /prefers-reduced-motion/, '首屏动画不受系统减少动态效果影响');
  assert.match(css[1], /animation:loading-wave/);
  assert.match(css[1], /animation:brand-red/);
  assert.match(css[1], /animation:brand-blue/);
  assert.match(css[1], /background-color:var\(--color-canvas\)/);
  const styled = await vite.transformIndexHtml(
    '/style-test',
    (await readFile('index.html', 'utf8')).replace(
      '</head>',
      '<link rel="stylesheet" href="/fixture.css"><link rel="stylesheet" href="/print.css" media="print"></head>',
    ),
  );
  assert.match(
    styled,
    /href="\/fixture.css" media="print" data-bootstrap-stylesheet/,
    '主样式不阻塞启动图标绘制',
  );
  assert.match(styled, /href="\/print.css" media="print">/, '显式媒体条件不参与启动交接');
  const { ResourceLoading } = await vite.ssrLoadModule('/src/components/ResourceLoading/index.tsx');
  for (const cached of [...loadingStyleIds, null, 'invalid', '<script>bad()</script>']) {
    const document = { documentElement: { dataset: {} }, addEventListener() {} };
    runInNewContext(script[1], {
      window: { localStorage: { getItem: () => cached } },
      document,
    });
    const expected = loadingStyleIds.includes(cached) ? cached : defaultUserSettings.loadingStyle;
    assert.equal(document.documentElement.dataset.bootstrapLoadingStyle, expected);
    assert.ok(
      css[1].includes(`[data-bootstrap-loading-style=${expected}]`),
      '工具类必须生成可匹配的祖先选择器',
    );
    const store = createAppStore({ loadingStyle: expected });
    const waiting = renderToStaticMarkup(
      createElement(Provider, { store }, createElement(ResourceLoading)),
    );
    assert.match(waiting, /role="status"/);
    assert.match(waiting, /资源加载中/);
    assert.doesNotMatch(waiting, /ant-skeleton/);
    if (expected === 'data-wave') assert.equal([...waiting.matchAll(/<rect\b/g)].length, 5);
    if (expected === 'data-matrix') assert.equal([...waiting.matchAll(/<circle\b/g)].length, 9);
    if (expected === 'data-comet') assert.equal([...waiting.matchAll(/<circle\b/g)].length, 12);
    if (expected === 'flat-split') assert.match(waiting, /<clipPath/);
  }
  const document = { documentElement: { dataset: {} }, addEventListener() {} };
  runInNewContext(script[1], {
    window: {
      get localStorage() {
        throw Error('blocked');
      },
    },
    document,
  });
  assert.equal(
    document.documentElement.dataset.bootstrapLoadingStyle,
    defaultUserSettings.loadingStyle,
  );
});

test('主样式成功、失败、缓存命中和无链接均可交接，捕获监听在解析及下载结束后清理', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  class Link extends EventTarget {
    tagName = 'LINK';
    dataset = {};
    media = 'print';
    sheet = null;
    hasAttribute(name) {
      return name === 'data-bootstrap-stylesheet';
    }
  }
  const links = [new Link(), new Link()];
  const document = Object.assign(new EventTarget(), {
    readyState: 'loading',
    querySelector: () => links.find((link) => !link.dataset.bootstrapReady) ?? null,
    querySelectorAll: () => links,
  });
  globalThis.document = document;
  const removed = t.mock.method(document, 'removeEventListener');
  startBootstrapStyles();
  let ready = false;
  const waiting = waitForBootstrapStyles().then(() => {
    ready = true;
  });
  await Promise.resolve();
  assert.equal(ready, false);
  // Node 的 EventTarget 没有 DOM 传播路径，分别触发 document 捕获处理与链接自身的等待处理。
  // 顺序与浏览器一致：头部监听先恢复媒体条件并标记完成，入口监听再结束等待。
  const complete = (link, type) => {
    const captured = new Event(type);
    Object.defineProperty(captured, 'target', { value: link });
    document.dispatchEvent(captured);
    link.dispatchEvent(new Event(type));
  };
  complete(links[0], 'load');
  assert.equal(links[0].media, 'all');
  assert.equal(links[0].dataset.bootstrapReady, 'true');
  assert.equal(removed.mock.callCount(), 0, 'HTML 尚未解析完不能提前取消捕获');
  document.readyState = 'interactive';
  document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(removed.mock.callCount(), 0, '仍有未完成样式时继续捕获');
  complete(links[1], 'error');
  await waiting;
  assert.equal(ready, true);
  assert.equal(links[1].dataset.bootstrapReady, 'true');
  assert.equal(removed.mock.callCount(), 2);
  await waitForBootstrapStyles();
  document.querySelectorAll = () => [Object.assign(new Link(), { sheet: {} })];
  await waitForBootstrapStyles();
  document.querySelectorAll = () => [];
  await waitForBootstrapStyles();
});
