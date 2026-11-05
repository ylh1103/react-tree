/** 验证官方模板 CSS 的实际构建结果，防止全局主题或关键帧影响业务页面。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { createServer, preprocessCSS } from 'vite';

test('模板样式限制在局部根节点，主题、媒体条件和关键帧保持可用', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  const css = `
    :root { --text: white }
    :root[data-theme='light'] .card { color: black }
    body { font-family: Geist }
    .card { animation: pulse 1s linear }
    @media (max-width: 640px) { .card { width: 100% } }
    @keyframes pulse { from { opacity: 0 } to { opacity: 1 } }
  `;
  const output = await preprocessCSS(
    css,
    resolve('src/pages/ReactBits/template/scope-fixture.css'),
    vite.config,
  );
  assert.match(output.code, /\[data-reactbits-template\]\s*\{\s*--text:/);
  assert.match(output.code, /\[data-reactbits-template\]\[data-theme='light'\] \.card/);
  assert.doesNotMatch(output.code, /(?:^|\})\s*(?:body|:root)\s*\{/);
  assert.match(output.code, /@media \(max-width: 640px\)/);
  assert.match(output.code, /animation:\s*rb-template-pulse/);
  assert.match(output.code, /@keyframes rb-template-pulse/);
  assert.doesNotMatch(output.code, /\[data-reactbits-template\] from/);

  const business = await preprocessCSS(
    css,
    resolve('src/components/scope-fixture.css'),
    vite.config,
  );
  assert.match(business.code, /:root \{/);
  assert.match(business.code, /@keyframes pulse/);
  assert.doesNotMatch(business.code, /data-reactbits-template|rb-template-pulse/);
});
