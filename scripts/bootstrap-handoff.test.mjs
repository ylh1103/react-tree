/**
 * 启动回退回归：用真实 App、内存 Router 和静态渲染验证配置等待期间保留动画，结束后展示骨架或页面。
 * 静态渲染不会执行布局 Effect，因此这里验证回退选择及不重复生成 SVG，不验证浏览器移除 HTML 节点的时机。
 */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createMemoryRouter, matchRoutes, Outlet, RouterProvider } from 'react-router';
import { createServer } from 'vite';
import { createAppStore } from '../src/store/index.ts';
import { loadUserSettings } from '../src/store/slices/preferencesSlice.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';
import { createGenerator } from 'unocss';
import { applicationRouteConfig } from '../src/router/application.ts';
import { databaseRouteConfig } from '../src/router/database.ts';

// 两个平台独立定义；测试合并枚举入口，保持首屏回退的全量覆盖。
const routeConfigs = [...applicationRouteConfig, ...databaseRouteConfig];

let vite;
let rootRoute;
let BootstrapLoadingProvider;
let RouteLoadingContext;
let RouteSkeleton;
before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  const { routes } = await vite.ssrLoadModule('/src/router/routes.tsx');
  rootRoute = routes[0];
  ({ BootstrapLoadingProvider } = await vite.ssrLoadModule(
    '/src/providers/BootstrapLoadingProvider.tsx',
  ));
  ({ RouteLoadingContext } = await vite.ssrLoadModule('/src/router/loading.ts'));
  ({ RouteSkeleton } = await vite.ssrLoadModule('/src/components/RouteSkeleton/index.tsx'));
});
after(() => vite?.close());

/** 手动控制页面模块或父 loader 的完成时刻，稳定复现二者先后完成的不同等待状态。 */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

/**
 * 创建隔离的路由与 Store：保留真实根组件和错误边界，用受控 Promise 替代页面模块和父 loader。
 * actualRoutes=true 时复用完整路由配置；默认将子布局替换为 Outlet，preserveLayouts 可保留真实外壳。
 * pendingRoot 可暂缓根 loader，确保测试根 HydrateFallback 的外壳，而非已就绪的正式站点页头。
 * initialized 控制配置是否结束等待，startup 模拟 HTML 画面是否存在；二者独立于 Router 的加载状态。
 * 不派发实际配置请求，每次 render 都从当前 Router/Store 状态重新生成静态标记。
 */
function setup(
  t,
  {
    path = '/systems/CAC/application/demo',
    childPath = 'application/:appName?',
    initialized = true,
    pendingParent = true,
    pendingRoot = false,
    startup = true,
    home = false,
    actualRoutes = false,
    preserveLayouts = false,
    registeredSkeleton = true,
  } = {},
) {
  const page = deferred();
  const parent = deferred();
  const leaf = {
    ...(home ? { index: true } : { path: childPath }),
    ...(registeredSkeleton
      ? { HydrateFallback: RouteSkeleton, ErrorBoundary: rootRoute.ErrorBoundary }
      : {}),
    lazy: () => page.promise,
  };
  const fixtureRoutes = [
    {
      ...rootRoute,
      children: home
        ? [leaf]
        : [
            {
              path: 'systems/:systemName',
              ...(pendingParent ? { loader: () => parent.promise } : {}),
              children: [leaf],
            },
          ],
    },
  ];
  // 保留真实路径、层级及回退注册，控制异步边界；外壳替换为 Outlet，隔离浏览器订阅和业务查询。
  const holdRoute = (route) => ({
    ...route,
    ...(route !== rootRoute && route.children && !preserveLayouts ? { Component: Outlet } : {}),
    ...(route.loader || (route === rootRoute && pendingRoot)
      ? { loader: () => parent.promise }
      : {}),
    ...(route.lazy ? { lazy: () => page.promise } : {}),
    ...(route.children ? { children: route.children.map(holdRoute) } : {}),
  });
  const routes = actualRoutes ? [holdRoute(rootRoute)] : fixtureRoutes;
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  t.after(() => router.dispose());
  const store = createAppStore();
  // 直接派发同一 requestId 的生命周期 action，推进真实 reducer，同时避免发出设置接口请求。
  store.dispatch(loadUserSettings.pending('settings'));
  if (initialized) store.dispatch(loadUserSettings.fulfilled(defaultUserSettings, 'settings'));
  const render = () =>
    renderToStaticMarkup(
      createElement(
        BootstrapLoadingProvider,
        { initialActive: startup },
        createElement(
          Provider,
          { store },
          createElement(
            RouteLoadingContext,
            { value: routes },
            createElement(RouterProvider, { router }),
          ),
        ),
      ),
    );
  return { router, store, render, page, parent, routes };
}

// 从业务路由清单派生覆盖范围，并补充带动态参数的深链接，避免新增入口后漏测首屏骨架。
const routeCases = [
  ['系统列表', '/', undefined, '页面加载中'],
  ...routeConfigs.map((route) => [
    route.label,
    '/systems/CAC/' + route.path.replace(/\/:[^/]+\?/g, ''),
    route.path,
    '页面加载中',
  ]),
  ['指定应用', '/systems/CAC/application/demo', 'application/:appName?', '页面加载中'],
  ['指定数据库类型', '/systems/CAC/db/数据库连接', 'db/:paramTypeName?', '页面加载中'],
];

// 保留真实布局层级，验证根回退在父 loader 尚未完成时也占据完整基础布局。
for (const path of [
  '/',
  '/systems/CAC/application',
  '/systems/CAC/application/demo',
  '/systems/CAC/db',
]) {
  test(`首屏 ${path} 的骨架包含基础布局，不能将页面内容直接铺满视口`, (t) => {
    const fixture = setup(t, {
      path,
      actualRoutes: true,
      preserveLayouts: true,
      pendingRoot: true,
    });
    assert.equal(fixture.router.state.initialized, false);
    const html = fixture.render();
    assert.equal([...html.matchAll(/<header\b/g)].length, 1, '首屏应保留一个页头占位');
    assert.equal([...html.matchAll(/<main\b/g)].length, 1, '页面骨架应位于基础布局的主区域');
    assert.match(html, /min-w-1280px/, '首屏应沿用根应用的最小宽度');
    if (path !== '/') assert.match(html, /aria-label="主导航加载中"/, '工作区应保留主导航占位');
    else assert.doesNotMatch(html, /aria-label="主导航加载中"/, '首页不应出现工作区导航');
  });
}

test('根骨架随配置更新间距、紧凑模式及导航宽度，数据库占位沿用数据库导航清单', (t) => {
  const fixture = setup(t, {
    path: '/systems/CAC/db',
    actualRoutes: true,
    preserveLayouts: true,
    initialized: false,
  });
  let html = fixture.render();
  assert.equal(html, '', '首次配置未完成时不显示骨架，继续使用 root 外的 HTML 动画');
  fixture.store.dispatch(loadUserSettings.fulfilled(defaultUserSettings, 'settings'));
  html = fixture.render();
  assert.match(html, /--layout-gap:4px/);
  assert.match(html, /<aside[^>]*class="w-48px /);
  const nav = /<nav[^>]*aria-label="主导航加载中"[\s\S]*?<\/nav>/.exec(html)?.[0];
  assert.ok(nav);
  assert.equal([...nav.matchAll(/ant-skeleton-avatar(?: |")/g)].length, databaseRouteConfig.length);
  fixture.store.dispatch(loadUserSettings.pending('updated-settings'));
  assert.match(fixture.render(), /ant-skeleton/, '初始化后的配置重试不应恢复全屏启动等待');
  fixture.store.dispatch(
    loadUserSettings.fulfilled(
      {
        ...defaultUserSettings,
        layoutMode: 'compact',
        layoutGap: 16,
        navigationIconOnly: false,
        navigationTheme: 'theme',
      },
      'updated-settings',
    ),
  );
  html = fixture.render();
  assert.match(html, /--layout-gap:0px/);
  assert.match(html, /data-layout="compact"/);
  assert.match(html, /<aside[^>]*class="w-60px /);
  assert.match(html, /--color-nav:var\(--color-surface\)/);
  assert.equal([...html.matchAll(/<header\b/g)].length, 1);
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
});

test('统一路由骨架不包含基础布局或业务分栏，也不读取分栏缓存', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => assert.fail('通用路由骨架不应读取业务分栏偏好') },
  });
  const html = renderToStaticMarkup(createElement(RouteSkeleton));
  assert.doesNotMatch(html, /<header\b|<main\b|主导航加载中|data-split-pane/);
  assert.match(html, /ant-skeleton/);
  assert.match(html, /页面加载中/);
});

for (const [name, path, routePath, message] of routeCases) {
  test(`真实路由 ${path}（${name}）等待配置后再展示统一路由骨架`, (t) => {
    const fixture = setup(t, { path, actualRoutes: true, initialized: false });
    const target = matchRoutes(fixture.routes, path)?.at(-1)?.route;
    assert.equal(target?.path, routePath, '静态设置地址不应被数据库类型动态路由覆盖');
    if (path === '/') assert.equal(target?.index, true);
    assert.equal(target?.HydrateFallback, RouteSkeleton);
    assert.equal(fixture.router.state.initialized, false);
    assert.equal(fixture.render(), '', '有缓存和静态骨架也不能提前交接 HTML 启动画面');
    fixture.store.dispatch(loadUserSettings.fulfilled(defaultUserSettings, 'settings'));
    const html = fixture.render();
    assert.match(html, new RegExp(message));
    assert.match(html, /ant-skeleton/);
    assert.doesNotMatch(html, /<svg/, '目标骨架交接后不应重新挂载启动图标');
    assert.doesNotMatch(html, /data-split-pane=|demo|数据库连接/, '路由骨架不依赖业务选中项');
  });
}

test('页面先就绪：配置未返回时始终保留 HTML 动画，配置完成后直接进入页面', async (t) => {
  const fixture = setup(t, { path: '/', actualRoutes: true, initialized: false });
  fixture.page.resolve({ Component: () => createElement('div', null, 'home-ready') });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(fixture.router.state.initialized, false, '系统清单仍在加载');
  assert.equal(fixture.render(), '', '父 loader 等待期间也不能提前显示骨架或重建图标');

  const ready = new Promise((resolve) => {
    const unsubscribe = fixture.router.subscribe((state) => {
      if (state.initialized) {
        unsubscribe();
        resolve();
      }
    });
  });
  fixture.parent.resolve(null);
  await ready;
  assert.equal(fixture.render(), '', '页面已就绪仍由 App 保留 HTML 动画，不暴露未初始化页面');
  fixture.store.dispatch(loadUserSettings.fulfilled(defaultUserSettings, 'settings'));
  assert.match(fixture.render(), /home-ready/);
  assert.doesNotMatch(fixture.render(), /ant-skeleton/);
});

test('所有路由骨架使用的工具类都有实际样式，避免遗漏已移除的 shortcut', async (t) => {
  const { default: unoConfig } = await vite.ssrLoadModule('/uno.config.ts');
  const uno = await createGenerator(unoConfig);
  for (const [, path] of routeCases) {
    const fixture = setup(t, { path, actualRoutes: true });
    const tokens = new Set(
      [...fixture.render().matchAll(/class="([^"]+)"/g)].flatMap(([, classes]) =>
        classes
          .replaceAll('&amp;', '&')
          .replaceAll('&gt;', '>')
          .replaceAll('&lt;', '<')
          .replaceAll('&#x27;', "'")
          .replaceAll('&quot;', '"')
          .split(/\s+/),
      ),
    );
    // Ant Design 的类由组件库提供；hover / active 仅作为 SplitPane 交互状态标记。
    const utilities = [...tokens].filter(
      (token) =>
        token && !/^(ant-|anticon|css-)/.test(token) && !['hover', 'active'].includes(token),
    );
    const { matched } = await uno.generate(utilities.join(' '), { preflights: false });
    assert.deepEqual(
      utilities.filter((token) => !matched.has(token)),
      [],
      `${path} 中的布局类必须由 UnoCSS 或现有 shortcut 生成样式`,
    );
  }
});

for (const [name, options] of [
  ['系统首页', { path: '/', home: true }],
  ['应用参数深链接', {}],
  ['数据库参数深链接', { path: '/systems/CAC/db/demo', childPath: 'db/:paramTypeName' }],
  ['系统概览深链接', { path: '/systems/CAC/overview', childPath: 'overview' }],
]) {
  test(`${name}首次进入或刷新时，页面 chunk 未完成也能展示通用骨架`, (t) => {
    const fixture = setup(t, options);
    assert.equal(fixture.router.state.initialized, false);
    const html = fixture.render();
    assert.match(html, /页面加载中/);
    assert.match(html, /ant-skeleton/);
    assert.doesNotMatch(html, /<svg/, '不能再接连挂载另一份根级 loading 图标');
  });
}

test('配置先完成：设置返回后交接到目标骨架，不重建启动图标', (t) => {
  const fixture = setup(t, { initialized: false });
  assert.equal(fixture.render(), '');
  fixture.store.dispatch(loadUserSettings.fulfilled(defaultUserSettings, 'settings'));
  assert.equal(fixture.router.state.initialized, false);
  assert.match(fixture.render(), /ant-skeleton/);
  assert.doesNotMatch(fixture.render(), /<svg/);
});

test('配置读取失败仍结束启动等待，目标骨架可显示', (t) => {
  const fixture = setup(t, { initialized: false });
  assert.equal(fixture.render(), '');
  fixture.store.dispatch(loadUserSettings.rejected(Error('设置读取失败'), 'settings'));
  assert.equal(fixture.store.getState().preferences.initialized, true);
  assert.match(fixture.render(), /ant-skeleton/);
});

for (const registeredSkeleton of [true, false]) {
  test(`没有 HTML 启动画面时，配置等待使用 React 图标而非骨架（骨架注册=${registeredSkeleton}）`, (t) => {
    const fixture = setup(t, { initialized: false, startup: false, registeredSkeleton });
    assert.match(fixture.render(), /资源加载中/);
    assert.match(fixture.render(), /<svg/);
    assert.doesNotMatch(fixture.render(), /ant-skeleton/);
  });
}

test('没有静态骨架且 HTML 启动画面仍在时，配置等待继续复用原动画', (t) => {
  const fixture = setup(t, { initialized: false, registeredSkeleton: false });
  assert.equal(fixture.render(), '');
});

test('页面资源先失败：等待配置结束后再交接错误恢复入口', async (t) => {
  const fixture = setup(t, { pendingParent: false, initialized: false });
  const ready = new Promise((resolve) => {
    const unsubscribe = fixture.router.subscribe((state) => {
      if (state.initialized) {
        unsubscribe();
        resolve();
      }
    });
  });
  fixture.page.reject(new TypeError('Failed to fetch dynamically imported module'));
  await ready;
  assert.equal(fixture.render(), '', '路由错误页也不能在首次配置完成前切换主题和交接动画');
  fixture.store.dispatch(loadUserSettings.fulfilled(defaultUserSettings, 'settings'));
  assert.match(fixture.render(), /页面资源加载失败/);
  assert.match(fixture.render(), /刷新页面/);
  assert.doesNotMatch(fixture.render(), /资源加载中/);
});

test('页面和配置都失败时仍展示恢复入口，不会永久保留启动动画', async (t) => {
  const fixture = setup(t, { pendingParent: false, initialized: false });
  fixture.page.reject(new TypeError('Failed to fetch dynamically imported module'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(fixture.router.state.initialized, true);
  assert.equal(fixture.render(), '');
  fixture.store.dispatch(loadUserSettings.rejected(Error('请求超时，请稍后重试'), 'settings'));
  assert.match(fixture.render(), /页面资源加载失败/);
  assert.match(fixture.render(), /刷新页面/);
});
