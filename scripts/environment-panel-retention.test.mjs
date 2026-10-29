/** 环境编辑器保留策略的首次挂载边界；交互后的撤销/重做由真实 Monaco 浏览器回归验证。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { App } from 'antd';
import { createServer } from 'vite';
import { createAppStore } from '../src/store/index.ts';
import { createMockApplicationEnvironments } from '../src/mocks/applicationEnvironments.ts';

test('只为首次选中的环境挂载面板，全不选时显示提示而不提前创建全部编辑器', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => vite.close());
  const { ApplicationParametersWorkspace } = await vite.ssrLoadModule(
    '/src/pages/SystemApplications/components/ApplicationParametersWorkspace.tsx',
  );
  const environments = createMockApplicationEnvironments('TEST', 'demo').map((item) => ({
    ...item,
    key: item.envTag,
    name: item.envDesc,
  }));
  const render = (selectedEnvironments) =>
    renderToStaticMarkup(
      createElement(
        Provider,
        { store: createAppStore() },
        createElement(
          App,
          null,
          createElement(
            MemoryRouter,
            null,
            createElement(ApplicationParametersWorkspace, {
              environments,
              selectedEnvironments,
              appType: '0',
              onChange() {},
            }),
          ),
        ),
      ),
    );
  const none = render([]);
  assert.match(none, /选择要查看的环境/);
  assert.doesNotMatch(none, /data-environment-panel=/);
  const selected = render(['dev', 'st']);
  assert.deepEqual(
    [...selected.matchAll(/data-environment-panel="([^"]+)"/g)].map((match) => match[1]).sort(),
    ['dev', 'st'],
  );
  assert.doesNotMatch(selected, /选择要查看的环境/);
});
