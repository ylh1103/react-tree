/** 验证恢复语义：模块加载失败不能承诺边界重试，普通渲染异常可重试，错误原因按纯文本展示。 */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let ComponentFailure;
let AppFailure;
let Details;
let StackTrace;
before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  ({ ComponentFailure } = await vite.ssrLoadModule('/src/components/ComponentFailure/index.tsx'));
  ({ AppFailure } = await vite.ssrLoadModule('/src/components/AppFailure/index.tsx'));
  ({ default: Details } = await vite.ssrLoadModule('/src/components/FailureDetails/Details.tsx'));
  ({ StackTrace } = await vite.ssrLoadModule('/src/components/FailureDetails/StackTraceView.tsx'));
});
after(() => vite?.close());

function feedback(error) {
  return renderToStaticMarkup(
    createElement(ComponentFailure, {
      title: '编辑器',
      error,
      onRetry() {},
      onClose() {},
    }),
  );
}

test('模块下载失败只显示刷新入口，不显示无法重新下载模块的重试按钮', () => {
  const html = feedback(new TypeError('Failed to fetch dynamically imported module: /private.js'));
  assert.match(html, /编辑器资源加载失败/);
  assert.match(html, /刷新页面/);
  assert.doesNotMatch(html.replace(/<[^>]*>/g, '').replace(/\s/g, ''), /重试/);
  assert.match(html, /private\.js/);
});

test('普通渲染错误提供重试和原因，异常内容作为文本转义', () => {
  const html = feedback(new Error('<img src=x onerror=alert(1)>'));
  assert.match(html, /编辑器暂时无法显示/);
  assert.match(html.replace(/<[^>]*>/g, '').replace(/\s/g, ''), /重试/);
  assert.match(html, /&lt;img src=x/);
  assert.doesNotMatch(html, /<img src=x/);
});

test('整页兜底不依赖业务 Provider，运行与资源异常均只提供刷新和技术支持入口', () => {
  const html = renderToStaticMarkup(
    createElement(AppFailure, { error: new Error('render failure') }),
  );
  assert.match(html, /页面暂时无法打开/);
  assert.match(html, /技术支持/);
  // 整页详情按需加载，首屏可处于等高占位；加载完成后才显示具体诊断信息。
  assert.match(html, /诊断信息加载中|render failure/);
  assert.doesNotMatch(html, /返回系统列表/);
  const routeHtml = renderToStaticMarkup(
    createElement(AppFailure, {
      error: new TypeError('Failed to fetch dynamically imported module: /chunk.js'),
    }),
  );
  assert.match(routeHtml, /页面资源加载失败/);
  assert.match(routeHtml, /刷新页面/);
  assert.match(routeHtml, /技术支持/);
  assert.doesNotMatch(routeHtml, /返回系统列表/);
});

test('整页诊断默认收起堆栈，提供复制操作，错误消息继续按文本转义', () => {
  const error = new Error('<img src=x onerror=alert(1)>');
  error.stack = 'Error: render failure\n at PRIVATE_STACK_LOCATION';
  const html = renderToStaticMarkup(createElement(Details, { error, variant: 'page' }));
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /查看诊断详情/);
  assert.match(html, /&lt;img src=x/);
  assert.match(html, /复制错误信息/);
  assert.doesNotMatch(html, /PRIVATE_STACK_LOCATION|<img src=x/);
});

test('整页仅渲染首批堆栈并提供继续显示入口，后续内容由预览状态控制', () => {
  const text = Array.from(
    { length: 100 },
    (_, index) => `    at frame${index} (/src/view.ts:${index + 1}:2)`,
  ).join('\n');
  const html = renderToStaticMarkup(createElement(StackTrace, { text, id: 'preview-test' }));
  assert.match(html, /frame59/);
  assert.doesNotMatch(html, /frame60|frame99/);
  assert.match(html, /继续显示/);
  assert.match(html, /复制将包含全部已提取诊断文本/);
  assert.equal((html.match(/<li /g) || []).length, 60);
});
