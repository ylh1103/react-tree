/** 验证实际工具栏按钮覆盖 Ant Design 的几何过渡，防止首帧测量后出现伸缩闪动。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from 'antd';
import { createServer } from 'vite';
import { createGenerator } from 'unocss';

test('可见操作按钮及各档测量副本只过渡颜色，不对布局尺寸播放动画', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  const { ApplicationParametersToolbar } = await vite.ssrLoadModule(
    '/src/pages/SystemApplications/components/ApplicationParametersWorkspace.tsx',
  );
  const { default: config } = await vite.ssrLoadModule('/uno.config.ts');
  const uno = await createGenerator(config);
  const markup = renderToStaticMarkup(
    createElement(
      App,
      null,
      createElement(ApplicationParametersToolbar, {
        selectedEnvironments: ['dev', 'st', 'uat'],
        onChange() {},
      }),
    ),
  );
  const actions = [
    ...markup.matchAll(
      /<button\b[^>]*aria-label="(?:快照对比|参数值加密及验证|一键修改多环境配置)"[^>]*>/g,
    ),
  ];
  assert.equal(actions.length, 12, '覆盖可见按钮及三种文字模式的测量副本');
  for (const [tag] of actions) {
    const { css } = await uno.generate(tag);
    const properties = css.match(/transition-property:([^;}]+)\s*!important/);
    assert.ok(properties, '按钮必须明确覆盖 Ant Design 默认的 transition: all');
    assert.deepEqual(
      properties[1].split(',').map((value) => value.trim()),
      ['color', 'background-color', 'border-color', 'box-shadow'],
    );
  }
});
