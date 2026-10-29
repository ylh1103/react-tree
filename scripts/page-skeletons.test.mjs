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
import { createMockApplicationEnvironments } from '../src/mocks/applicationEnvironments.ts';

let vite;
let createAppStore;
let SystemContext;
let home;
let allSystemsPanel;
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
  ({ default: allSystemsPanel } = await vite.ssrLoadModule(
    '/src/pages/SystemsHome/components/AllSystemsPanel.tsx',
  ));
  ({ default: application } = await vite.ssrLoadModule('/src/pages/SystemApplications/index.tsx'));
  ({ default: database } = await vite.ssrLoadModule('/src/pages/DatabaseParameters/index.tsx'));
  const { default: config } = await vite.ssrLoadModule('/uno.config.ts');
  uno = await createGenerator(config);
});
after(() => vite?.close());

/** 使用真实页面和独立缓存控制 pending/fetching/error，不运行 loader 或业务接口。 */
function setup(t, { Page, path, routePath, key, data, platform = 'application', staleTime = 0 }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime } } });
  if (data !== undefined) {
    client.setQueryData(key, data);
  }
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

function AllSystemsFixture() {
  return createElement(allSystemsPanel, { active: true, onDetails: () => {} });
}

function cases() {
  return [
    {
      Page: home,
      path: '/',
      routePath: '/',
      key: ['systems', 'mine'],
      message: '系统列表加载中',
      data: [{ ...system, role: 'V', ystId: '' }],
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
    {
      Page: AllSystemsFixture,
      path: '/catalog-test',
      routePath: '/catalog-test',
      key: ['systems', 'catalog', { pageNum: 1, pageSize: 8, keyword: '' }],
      message: '系统列表加载中',
      data: { records: [{ ...system, userRelation: true }], total: 65, pageNum: 1, pageSize: 8 },
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
      const refresh = fixture.client.query({
        queryKey: config.key,
        staleTime: 0,
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
        fixture.client.query({
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

test('PC 分栏中 URL 选择只匹配业务项，分组不能作为应用详情', async (t) => {
  for (const [config, data, selectedName, detail] of [
    [
      cases()[1],
      [{ key: '分组', children: [{ key: '应用A', desc: '应用说明' }] }],
      '应用A',
      'dev 环境参数配置',
    ],
    [
      cases()[2],
      [{ paramTypeName: '连接配置', description: '数据库连接说明' }],
      '连接配置',
      '数据库连接说明',
    ],
  ]) {
    await t.test(config.path, (t) => {
      const selectedFixture = setup(t, {
        ...config,
        data,
        staleTime: Infinity,
        path: config.path + '/' + encodeURIComponent(selectedName),
      });
      // 环境详情已改为独立查询；分组清单不再隐式提供静态环境。
      if (config.Page === application) {
        selectedFixture.client.setQueryData(
          ['application-environments', 'CAC', selectedName],
          createMockApplicationEnvironments('CAC', selectedName).toSorted(
            (a, b) => a.envOrder - b.envOrder,
          ),
        );
      }
      const html = selectedFixture.render();
      assert.match(html, /data-split-pane/);
      assert.ok(html.includes(detail), '选中项应展示所属页面的详情');
      assert.doesNotMatch(html, /不存在或已移除/);
      const missing = setup(t, {
        ...config,
        data,
        staleTime: Infinity,
        path: config.path + '/' + encodeURIComponent('分组'),
      }).render();
      assert.match(missing, /「分组」不存在或已移除/);
      assert.match(missing, /返回.*首页/);
    });
  }
});

test('应用环境独立加载，业务与公共工具栏分流，403/404 优先于缓存配置', async (t) => {
  const { HttpError } = await vite.ssrLoadModule('/src/http/request.ts');
  const key = ['application-environments', 'CAC', 'demo'];
  const envs = createMockApplicationEnvironments('CAC', 'demo').toSorted(
    (a, b) => a.envOrder - b.envOrder,
  );
  for (const appType of ['0', '1']) {
    const fixture = setup(t, {
      ...cases()[1],
      data: [{ key: 'demo', appType }],
      path: '/systems/CAC/application/demo',
      staleTime: Infinity,
    });
    assert.match(fixture.render(), /正在加载应用环境/);
    fixture.client.setQueryData(key, envs);
    const html = fixture.render();
    assert.match(html, /dev 环境参数配置/);
    assert.match(html, /st 环境参数配置/);
    // st 的配置为空，仍须提供与 dev 相同的编辑区域，不能回退到空状态或只读面板。
    assert.equal(envs.find((env) => env.envTag === 'st').configInfo.trim(), '');
    assert.match(html, /aria-label="dev 配置内容（可编辑）"/);
    assert.match(html, /aria-label="st 配置内容（可编辑）"/);
    assert.doesNotMatch(html, /当前环境暂无参数配置|只读配置|配置内容（只读）/);
    if (appType === '0') {
      assert.doesNotMatch(html, /aria-label="差异数暂不可用/);
      assert.match(html, /aria-label="运行时配置差异数：3"/);
      assert.doesNotMatch(html, /差异 -2/);
      assert.match(html, /aria-label="最新快照版本 12"/);
      assert.match(html, /aria-label="运行时快照版本 5"/);
      assert.match(html, /aria-label="一键发布"/);
      assert.doesNotMatch(html, /批量发布快照/);
    } else {
      assert.match(html, /批量创建快照/);
      assert.match(html, /批量发布快照/);
      assert.doesNotMatch(html, /最新快照版本|运行时快照版本|一键发布|刷新差异数/);
    }
    await assert.rejects(
      fixture.client.query({
        queryKey: key,
        staleTime: 0,
        queryFn: async () => {
          throw new Error('网络失败');
        },
      }),
    );
    assert.match(fixture.render(), /环境刷新失败/);
    assert.match(fixture.render(), /dev 环境参数配置/);
    for (const status of [403, 404]) {
      await assert.rejects(
        fixture.client.query({
          queryKey: key,
          staleTime: 0,
          queryFn: async () => {
            throw new HttpError(status, '已失效');
          },
        }),
      );
      const blocked = fixture.render();
      assert.doesNotMatch(blocked, /dev 环境参数配置|spring:/);
      assert.match(blocked, status === 403 ? /无权|权限|403/ : /应用或环境不存在/);
    }
  }
});

test('目标不在缓存时等待刷新确认，失败展示重试而不是误报删除', async (t) => {
  for (const config of [cases()[1], cases()[2]]) {
    await t.test(config.path, async (t) => {
      // 显式控制刷新，避免 SSR 的新订阅把刚确认的成功清单立即标为再次获取中。
      const fixture = setup(t, {
        ...config,
        path: config.path + '/unknown',
        data: [],
        staleTime: Infinity,
      });
      let reject;
      const refresh = fixture.client.query({
        queryKey: config.key,
        staleTime: 0,
        queryFn: () =>
          new Promise((_, no) => {
            reject = no;
          }),
      });
      const waiting = fixture.render();
      assert.match(waiting, /aria-label="正在加载(?:应用|参数类型)"/);
      assert.doesNotMatch(waiting, /不存在或已移除/);
      reject(new Error('目标校验刷新失败'));
      await assert.rejects(refresh, /目标校验刷新失败/);
      const failed = fixture.render();
      assert.match(failed, /目标校验刷新失败/);
      assert.match(failed, /重\s*试/);
      assert.doesNotMatch(failed, /不存在或已移除/);
      fixture.client.setQueryData(config.key, []);
      assert.match(fixture.render(), /「unknown」不存在或已移除/);
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
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /gap:1rem/);
});
