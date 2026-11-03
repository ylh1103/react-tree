/** 冷加载诊断模块时不提前显示临时错误文本，等待占位与真正资源失败的原因展示必须区分。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('整页诊断冷加载先显示稳定占位，不闪过纯文本错误原因', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const { FailureDetails } = await vite.ssrLoadModule('/src/components/FailureDetails/index.tsx');
    const html = renderToStaticMarkup(
      createElement(FailureDetails, {
        error: new ReferenceError('COLD_LOADING_TRANSIENT_REASON'),
        variant: 'page',
      }),
    );
    assert.match(html, /诊断信息加载中/);
    assert.match(html, /aria-busy="true"/);
    assert.doesNotMatch(html, /COLD_LOADING_TRANSIENT_REASON/);
  } finally {
    await vite.close();
  }
});

test('诊断模块真正下载失败后仍展示基本原因，等待占位不会永久盖住错误', async () => {
  let attempted;
  const importAttempt = new Promise((resolve) => {
    attempted = resolve;
  });
  const vite = await createServer({
    plugins: [
      {
        name: 'reject-diagnostic-module',
        enforce: 'pre',
        load(id) {
          if (id.endsWith('/src/components/FailureDetails/Details.tsx')) {
            attempted();
            throw Error('TEST_DIAGNOSTIC_CHUNK_REJECTED');
          }
        },
      },
    ],
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const { FailureDetails } = await vite.ssrLoadModule('/src/components/FailureDetails/index.tsx');
    const props = { error: new Error('ACTUAL_DIAGNOSTIC_FAILURE_REASON'), variant: 'page' };
    renderToStaticMarkup(createElement(FailureDetails, props));
    await importAttempt;
    await new Promise((resolve) => setImmediate(resolve));
    const html = renderToStaticMarkup(createElement(FailureDetails, props));
    assert.match(html, /ACTUAL_DIAGNOSTIC_FAILURE_REASON/);
    assert.doesNotMatch(html, /aria-busy="true"/);
  } finally {
    await vite.close();
  }
});
