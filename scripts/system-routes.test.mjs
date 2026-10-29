import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import {
  generatePath,
  matchRoutes,
  createMemoryRouter,
  RouterProvider,
  Outlet,
} from 'react-router';
import { createElement } from 'react';
import { Provider } from 'react-redux';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { applicationRouteConfig as navigationItems } from '../src/router/application.ts';
import { databaseRouteConfig as databaseNavigationItems } from '../src/router/database.ts';
import {
  applicationPath,
  applicationOperationPath,
  databasePath,
  platformHome,
  systemPath,
} from '../src/router/paths.ts';
import { filterSystems, isAccessDenied } from '../src/utils/systems.ts';
import { mockSystems } from '../src/mocks/systems.ts';

let vite;
let routes;
before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  ({ routes } = await vite.ssrLoadModule('/src/router/routes.tsx'));
});
after(async () => {
  await vite?.close();
});

const match = (path) => matchRoutes(routes, path)?.at(-1);

test('统一图标可独立静态渲染，保留 SVG 属性、默认回退与多实例裁剪隔离', async () => {
  const { LoadingIndicator } = await vite.ssrLoadModule(
    '/src/components/LoadingIndicator/index.tsx',
  );
  const render = (styleId, props = {}) =>
    renderToStaticMarkup(createElement(LoadingIndicator, { styleId, ...props }));
  const trace = render('data-trace', { className: 'text-32px', 'data-testid': 'indicator' });
  assert.match(trace, /class="[^"]*text-32px/);
  assert.match(trace, /data-testid="indicator"/);
  assert.match(trace, /viewBox="0 0 200 200"/);
  assert.match(trace, /aria-hidden="true"/);
  assert.match(trace, /motion-reduce:animate-none/);
  assert.equal(render('unknown'), render('data-trace'), '未知方案沿用品牌描边回退');
  for (const [styleId, animation] of [
    ['data-trace', 'loading-trace'],
    ['data-wave', 'loading-wave'],
    ['data-matrix', 'loading-dot'],
    ['data-comet', 'loading-ring'],
    ['flat-split', 'brand-blue'],
  ]) {
    const html = render(styleId);
    assert.match(html, new RegExp(`@keyframes ${animation}`));
    assert.doesNotMatch(
      html,
      new RegExp(`@keyframes ${styleId === 'data-trace' ? 'loading-wave' : 'loading-trace'}`),
    );
  }
  const html = renderToStaticMarkup(
    createElement(
      'div',
      null,
      createElement(LoadingIndicator, { styleId: 'flat-split', className: 'text-32px' }),
      createElement(LoadingIndicator, { styleId: 'flat-split', className: 'text-64px' }),
    ),
  );
  const ids = [...html.matchAll(/<clipPath id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2, '不同尺寸实例必须使用独立裁剪路径');
  for (const id of ids) assert.ok(html.includes(`clip-path="url(#${id})"`));
  assert.equal([...html.matchAll(/viewBox="0 0 196 184"/g)].length, 2);
});

test('配置与图库提供相同的五款图标，全局 Spin 随偏好渲染实际方案', async () => {
  const { AppThemeProvider } = await vite.ssrLoadModule('/src/providers/AppThemeProvider.tsx');
  const { createAppStore } = await vite.ssrLoadModule('/src/store/index.ts');
  const { loadUserSettings, saveUserSettings } = await vite.ssrLoadModule(
    '/src/store/slices/preferencesSlice.ts',
  );
  const { defaultUserSettings } = await vite.ssrLoadModule('/src/types/preferences.ts');
  const { loadingStyles } = await vite.ssrLoadModule(
    '/src/components/LoadingIndicator/model/styles.ts',
  );
  const { loadingStyleIds } = await vite.ssrLoadModule('/src/types/loading.ts');
  const { Spin } = await import('antd');
  assert.deepEqual(loadingStyles.map((item) => item.id).sort(), [...loadingStyleIds].sort());
  const store = createAppStore();
  store.dispatch(loadUserSettings.pending('load'));
  store.dispatch(loadUserSettings.fulfilled(defaultUserSettings, 'load'));
  const renderSpin = () =>
    renderToStaticMarkup(
      createElement(
        Provider,
        { store },
        createElement(AppThemeProvider, null, createElement(Spin)),
      ),
    );
  assert.match(renderSpin(), /stroke-dasharray="30 70"/);
  for (const [loadingStyle, shape, count] of [
    ['data-wave', 'rect', 5],
    ['data-matrix', 'circle', 9],
    ['data-comet', 'circle', 12],
    ['flat-split', 'clipPath', 1],
  ]) {
    // pending 代表用户已选择但尚未保存；指示器应即时切换，不等待服务器确认。
    store.dispatch(saveUserSettings.pending(loadingStyle, { loadingStyle }));
    assert.equal([...renderSpin().matchAll(new RegExp(`<${shape}\\b`, 'g'))].length, count);
  }
});

test('系统首页、默认入口及所有应用菜单匹配实际路由', () => {
  assert.equal(match('/').route.index, true);
  assert.equal(typeof match('/').route.lazy, 'function');
  const index = match('/systems/CAC').route;
  assert.equal(index.index, true);
  assert.equal(index.element.props.to, 'overview');
  assert.equal(index.element.props.replace, true);
  for (const page of [
    'overview',
    'application',
    'params',
    'search',
    'inspect',
    'exception',
    'compare',
    'apps-comparison',
    'setting',
  ]) {
    assert.equal(
      match(systemPath('CAC', page)).route.path,
      page === 'application' ? 'application/:appName?' : page,
    );
  }
});

test('数据库设置优先匹配静态路由，不成为参数类型', () => {
  assert.equal(match('/systems/CAC/db').route.path, 'db/:paramTypeName?');
  assert.equal(match('/systems/CAC/db/setting').route.path, 'db/setting');
  assert.equal(match('/systems/CAC/db/setting').params.paramTypeName, undefined);
  assert.equal(match('/systems/CAC/db/customer').params.paramTypeName, 'customer');
});

test('动态路径段正确编码中文、斜杠、空格、百分号与特殊符号', () => {
  const system = '核心 / 100% #?';
  const name = '类型 / 50% #?';
  const database = match(databasePath(system, name));
  const application = match(applicationPath(system, name));
  assert.equal(database.params.systemName, system);
  assert.equal(database.params.paramTypeName, name);
  assert.equal(application.params.appName, name);
});

test('应用环境操作路由保留应用、环境与可选版本，检查不接受版本段', () => {
  const systemName = '核心 / 100% #?';
  const appName = '应用 / 50% #?';
  const envTag = 'dev / 测试';
  for (const operation of ['create', 'publish', 'inspect']) {
    for (const version of operation === 'inspect' ? [undefined] : [undefined, '0', '版本 / 4']) {
      const path = applicationOperationPath(systemName, operation, appName, envTag, version);
      const result = match(path);
      assert.equal(result.params.systemName, systemName);
      assert.equal(result.params.appName, appName);
      assert.equal(result.params.envTag, envTag);
      assert.equal(result.params.version, version);
      assert.equal(
        result.route.path,
        `:envTag/${operation}${operation === 'inspect' ? '' : '/:version?'}`,
      );
      assert.equal(typeof result.route.lazy, 'function');
      assert.equal(
        matchRoutes(routes, path).at(-2).route,
        match(applicationPath(systemName, appName)).route,
        '三个操作必须复用配置页父路由，返回时保持同一个页面实例',
      );
      assert.equal(path.includes('?'), false, '业务选择应从路径读取');
    }
  }
  assert.equal(
    applicationOperationPath('CAC', 'create', 'demo', 'dev', '4'),
    '/systems/CAC/application/demo/dev/create/4',
  );
  assert.equal(match('/systems/CAC/application/demo/dev/inspect/4').route.path, '*');
});

test('切换入口仅保留系统与平台，不带原应用或类型', () => {
  assert.equal(
    platformHome('公共配置', 'application'),
    '/systems/%E5%85%AC%E5%85%B1%E9%85%8D%E7%BD%AE/overview',
  );
  assert.equal(platformHome('CAC', 'database'), '/systems/CAC/db');
});

test('未知地址进入对应的 404 页面', () => {
  const site = routes[0].children.find((route) => route.id === 'site');
  const system = routes[0].children.find((route) => route.id === 'system');
  const workspace = system.children.find((route) => route.id === 'workspace');
  const siteNotFound = site.children.find((route) => route.path === '*');
  const systemNotFound = workspace.children.find((route) => route.path === '*');
  assert.equal(match('/unknown').route, siteNotFound);
  assert.equal(match('/systems/CAC/unknown').route, systemNotFound);
  assert.equal(match('/systems/CAC/db/type/extra').route, systemNotFound);
});

test('系统搜索覆盖英文名、中文名和编号', () => {
  assert.equal(filterSystems(mockSystems, ' cac ')[0].systemName, 'CAC');
  assert.equal(filterSystems(mockSystems, 'LL57.CAC')[0].systemName, 'CAC');
  const chinese = filterSystems(mockSystems, '信用卡核心');
  assert.ok(chinese.length > 0);
  assert.ok(chinese.every((system) => system.systemChineseName.includes('信用卡核心')));
  assert.equal(filterSystems(mockSystems, '不存在').length, 0);
});

test('识别请求封装后的 403，网络和其他错误保留重试路径', () => {
  assert.equal(
    isAccessDenied(new Error('请求失败', { cause: { response: { status: 403 } } })),
    true,
  );
  assert.equal(isAccessDenied(new Error('网络请求失败')), false);
  assert.equal(isAccessDenied({ response: { status: 500 } }), false);
});

test('导航菜单都对应显式路由，动态页面具有懒加载入口', () => {
  // 与导航使用相同的地址生成规则，覆盖两个平台的可选参数入口及静态设置地址。
  for (const { path } of [...navigationItems, ...databaseNavigationItems]) {
    const route = match(systemPath('CAC', generatePath(path))).route;
    assert.equal(route.path, path);
    assert.equal(typeof route.lazy, 'function');
    assert.equal(route.Component, undefined);
    assert.equal(typeof route.HydrateFallback, 'function');
    assert.equal(route.HydrateFallback, match('/').route.HydrateFallback);
  }
  assert.equal(typeof match('/').route.lazy, 'function');
});

test('设置菜单通过链接进入所属平台页面，设置页不再提供抽屉入口', async (t) => {
  const { AppNavigation } = await vite.ssrLoadModule('/src/layouts/AppNavigation.tsx');
  const { SystemContext } = await vite.ssrLoadModule('/src/contexts/SystemContext.tsx');
  const { createAppStore } = await vite.ssrLoadModule('/src/store/index.ts');
  for (const platform of ['application', 'database']) {
    await t.test(platform, async (t) => {
      const path = systemPath('CAC', platform === 'database' ? 'db/setting' : 'setting');
      const store = createAppStore();
      const router = createMemoryRouter([{ path: '*', Component: AppNavigation }], {
        initialEntries: [platformHome('CAC', platform)],
      });
      t.after(() => router.dispose());
      const render = (children) =>
        renderToStaticMarkup(
          createElement(
            Provider,
            { store },
            createElement(
              SystemContext,
              {
                value: {
                  system: mockSystems.find((system) => system.systemName === 'CAC'),
                  systems: mockSystems,
                  platform,
                },
              },
              children,
            ),
          ),
        );
      const link = /<a\b[^>]*aria-label="设置"[^>]*>/.exec(
        render(createElement(RouterProvider, { router })),
      )?.[0];
      assert.ok(link, '设置必须是页面链接');
      assert.ok(link.includes(`href="${path}"`));
      await router.navigate(path);
      const html = render(createElement(RouterProvider, { router }));
      assert.match(/<a\b[^>]*aria-label="设置"[^>]*>/.exec(html)?.[0] ?? '', /aria-current="page"/);
      assert.equal(
        [...html.matchAll(/aria-current="page"/g)].length,
        1,
        '数据库设置页不能同时选中参数清单',
      );
      const { Component: Page } = await match(path).route.lazy();
      const page = render(createElement(Page));
      assert.match(page, /设置工作区/);
      assert.doesNotMatch(page, /打开用户设置|右侧抽屉/);
      assert.equal(store.getState().preferences.settingsOpen, false);
    });
  }
});

test('实际懒加载页面可解析默认和具名导出，占位页面保留标题和分栏', async () => {
  for (const path of [
    '/',
    '/systems/CAC/overview',
    '/systems/CAC/application/app',
    '/systems/CAC/db/customer',
    '/systems/CAC/setting',
    '/systems/CAC/db/setting',
  ]) {
    const { Component } = await match(path).route.lazy();
    assert.equal(typeof Component, 'function', path);
  }
  const { Component: Search } = await match('/systems/CAC/search').route.lazy();
  const search = Search();
  assert.equal(search.props.title, '搜索');
  assert.equal(search.props.splitPane, true);
  const { Component: Params } = await match('/systems/CAC/params').route.lazy();
  const { default: LoadingGallery } = await vite.ssrLoadModule(
    '/src/pages/SystemParameters/components/LoadingGallery.tsx',
  );
  assert.equal(Params().type, LoadingGallery);
});

test('首次加载及导航使用统一骨架，加载完成显示页面，取消导航恢复原页面', async (t) => {
  const { RouteOutlet } = await vite.ssrLoadModule('/src/router/RouteOutlet.tsx');
  const { RouteLoadingContext } = await vite.ssrLoadModule('/src/router/loading.ts');
  const { RouteSkeleton } = await vite.ssrLoadModule('/src/components/RouteSkeleton/index.tsx');
  function deferred() {
    let resolve;
    const promise = new Promise((yes) => {
      resolve = yes;
    });
    return { promise, resolve };
  }
  const page = deferred();
  const started = deferred();
  const cancelled = deferred();
  const cancelStarted = deferred();
  const marker = (text) => () => createElement('div', null, text);
  const First = marker('first-page');
  const Second = marker('second-page');
  function Layout() {
    return createElement(
      'section',
      null,
      createElement('header', null, 'persistent-header'),
      createElement(RouteOutlet, { layoutId: 'workspace', delayMs: 0 }),
    );
  }
  const testRoutes = [
    {
      id: 'workspace',
      Component: Layout,
      children: [
        { path: 'one', Component: First },
        {
          path: 'two',
          HydrateFallback: RouteSkeleton,
          lazy: () => {
            started.resolve();
            return page.promise;
          },
        },
        {
          path: 'three',
          HydrateFallback: RouteSkeleton,
          lazy: () => {
            cancelStarted.resolve();
            return cancelled.promise;
          },
        },
      ],
    },
  ];
  const initial = createMemoryRouter(testRoutes, { initialEntries: ['/two'] });
  const router = createMemoryRouter(testRoutes, { initialEntries: ['/one'] });
  t.after(() => {
    initial.dispose();
    router.dispose();
  });
  const render = (target = router) =>
    renderToStaticMarkup(
      createElement(
        RouteLoadingContext,
        { value: testRoutes },
        createElement(RouterProvider, { router: target }),
      ),
    );
  const initialHtml = render(initial);
  assert.match(initialHtml, /persistent-header/);
  assert.match(initialHtml, /页面加载中/);
  assert.doesNotMatch(initialHtml, /second-page/);
  const navigation = router.navigate('/two');
  await started.promise;
  const loading = render();
  assert.match(loading, /persistent-header/);
  assert.match(loading, /页面加载中/);
  page.resolve({ Component: Second });
  await navigation;
  assert.match(render(), /second-page/);
  assert.doesNotMatch(render(), /页面加载中/);

  const pending = router.navigate('/three');
  await cancelStarted.promise;
  assert.match(render(), /页面加载中/);
  await router.navigate('/one');
  assert.match(render(), /first-page/);
  assert.doesNotMatch(render(), /页面加载中/);
  cancelled.resolve({ Component: marker('third-page') });
  await pending;
  assert.match(render(), /first-page/);
  assert.doesNotMatch(render(), /third-page/);
});

test('父子 loader 等待授权后并行预取，与组件共享系统维度缓存', async (t) => {
  const { queryClient } = await vite.ssrLoadModule('/src/queries/client.ts');
  const { systemsOptions, parameterTypesOptions } =
    await vite.ssrLoadModule('/src/queries/systems.ts');
  queryClient.clear();
  t.after(() => queryClient.clear());
  const requests = [];
  const original = queryClient.query.bind(queryClient);
  const prefetch = t.mock.method(queryClient, 'query', (options) => {
    // 授权与普通预取共用 query；保留真实授权，只替换本测试关注的业务预取。
    if (options.queryKey[0] === 'system-access') return original(options);
    requests.push(options.queryKey);
    return original({ ...options, queryFn: async () => [] });
  });
  const parent = routes[0].children
    .find((route) => route.id === 'system')
    .loader({ params: { systemName: 'CAC' } });
  const child = match('/systems/CAC/db').route.loader({ params: { systemName: 'CAC' } });
  assert.deepEqual(requests, []);
  await Promise.all([parent, child]);
  // 缓存复用检查使用真实 query，避免预取替身遮蔽意外重发的请求。
  prefetch.mock.restore();
  assert.deepEqual(
    requests.map(JSON.stringify).sort(),
    [systemsOptions().queryKey, parameterTypesOptions('CAC').queryKey].map(JSON.stringify).sort(),
  );
  let refetched = false;
  const data = await queryClient.query({
    ...parameterTypesOptions('CAC'),
    // 此处验证 loader 与组件共用缓存键；显式保持缓存新鲜，不依赖全局 staleTime 的刷新策略。
    staleTime: Infinity,
    queryFn: async () => {
      refetched = true;
      return ['unexpected'];
    },
  });
  assert.deepEqual(data, []);
  assert.equal(refetched, false);
});

test('应用列表写入期间导航预取遵守同一个写入锁', async (t) => {
  const { queryClient } = await vite.ssrLoadModule('/src/queries/client.ts');
  let lock;
  t.mock.method(queryClient, 'isMutating', (options) => {
    lock = options.mutationKey;
    return 1;
  });
  const original = queryClient.query.bind(queryClient);
  const requests = [];
  t.mock.method(queryClient, 'query', (options) => {
    requests.push(options.queryKey);
    return original(options);
  });
  await match('/systems/CAC/application').route.loader({ params: { systemName: 'CAC' } });
  const { groupedListKeys } = await vite.ssrLoadModule('/src/queries/groupedList.ts');
  assert.deepEqual(lock, groupedListKeys.write('applications:CAC'));
  assert.deepEqual(requests, [['system-access', 'CAC']]);
});

test('页面 chunk 失败显示静态恢复入口，并保留父级布局', async (t) => {
  // 错误边界与正式应用一样读取首次配置状态，此处模拟已经结束配置等待的导航。
  const { createAppStore } = await vite.ssrLoadModule('/src/store/index.ts');
  const { loadUserSettings } = await vite.ssrLoadModule('/src/store/slices/preferencesSlice.ts');
  const { defaultUserSettings } = await vite.ssrLoadModule('/src/types/preferences.ts');
  const store = createAppStore();
  store.dispatch(loadUserSettings.pending('settings'));
  store.dispatch(loadUserSettings.fulfilled(defaultUserSettings, 'settings'));
  function Layout() {
    return createElement(
      'section',
      null,
      createElement('header', null, 'persistent-header'),
      createElement(Outlet),
    );
  }
  const router = createMemoryRouter(
    [
      {
        Component: Layout,
        children: [
          {
            path: 'broken',
            HydrateFallback: () => null,
            ErrorBoundary: match('/systems/CAC/overview').route.ErrorBoundary,
            lazy: async () => {
              throw new TypeError('Failed to fetch dynamically imported module');
            },
          },
        ],
      },
    ],
    { initialEntries: ['/broken'] },
  );
  t.after(() => router.dispose());
  if (!router.state.initialized) {
    await new Promise((resolve) => {
      const unsubscribe = router.subscribe((state) => {
        if (state.initialized) {
          unsubscribe();
          resolve();
        }
      });
    });
  }
  const html = renderToStaticMarkup(
    createElement(Provider, { store }, createElement(RouterProvider, { router })),
  );
  assert.match(html, /persistent-header/);
  assert.match(html, /页面资源加载失败/);
  assert.match(html, /刷新页面/);
  assert.match(html, /返回系统列表/);
  assert.doesNotMatch(html, /Unexpected Application Error/);
});

test('同系统切换应用或类型不替换整页骨架，跨系统和跨页面仍显示骨架', async () => {
  const { matchPageSkeleton, matchLoadingParams } =
    await vite.ssrLoadModule('/src/router/loading.ts');
  assert.equal(
    matchPageSkeleton(
      routes,
      '/systems/CAC/application/b',
      'workspace',
      '/systems/CAC/application/a',
    ),
    null,
  );
  assert.equal(
    matchPageSkeleton(
      routes,
      '/systems/CAC/application/a',
      'workspace',
      '/systems/CAC/application',
    ),
    null,
  );
  assert.equal(
    matchPageSkeleton(routes, '/systems/CAC/db/b', 'workspace', '/systems/CAC/db/a'),
    null,
  );
  assert.ok(
    matchPageSkeleton(
      routes,
      '/systems/OTHER/application/b',
      'workspace',
      '/systems/CAC/application/a',
    ),
  );
  assert.ok(
    matchPageSkeleton(routes, '/systems/CAC/application/b', 'workspace', '/systems/CAC/overview'),
  );
  for (const name of ['公共配置', '核心 / 100% #?', '字面%25']) {
    assert.equal(matchLoadingParams(routes, applicationPath('CAC', name)).appName, name);
    assert.equal(matchLoadingParams(routes, databasePath('CAC', name)).paramTypeName, name);
  }
});

test('配置页与同一应用的三个子操作往返不切换骨架或重复执行配置 loader', async (t) => {
  const { matchPageSkeleton } = await vite.ssrLoadModule('/src/router/loading.ts');
  const { queryClient } = await vite.ssrLoadModule('/src/queries/client.ts');
  const { groupedListKeys } = await vite.ssrLoadModule('/src/queries/groupedList.ts');
  queryClient.setQueryData(groupedListKeys.list('applications:CAC'), [{ key: 'demo' }]);
  t.after(() => queryClient.clear());
  const source = '/systems/CAC/application/demo';
  const parent = match(source).route;
  let loads = 0;
  const router = createMemoryRouter(
    [
      {
        ...parent,
        path: `systems/:systemName/${parent.path}`,
        lazy: undefined,
        Component: () => null,
        loader: () => {
          loads++;
          return null;
        },
        children: parent.children.map((child) => ({
          ...child,
          lazy: undefined,
          Component: () => null,
        })),
      },
    ],
    { initialEntries: [source] },
  );
  t.after(() => router.dispose());
  if (!router.state.initialized) {
    await new Promise((resolve) => {
      const unsubscribe = router.subscribe((state) => {
        if (state.initialized) {
          unsubscribe();
          resolve();
        }
      });
    });
  }
  for (const operation of ['create', 'publish', 'inspect']) {
    const target = applicationOperationPath('CAC', operation, 'demo', 'dev');
    assert.equal(matchPageSkeleton(routes, target, 'workspace', source), null);
    assert.equal(matchPageSkeleton(routes, source, 'workspace', target), null);
    await router.navigate(target);
    await router.navigate(source);
    assert.equal(loads, 1, `${operation} 往返应复用父配置页及已加载数据`);
  }
  assert.ok(
    matchPageSkeleton(routes, '/systems/OTHER/application/demo/dev/inspect', 'workspace', source),
  );
  assert.ok(matchPageSkeleton(routes, '/systems/CAC/overview', 'workspace', source));
});

test('应用和数据库各自的清单路由复用缓存，缺少目标、跨系统和显式刷新仍重跑', async (t) => {
  const { queryClient } = await vite.ssrLoadModule('/src/queries/client.ts');
  const { groupedListKeys } = await vite.ssrLoadModule('/src/queries/groupedList.ts');
  const { parameterTypesOptions } = await vite.ssrLoadModule('/src/queries/systems.ts');
  for (const [platform, path, seed] of [
    [
      '应用参数',
      'application',
      () =>
        queryClient.setQueryData(groupedListKeys.list('applications:CAC'), [
          { key: 'a' },
          { key: '公共配置' },
        ]),
    ],
    [
      '数据库参数',
      'db',
      () =>
        queryClient.setQueryData(parameterTypesOptions('CAC').queryKey, [
          { paramTypeName: 'a' },
          { paramTypeName: '公共配置' },
        ]),
    ],
  ]) {
    await t.test(platform, async (t) => {
      queryClient.clear();
      seed();
      t.after(() => queryClient.clear());
      let loads = 0;
      // 使用正式路由登记的策略，防止拆分配置时漏挂 shouldRevalidate。
      const route = match(`/systems/CAC/${path}/a`).route;
      const router = createMemoryRouter(
        [
          {
            path: `systems/:systemName/${route.path}`,
            loader: async () => {
              loads++;
              return null;
            },
            shouldRevalidate: route.shouldRevalidate,
            Component: () => null,
          },
        ],
        { initialEntries: [`/systems/CAC/${path}/a`] },
      );
      t.after(() => router.dispose());
      if (!router.state.initialized) {
        await new Promise((resolve) => {
          const unsubscribe = router.subscribe((state) => {
            if (state.initialized) {
              unsubscribe();
              resolve();
            }
          });
        });
      }
      assert.equal(loads, 1);
      await router.navigate(`/systems/CAC/${path}/` + encodeURIComponent('公共配置'));
      assert.equal(loads, 1);
      await router.navigate(`/systems/CAC/${path}/new`);
      assert.equal(loads, 2);
      await router.navigate(`/systems/OTHER/${path}/b`);
      assert.equal(loads, 3);
      await router.navigate(`/systems/OTHER/${path}/b`);
      assert.equal(loads, 4);
    });
  }
});
