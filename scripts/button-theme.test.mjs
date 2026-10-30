/** 默认按钮真实样式回归：深浅主题的交互文字和边框均跟随主色，避免组件覆盖导致漂移。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Button, ConfigProvider, theme } from 'antd';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { createAppTheme } from '../src/styles/theme.ts';

test('默认按钮 hover 和按下的文字、边框跟随深浅主题主色', () => {
  for (const mode of ['light', 'dark']) {
    const config = createAppTheme(mode, 4);
    const tokens = theme.getDesignToken(config);
    const cache = createCache();
    renderToString(
      createElement(
        StyleProvider,
        { cache },
        createElement(
          ConfigProvider,
          { theme: config },
          createElement(Button, null, '恢复编辑器默认设置'),
        ),
      ),
    );
    const css = extractStyle(cache);
    for (const [state, color] of [
      ['hover', tokens.colorPrimaryHover],
      ['active', tokens.colorPrimaryActive],
    ]) {
      for (const suffix of ['color', 'border-color']) {
        const property = `--ant-button-default-${state}-${suffix}`;
        const actual = css.match(new RegExp(`${property}:([^;}]*)`))?.[1];
        assert.equal(actual, color, `${mode}: ${property}`);
      }
    }
  }
});
