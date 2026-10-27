/** 验证实际内容宽度和回展缓冲共同决定标题栏操作收纳。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldCollapseToolbar } from '../src/components/GroupedList/hooks/useToolbarOverflow.ts';

test('标题栏按内容占用收纳，相同面板宽度可因统计文字变长而收起', () => {
  assert.equal(shouldCollapseToolbar(280, 270, false), false);
  assert.equal(shouldCollapseToolbar(280, 305, false), true);
  assert.equal(shouldCollapseToolbar(280, 280, false), false);
  assert.equal(shouldCollapseToolbar(279.5, 280, false), true);
});

test('标题栏空间不足立即收起，回展需要额外余量以免边界抖动', () => {
  assert.equal(shouldCollapseToolbar(279, 280, false), true);
  assert.equal(shouldCollapseToolbar(280, 280, true), true);
  assert.equal(shouldCollapseToolbar(287.5, 280, true), true);
  assert.equal(shouldCollapseToolbar(288, 280, true), false);
  assert.equal(shouldCollapseToolbar(288, 280, false), false);
});

test('关闭筛选使标题内容缩短时，原本能放下的按钮立即恢复', () => {
  assert.equal(shouldCollapseToolbar(280, 275, false, 275), false);
  assert.equal(shouldCollapseToolbar(280, 310, false, 275), true);
  assert.equal(shouldCollapseToolbar(280, 275, true, 310), false);
  assert.equal(shouldCollapseToolbar(280, 275, false, 275), false);
  // 内容缩短后仍放不下，继续收纳；只调整面板宽度时仍保留回展缓冲。
  assert.equal(shouldCollapseToolbar(280, 285, true, 310), true);
  assert.equal(shouldCollapseToolbar(280, 275, true, 275), true);
});
