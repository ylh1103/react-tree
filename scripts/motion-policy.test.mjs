/** 验证主题 Provider 生成的 Ant Design CSS 保留旧浏览器兼容和系统动效偏好。 */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createServer } from 'vite';
import { Button, ConfigProvider, Select, Skeleton, Switch, Tooltip } from 'antd';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';

let vite;
let AppThemeProvider;
let createAppStore;

before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  ({ AppThemeProvider } = await vite.ssrLoadModule('/src/providers/AppThemeProvider.tsx'));
  ({ createAppStore } = await vite.ssrLoadModule('/src/store/index.ts'));
});

after(async () => {
  await vite?.close();
});

function renderStyles(ThemeProvider) {
  const cache = createCache();
  renderToString(
    createElement(
      StyleProvider,
      { cache },
      createElement(
        Provider,
        { store: createAppStore() },
        createElement(
          ThemeProvider,
          null,
          createElement(Button, null, '保存'),
          createElement(Select),
          createElement(Skeleton, { active: true }),
          createElement(Switch),
          createElement(Tooltip, { title: '提示' }, createElement(Button, null, '详情')),
        ),
      ),
    ),
  );
  return extractStyle(cache);
}

test('Ant Design 控件及弹层保留系统减少动态效果规则和默认动效', () => {
  const css = renderStyles(AppThemeProvider);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@keyframes[^{}]*ant-skeleton-loading/);
  assert.match(css, /animation-duration:/);
  assert.match(css, /transition:/);
  assert.match(css, /ant-tooltip/);
});

test('浏览器兼容转换将 Select 的逻辑内边距展开，并为组件样式生成前缀', () => {
  const original = renderStyles(ConfigProvider);
  assert.match(original, /padding-inline:var\(--ant-select-padding-horizontal\)/);
  const css = renderStyles(AppThemeProvider);
  assert.doesNotMatch(css, /padding-inline:var\(--ant-select-padding-horizontal\)/);
  assert.match(css, /padding-left:var\(--ant-select-padding-horizontal\)/);
  assert.match(css, /padding-right:var\(--ant-select-padding-horizontal\)/);
  assert.match(css, /-webkit-user-select:none/);
});
