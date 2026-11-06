import assert from 'node:assert/strict';
import test from 'node:test';
import { withAlpha } from '../src/pages/Landing/model/themeColors.ts';

test('浅色文字 token 的原始 0.88 alpha 不得成为导航边框透明度', () => {
  assert.equal(withAlpha('rgba(0, 0, 0, 0.88)', 0.09), 'rgba(0,0,0,0.09)');
  assert.equal(withAlpha('rgb(0, 0, 0)', 0.09), 'rgba(0,0,0,0.09)');
});

test('明暗主题的十六进制玻璃色仍保持指定透明度', () => {
  assert.equal(withAlpha('#fff', 0.76), 'rgba(255,255,255,0.76)');
  assert.equal(withAlpha('#282a36', 0.45), 'rgba(40,42,54,0.45)');
  assert.equal(withAlpha('rgba(248,248,242,0.9)', 0.04), 'rgba(248,248,242,0.04)');
});
