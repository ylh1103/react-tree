/** 验证组件库生成的真实 CSS，确保统一启用动效时保留关键帧和原有过渡。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Button, ConfigProvider, Skeleton, Switch, Tooltip } from 'antd';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { appMotionTransformers } from '../src/styles/motion.ts';

function renderStyles(transformers) {
  const cache = createCache();
  renderToString(
    createElement(
      StyleProvider,
      { cache, transformers },
      createElement(
        ConfigProvider,
        null,
        createElement(Button, null, '保存'),
        createElement(Skeleton, { active: true }),
        createElement(Switch),
        createElement(Tooltip, { title: '提示' }, createElement(Button, null, '详情')),
      ),
    ),
  );
  return extractStyle(cache);
}

test('Ant Design 控件及弹层样式移除系统禁用分支，保留动画和过渡', () => {
  const original = renderStyles();
  assert.match(original, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  const css = renderStyles(appMotionTransformers);
  assert.doesNotMatch(css, /prefers-reduced-motion/);
  assert.match(css, /@keyframes[^{}]*ant-skeleton-loading/);
  assert.match(css, /animation-duration:/);
  assert.match(css, /transition:/);
  assert.match(css, /ant-tooltip/);
});

test('转换器保留响应式和其他媒体条件，且不修改组件库原始样式对象', () => {
  const style = {
    transition: 'color 0.2s',
    '@media (min-width: 1280px)': { width: 100 },
    '@media (prefers-color-scheme: dark)': { color: 'white' },
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
  };
  const result = appMotionTransformers[0].visit(style);
  assert.deepEqual(Object.keys(result), [
    'transition',
    '@media (min-width: 1280px)',
    '@media (prefers-color-scheme: dark)',
  ]);
  assert.equal(result.transition, style.transition);
  assert.equal(result['@media (min-width: 1280px)'], style['@media (min-width: 1280px)']);
  assert.ok('@media (prefers-reduced-motion: reduce)' in style);
});
