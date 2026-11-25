/** 验证预算按静态闭包统计，防止共享 chunk、循环引用或动态页面造成漏算和误报。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import {
  collectInitialChunks,
  createStartupReport,
  startupBudget,
  startupBudgetPlugin,
} from '../build/startup-budget-plugin.mjs';

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
      '/project/src/layouts/UserSettingsDrawer/LayoutSettings/index.tsx': {},
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
  assert.deepEqual(report.warnings, []);
});

test('发现静态回流的设置、交互分栏和 Mock 数据，但允许唯一适配入口', () => {
  const bundle = fixture();
  bundle['shell.js'].modules = {
    '/project/src/components/FailureDetails/Details.tsx': {},
    '/project/src/utils/failureDetails.ts': {},
    '/project/src/components/SplitPane/index.tsx': {},
    '/project/src/components/CollectionSkeleton/index.tsx': {},
    '/project/src/components/MonacoEditor/index.tsx': {},
    '/project/src/layouts/UserSettingsDrawer/UserSettingsContent.tsx': {},
    '/project/src/mocks/adapter.ts': {},
    '/project/src/mocks/config.ts': {},
    '/project/src/mocks/applications.ts': {},
    '/project/src/pages/RouteError/index.tsx': {},
    '/project/src/pages/RouteStatus/index.tsx': {},
    '/project/src/pages/RouteStatus/StatusIllustration.tsx': {},
    '/project/src/pages/FutureBusiness/index.tsx': {},
  };
  const report = createStartupReport(bundle);
  assert.deepEqual(report.forbidden, [
    'components/FailureDetails/Details.tsx',
    'utils/failureDetails.ts',
    'components/SplitPane/index.tsx',
    'components/CollectionSkeleton/index.tsx',
    'components/MonacoEditor/index.tsx',
    'layouts/UserSettingsDrawer/UserSettingsContent.tsx',
    'mocks/applications.ts',
    'pages/FutureBusiness/index.tsx',
  ]);
  assert.equal(report.failures.length, 1);
  bundle['entry.js'].imports.push('settings.js');
  assert.ok(
    createStartupReport(bundle).forbidden.includes(
      'layouts/UserSettingsDrawer/LayoutSettings/index.tsx',
    ),
  );
});

test('JS、CSS 和启动 HTML 超预算时分别告警，不允许缺少入口或 HTML', () => {
  const bundle = fixture();
  assert.equal(
    createStartupReport(bundle, { javascriptGzip: 1, cssGzip: 1, htmlGzip: 1 }).warnings.length,
    3,
  );
  delete bundle['index.html'];
  assert.throws(() => createStartupReport(bundle), /缺少 index.html/);
  delete bundle['entry.js'];
  assert.throws(() => createStartupReport(bundle), /唯一的应用入口/);
});

test('HTML 按独立 gzip 阈值告警，等于阈值时通过，超过一个字节即告警', () => {
  const bundle = fixture();
  // 固定高熵内容避免重复字符串被 gzip 压成极小值，验证真实传输体积而非原始长度。
  bundle['index.html'].source = Array.from({ length: 400 }, (_, index) =>
    createHash('sha256').update(String(index)).digest('hex'),
  ).join('');
  const report = createStartupReport(bundle);
  const measured = report.totals.htmlGzip;
  assert.ok(measured > startupBudget.htmlGzip);
  assert.deepEqual(report.warnings, [`htmlGzip: ${measured} > ${startupBudget.htmlGzip} bytes`]);
  assert.deepEqual(
    createStartupReport(bundle, { ...startupBudget, htmlGzip: measured }).warnings,
    [],
  );
  assert.deepEqual(
    createStartupReport(bundle, { ...startupBudget, htmlGzip: measured - 1 }).warnings,
    [`htmlGzip: ${measured} > ${measured - 1} bytes`],
  );
});

test('体积超限时构建仍输出报告，按需模块回流时构建失败', () => {
  const bundle = fixture();
  bundle['index.html'].source = Array.from({ length: 500 }, (_, index) =>
    createHash('sha256').update(String(index)).digest('hex'),
  ).join('');
  const warnings = [];
  const assets = [];
  const context = {
    warn: (message) => warnings.push(message),
    emitFile: (asset) => assets.push(asset),
    info() {},
    error(message) {
      throw new Error(message);
    },
  };
  const { handler } = startupBudgetPlugin().generateBundle;
  handler.call(context, {}, bundle);
  assert.match(warnings[0], /htmlGzip/);
  assert.equal(assets[0].fileName, 'startup-report.json');
  assert.deepEqual(JSON.parse(assets[0].source).failures, []);
  bundle['entry.js'].imports.push('settings.js');
  assert.throws(() => handler.call(context, {}, bundle), /首屏引入了按需模块/);
  assert.equal(assets.length, 1);
});
