/** 从实际构建依赖图统计首屏闭包；动态页面单独加载，不能把共享 chunk 漏出首屏预算。 */
import { gzipSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

/** 以当前生产构建的 gzip 体积为基线，增长超过 5% 时提示排查。 */
const startupBaseline = { javascriptGzip: 314_829, cssGzip: 22_529, htmlGzip: 11_988 };
export const startupBudget = Object.fromEntries(
  Object.entries(startupBaseline).map(([key, bytes]) => [key, Math.floor((bytes * 105) / 100)]),
);

const forbiddenInitialModules = [
  '/src/components/FailureDetails/Details.tsx',
  '/src/utils/failureDetails.ts',
  '/src/components/SplitPane/index.tsx',
  '/src/components/CollectionSkeleton/',
  '/src/components/MonacoEditor/',
  '/src/components/MonacoDiffEditor/',
  '/src/layouts/UserSettingsDrawer/LayoutSettings/',
  '/src/layouts/UserSettingsDrawer/UserSettingsContent.tsx',
  '/src/mocks/',
  '/src/pages/',
];
// 唯一 HTTP 模拟适配器和轻量配置需要同步接入；模拟数据及处理模块仍必须按请求加载。
// 静态错误、状态页及小体积插画必须能在业务 chunk 加载失败时使用，其余业务页面保持动态入口。
const allowedInitialModules = new Set([
  'mocks/adapter.ts',
  'mocks/config.ts',
  'pages/RouteError/index.tsx',
  'pages/RouteStatus/index.tsx',
  'pages/RouteStatus/StatusIllustration.tsx',
]);

/** 沿静态 imports 去重遍历，不把 dynamicImports 算入入口；同时处理共享依赖和循环引用。 */
export function collectInitialChunks(bundle, entry) {
  const visited = new Set();
  function visit(fileName) {
    if (visited.has(fileName)) return;
    const chunk = bundle[fileName];
    if (!chunk || chunk.type !== 'chunk') return;
    visited.add(fileName);
    chunk.imports.forEach(visit);
  }
  visit(entry);
  return [...visited].map((fileName) => bundle[fileName]);
}

/** 独立函数便于用受控构建图验证边界；模块路径报告只保留 src 相对路径，不泄漏机器目录。 */
export function createStartupReport(bundle, budget = startupBudget) {
  const entries = Object.values(bundle).filter((item) => item.type === 'chunk' && item.isEntry);
  if (entries.length !== 1) throw new Error('首屏预算需要唯一的应用入口');
  const chunks = collectInitialChunks(bundle, entries[0].fileName);
  const measure = (content) => ({
    bytes: Buffer.byteLength(content),
    gzip: gzipSync(content).length,
  });
  const files = chunks.map((chunk) => ({ file: chunk.fileName, ...measure(chunk.code) }));
  const modules = [...new Set(chunks.flatMap((chunk) => Object.keys(chunk.modules)))];
  const forbidden = modules
    .map((id) => id.replaceAll('\\', '/'))
    .filter((id) => forbiddenInitialModules.some((part) => id.includes(part)))
    .map((id) => id.split('/src/').at(-1))
    .filter((id) => !allowedInitialModules.has(id));
  // Vite 已将同步依赖的 CSS 汇入各 chunk 的 importedCss，不含异步页面样式。
  const cssNames = new Set(chunks.flatMap((chunk) => [...(chunk.viteMetadata?.importedCss ?? [])]));
  const css = [...cssNames].map((file) => ({ file, ...measure(bundle[file].source) }));
  const html = bundle['index.html'];
  if (!html || html.type !== 'asset') throw new Error('首屏预算缺少 index.html');
  const totals = {
    javascriptGzip: files.reduce((sum, file) => sum + file.gzip, 0),
    cssGzip: css.reduce((sum, file) => sum + file.gzip, 0),
    htmlGzip: measure(html.source).gzip,
  };
  const warnings = Object.entries(totals)
    .filter(([key, value]) => value > budget[key])
    .map(([key, value]) => `${key}: ${value} > ${budget[key]} bytes`);
  const failures = forbidden.length ? [`首屏引入了按需模块: ${forbidden.join(', ')}`] : [];
  return {
    entry: entries[0].fileName,
    files,
    css,
    totals,
    baseline: startupBaseline,
    budget,
    warnings,
    forbidden,
    failures,
  };
}

/** 体积增长只告警，按需模块进入静态依赖时阻止构建。 */
export function startupBudgetPlugin() {
  return {
    name: 'startup-budget',
    apply: 'build',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const report = createStartupReport(bundle);
        if (report.failures.length) this.error(report.failures.join('\n'));
        if (report.warnings.length)
          this.warn(`首屏 gzip 体积超过告警线\n${report.warnings.join('\n')}`);
        this.emitFile({
          type: 'asset',
          fileName: 'startup-report.json',
          source: JSON.stringify(report, null, 2),
        });
        const { javascriptGzip, cssGzip, htmlGzip } = report.totals;
        this.info(
          `首屏 gzip 体积（字节） JS ${javascriptGzip} / CSS ${cssGzip} / HTML ${htmlGzip}`,
        );
      },
    },
  };
}
