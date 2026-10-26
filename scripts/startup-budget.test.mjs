/** 验证预算按静态闭包统计，防止共享 chunk、循环引用或动态页面造成漏算和误报。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { collectInitialChunks, createStartupReport } from '../build/startup-budget-plugin.mjs';

function chunk(fileName, imports = [], modules = {}) {
  return {
    type: 'chunk',
    fileName,
    imports,
    modules,
    code: `export const name = ${JSON.stringify(fileName)};`,
    isEntry: fileName === 'entry.js',
  };
}

function fixture() {
  return {
    'entry.js': {
      ...chunk('entry.js', ['shared.js', 'shell.js']),
      dynamicImports: ['settings.js'],
      viteMetadata: { importedCss: new Set(['entry.css']) },
    },
    'shared.js': chunk('shared.js', ['shell.js']),
    'shell.js': chunk('shell.js', ['shared.js']),
    'settings.js': chunk('settings.js', [], {
      '/project/src/components/LayoutSettings/index.tsx': {},
    }),
    'entry.css': { type: 'asset', source: '.app { display: flex; }' },
    'index.html': { type: 'asset', source: '<html><body>启动画面</body></html>' },
  };
}

test('共享依赖和循环只计算一次，动态设置模块不进入首屏闭包', () => {
  const bundle = fixture();
  assert.deepEqual(
    collectInitialChunks(bundle, 'entry.js').map((item) => item.fileName),
    ['entry.js', 'shared.js', 'shell.js'],
  );
  const report = createStartupReport(bundle);
  assert.equal(
    report.totals.javascriptGzip,
    ['entry.js', 'shared.js', 'shell.js'].reduce(
      (sum, file) => sum + gzipSync(bundle[file].code).length,
      0,
    ),
  );
  assert.equal(report.totals.cssGzip, gzipSync(bundle['entry.css'].source).length);
  assert.deepEqual(report.failures, []);
});

test('发现静态回流的设置、交互分栏和 Mock 数据，但允许唯一适配入口', () => {
  const bundle = fixture();
  bundle['shell.js'].modules = {
    '/project/src/components/SplitPane/index.tsx': {},
    '/project/src/components/CollectionWorkspace/components/CollectionSkeleton.tsx': {},
    '/project/src/layouts/UserSettingsDrawer/index.tsx': {},
    '/project/src/mocks/adapter.ts': {},
    '/project/src/mocks/config.ts': {},
    '/project/src/mocks/applications.ts': {},
    '/project/src/pages/RouteError/index.tsx': {},
    '/project/src/pages/RouteStatus/index.tsx': {},
    '/project/src/pages/FutureBusiness/index.tsx': {},
  };
  const report = createStartupReport(bundle);
  assert.deepEqual(report.forbidden, [
    'components/SplitPane/index.tsx',
    'components/CollectionWorkspace/components/CollectionSkeleton.tsx',
    'layouts/UserSettingsDrawer/index.tsx',
    'mocks/applications.ts',
    'pages/FutureBusiness/index.tsx',
  ]);
  assert.equal(report.failures.length, 1);
  bundle['entry.js'].imports.push('settings.js');
  assert.ok(createStartupReport(bundle).forbidden.includes('components/LayoutSettings/index.tsx'));
});

test('JS、CSS 和启动 HTML 超预算时分别报错，不允许缺少入口或 HTML', () => {
  const bundle = fixture();
  assert.equal(
    createStartupReport(bundle, { javascriptGzip: 1, cssGzip: 1, htmlGzip: 1 }).failures.length,
    3,
  );
  delete bundle['index.html'];
  assert.throws(() => createStartupReport(bundle), /缺少 index.html/);
  delete bundle['entry.js'];
  assert.throws(() => createStartupReport(bundle), /唯一的应用入口/);
});
