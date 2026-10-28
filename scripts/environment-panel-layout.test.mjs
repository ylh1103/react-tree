/** 验证环境宽度逐像素连续变化，只在 48px 折叠，并覆盖反向拖动和尺寸边界。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resizeEnvironmentPanel } from '../src/pages/SystemApplications/components/environmentPanelLayout.ts';

const expanded = { x: 600, width: 500, visible: true, pointerId: 1 };

test('拖拽连续经过原最小宽度和吸附阈值，直到 48px 才折叠', () => {
  for (let width = 500; width >= 48; width -= 1) {
    assert.deepEqual(resizeEnvironmentPanel(expanded, 600 + width - 500), {
      width,
      collapsed: width === 48,
    });
  }
  assert.deepEqual(resizeEnvironmentPanel(expanded, -1000), { width: 48, collapsed: true });
});

test('折叠窄条向右拖动一个像素即可展开，不跳到 320px', () => {
  const collapsed = { ...expanded, x: 148, visible: false };
  assert.deepEqual(resizeEnvironmentPanel(collapsed, 147), { width: 48, collapsed: true });
  assert.deepEqual(resizeEnvironmentPanel(collapsed, 148), { width: 48, collapsed: true });
  assert.deepEqual(resizeEnvironmentPanel(collapsed, 149), { width: 49, collapsed: false });
  assert.deepEqual(resizeEnvironmentPanel(collapsed, 284), { width: 184, collapsed: false });
  assert.deepEqual(resizeEnvironmentPanel(collapsed, 500), { width: 400, collapsed: false });
  assert.deepEqual(resizeEnvironmentPanel(collapsed, 2000), { width: 1600, collapsed: false });
});

test('同一手势反向拖动仍使用固定起点，不累计偏移，并限制最大宽度', () => {
  for (const x of [283, 800, 0, 284, 10000, 600]) {
    const width = Math.max(48, Math.min(1600, 500 + x - 600));
    assert.deepEqual(resizeEnvironmentPanel(expanded, x), { width, collapsed: width === 48 });
  }
  assert.deepEqual(expanded, { x: 600, width: 500, visible: true, pointerId: 1 });
});
