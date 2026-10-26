/** 验证懒加载页面的数据骨架、缓存刷新与失败反馈，并保留迁出路由层的尺寸和样式回归覆盖。 */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createServer } from 'vite';
import { createGenerator } from 'unocss';

let vite;
let createAppStore;
let SystemContext;
let home;
let application;
let database;
let uno;
const system = { systemName: 'CAC', systemChineseName: '测试系统' };
before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  ({ createAppStore } = await vite.ssrLoadModule('/src/store/index.ts'));
  ({ SystemContext } = await vite.ssrLoadModule('/src/contexts/SystemContext.tsx'));
  ({ default: home } = await vite.ssrLoadModule('/src/pages/SystemsHome/index.tsx'));
  ({ default: application } = await vite.ssrLoadModule('/src/pages/SystemApplications/index.tsx'));
  ({ default: database } = await vite.ssrLoadModule('/src/pages/DatabaseParameters/index.tsx'));
  const { default: config } = await vite.ssrLoadModule('/uno.config.ts');
  uno = await createGenerator(config);
});
after(() => vite?.close());

/** 使用真实页面和独立缓存控制 pending/fetching/error，不运行 loader 或业务接口。 */
function setup(t, { Page, path, routePath, key, data, platform = 'application' }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (data !== undefined) client.setQueryData(key, data);
  const router = createMemoryRouter([{ path: routePath, Component: Page }], {
    initialEntries: [path],
  });
  t.after(() => {
    router.dispose();
    client.clear();
  });
  const store = createAppStore();
  const render = () =>
    renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          Provider,
          { store },
          createElement(
            SystemContext,
            { value: { system, systems: [system], platform } },
            createElement(RouterProvider, { router }),
          ),
        ),
      ),
    );
  return { client, render };
}

function cases() {
  return [
    {
      Page: home,
      path: '/',
      routePath: '/',
      key: ['systems', 'list'],
      message: '系统列表加载中',
      data: [system],
    },
    {
      Page: application,
      path: '/systems/CAC/application',
      routePath: '/systems/:systemName/application/:appName?',
      key: ['grouped-list', 'applications:CAC'],
      message: '列表资源加载中',
      data: [],
    },
    {
      Page: database,
      path: '/systems/CAC/db',
      routePath: '/systems/:systemName/db/:paramTypeName?',
      key: ['systems', 'CAC', 'database-types'],
      message: '列表资源加载中',
      data: [],
      platform: 'database',
    },
  ];
}

test('业务页面无数据时使用自身骨架，有缓存的刷新及刷新失败保留正文', async (t) => {
  for (const config of cases()) {
    await t.test(config.path, async (t) => {
      const fixture = setup(t, { ...config, data: undefined });
      const pending = fixture.render();
      assert.match(pending, new RegExp(config.message));
      assert.match(pending, /ant-skeleton/);
      assert.doesNotMatch(pending, /页面加载中|<header\b|<main\b/);
      fixture.client.setQueryData(config.key, config.data);
      let reject;
      const refresh = fixture.client.fetchQuery({
        queryKey: config.key,
        queryFn: () =>
          new Promise((_, no) => {
            reject = no;
          }),
      });
      const refreshing = fixture.render();
      assert.doesNotMatch(refreshing, /ant-skeleton|列表资源加载中/);
      assert.equal(fixture.client.getQueryState(config.key).fetchStatus, 'fetching');
      reject(new Error('模拟刷新失败'));
      await assert.rejects(refresh, /模拟刷新失败/);
      const failed = fixture.render();
      assert.match(failed, /模拟刷新失败/);
      assert.doesNotMatch(failed, /ant-skeleton/);
      assert.deepEqual(fixture.client.getQueryData(config.key), config.data);
    });
  }
});

test('首次数据请求失败后展示错误与重试，不停留在业务骨架', async (t) => {
  for (const config of cases()) {
    await t.test(config.path, async (t) => {
      const fixture = setup(t, { ...config, data: undefined });
      await assert.rejects(
        fixture.client.fetchQuery({
          queryKey: config.key,
          queryFn: async () => {
            throw new Error('模拟首次加载失败');
          },
        }),
      );
      const html = fixture.render();
      assert.match(html, /模拟首次加载失败/);
      assert.match(html, /重\s*试/);
      assert.doesNotMatch(html, /ant-skeleton/);
    });
  }
});

test('页面分栏骨架沿用 URL 解码和历史折叠尺寸，不创建交互或写入偏好', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  });
  const reads = [];
  let visible = true;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => {
        reads.push(key);
        return JSON.stringify({ width: 420, visible });
      },
      setItem: () => assert.fail('骨架不应写入分栏缓存'),
    },
  });
  for (const [config, name, storageKey] of [
    [cases()[1], '应用 / 100%', 'application'],
    [cases()[2], '类型 / 100%', 'database'],
  ]) {
    const fixture = setup(t, {
      ...config,
      path: config.path + '/' + encodeURIComponent(name),
      data: undefined,
    });
    const html = fixture.render();
    assert.ok(reads.includes(`parameter-management:split-pane:${storageKey}:v1`));
    assert.match(html, /width:min\(420px/);
    assert.match(html, /aria-label="(?:应用|类型) \/ 100%列表"/);
    assert.doesNotMatch(html, /role="separator"|切换侧边栏|调整.*列表宽度/);
    visible = false;
    assert.match(fixture.render(), /data-sidebar-expanded="false"/);
    assert.match(fixture.render(), /<aside[^>]*hidden=""[^>]*width:min\(420px/);
    visible = true;
  }
});

test('业务骨架布局工具类有实际样式，系统卡片保持与正文一致的自适应网格', async (t) => {
  for (const config of cases()) {
    const html = setup(t, { ...config, data: undefined }).render();
    const tokens = new Set(
      [...html.matchAll(/class="([^"]+)"/g)].flatMap(([, classes]) =>
        classes
          .replaceAll('&amp;', '&')
          .replaceAll('&gt;', '>')
          .replaceAll('&lt;', '<')
          .replaceAll('&#x27;', "'")
          .replaceAll('&quot;', '"')
          .split(/\s+/),
      ),
    );
    const utilities = [...tokens].filter((token) => token && !/^(ant-|anticon|css-)/.test(token));
    const { matched } = await uno.generate(utilities.join(' '), { preflights: false });
    assert.deepEqual(
      utilities.filter((token) => !matched.has(token)),
      [],
      config.path,
    );
  }
  const html = setup(t, { ...cases()[0], data: undefined }).render();
  const grid = /<div class="([^"]+)" aria-hidden="true"><div class="workspace-panel /.exec(html);
  assert.ok(grid, '系统卡片占位必须有独立的布局容器');
  const { css } = await uno.generate(grid[1], { preflights: false });
  assert.match(css, /display:grid/);
  assert.match(css, /grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,360px\),1fr\)\)/);
  assert.match(css, /gap:1rem/);
});
