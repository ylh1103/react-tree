import assert from 'node:assert/strict';
import test from 'node:test';
import { theme } from 'antd';
import { createAppTheme, applyTheme } from '../src/styles/theme.ts';

test('浅色和暗色主题保留 Ant Design 圆角层级，支持直角', () => {
  for (const mode of ['light', 'dark']) {
    for (const radius of [0, 4, 6, 8]) {
      const tokens = theme.getDesignToken(createAppTheme(mode, radius));
      const native = theme.getDesignToken({ token: { borderRadius: radius } });
      for (const key of ['borderRadius', 'borderRadiusSM', 'borderRadiusLG', 'borderRadiusXS']) {
        assert.equal(tokens[key], native[key], `${mode}:${key}`);
      }
      if (radius === 8) {
        assert.ok(tokens.borderRadiusSM < tokens.borderRadius);
        assert.ok(tokens.borderRadiusLG > tokens.borderRadius);
      }
    }
  }
});

test('大圆角随各尺寸控件高度扩展，小按钮和大按钮都能达到完整圆角', () => {
  for (const mode of ['light', 'dark']) {
    let previousSmall = 6;
    let previousLarge = 10;
    for (const radius of [10, 12, 14, 16, 20, 24]) {
      const tokens = theme.getDesignToken(createAppTheme(mode, radius));
      assert.equal(tokens.borderRadius, radius);
      assert.ok(tokens.borderRadiusSM > previousSmall);
      assert.ok(tokens.borderRadiusLG > previousLarge);
      assert.ok(tokens.borderRadiusSM < tokens.borderRadius);
      assert.ok(tokens.borderRadiusLG > tokens.borderRadius);
      previousSmall = tokens.borderRadiusSM;
      previousLarge = tokens.borderRadiusLG;
      if (radius === 16) {
        assert.equal(tokens.borderRadiusSM, tokens.controlHeightSM / 2);
        assert.equal(tokens.borderRadius, tokens.controlHeight / 2);
        assert.equal(tokens.borderRadiusLG, tokens.controlHeightLG / 2);
      }
    }
  }
});

test('面板与控件圆角独立，切换主题和直角设置不会互相覆盖', (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const values = new Map();
  globalThis.document = {
    documentElement: {
      style: { setProperty: (key, value) => values.set(key, value) },
      dataset: {},
    },
  };
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  for (const [mode, radius, controlRadius] of [
    ['light', 16, 4],
    ['dark', 16, 8],
    ['dark', 0, 4],
    ['light', 8, 0],
  ]) {
    applyTheme(mode, radius, controlRadius);
    assert.equal(values.get('--ui-radius'), `${radius}px`);
    assert.equal(values.get('--control-radius'), `${controlRadius}px`);
    assert.equal(values.get('--tree-focus-radius'), `${controlRadius}px`);
  }
});
