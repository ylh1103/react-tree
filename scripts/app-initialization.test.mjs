import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router';
import { createServer } from 'vite';
import { createAppStore } from '../src/store/index.ts';
import { loadUserSettings, saveLayoutMode } from '../src/store/slices/preferencesSlice.ts';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('首屏等待后端布局，读取失败回退默认，重试和保存期间保留页面', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
  const { LayoutSettings } = await vite.ssrLoadModule('/src/components/LayoutSettings/index.tsx');
  const loading = deferred();
  const saving = deferred();
  let nextLoad = loading.promise;
  const store = createAppStore({
    load: () => nextLoad,
    save: () => saving.promise,
  });
  let pageRenders = 0;
  function Page() {
    pageRenders++;
    return createElement('main', null, 'workspace-content');
  }
  const render = () =>
    renderToStaticMarkup(
      createElement(
        Provider,
        { store },
        createElement(
          MemoryRouter,
          null,
          createElement(
            Routes,
            null,
            createElement(
              Route,
              { element: createElement(App) },
              createElement(Route, { index: true, element: createElement(Page) }),
            ),
          ),
        ),
      ),
    );

  let initialLoad;
  for (const phase of ['idle', 'loading']) {
    if (phase === 'loading') initialLoad = store.dispatch(loadUserSettings());
    const html = render();
    assert.match(html, /资源加载中/);
    assert.doesNotMatch(html, /data-layout|workspace-content/);
    assert.equal(pageRenders, 0);
  }
  loading.reject(new Error('模拟读取失败'));
  await initialLoad;
  const failed = render();
  assert.match(failed, /data-layout="default"/);
  assert.match(failed, /workspace-content/);
  assert.doesNotMatch(failed, /模拟读取失败|重新读取|资源加载中/);
  assert.equal(store.getState().preferences.initialized, true);
  const settings = renderToStaticMarkup(
    createElement(Provider, { store }, createElement(LayoutSettings)),
  );
  assert.match(settings, /模拟读取失败/);
  assert.match(settings, /已使用默认配置/);
  assert.match(settings, /重新读取/);

  const retry = deferred();
  nextLoad = retry.promise;
  const reloading = store.dispatch(loadUserSettings());
  const retrying = render();
  assert.match(retrying, /data-layout="default"/);
  assert.match(retrying, /workspace-content/);
  assert.doesNotMatch(retrying, /资源加载中/);
  retry.resolve({ layoutMode: 'compact' });
  await reloading;
  const ready = render();
  assert.match(ready, /data-layout="compact"/);
  assert.match(ready, /workspace-content/);
  assert.doesNotMatch(ready, /资源加载中/);

  const save = store.dispatch(saveLayoutMode('default'));
  assert.match(render(), /data-layout="default"/);
  assert.match(render(), /workspace-content/);
  saving.reject(new Error('模拟保存失败'));
  await save;
  assert.match(render(), /data-layout="compact"/);
  assert.match(render(), /workspace-content/);
});

test('路由首屏和配置等待骨架均在缓存暗色主题内渲染', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  const { AppThemeProvider } = await vite.ssrLoadModule('/src/providers/AppThemeProvider.tsx');
  const { ResourceLoading } = await vite.ssrLoadModule('/src/components/ResourceLoading/index.tsx');
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
  const { theme } = await import('antd');
  const loading = deferred();
  const store = createAppStore(
    { load: () => loading.promise, save: async (value) => value },
    'dark',
  );
  const request = store.dispatch(loadUserSettings());
  function ThemeProbe() {
    const { token } = theme.useToken();
    return createElement('span', { 'data-skeleton-surface': token.colorBgContainer });
  }
  const render = (Component) =>
    renderToStaticMarkup(
      createElement(
        Provider,
        { store },
        createElement(
          AppThemeProvider,
          null,
          createElement(ThemeProbe),
          createElement(MemoryRouter, null, createElement(Component)),
        ),
      ),
    );
  for (const Component of [ResourceLoading, App]) {
    const html = render(Component);
    assert.match(html, /资源加载中/);
    assert.match(html, /data-skeleton-surface="#282a36"/);
    assert.equal(store.getState().preferences.initialized, false);
  }
  loading.resolve({ layoutMode: 'default', themeMode: 'light' });
  await request;
  assert.match(render(ResourceLoading), /data-skeleton-surface="#ffffff"/);
});
