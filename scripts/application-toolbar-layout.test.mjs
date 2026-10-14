import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  fitEnvironmentCount,
  getToolbarActionLabelMode,
} from '../src/pages/SystemApplications/components/toolbarLayout.ts';

const sizes = { allWidth: 50, environmentWidths: [50, 50, 50, 50, 50], moreWidth: 40 };
test('操作文字按标题栏外框宽度在1050和1450准确切换', () => {
  assert.equal(getToolbarActionLabelMode(1049.9), 'icons');
  assert.equal(getToolbarActionLabelMode(1050), 'primary');
  assert.equal(getToolbarActionLabelMode(1449.9), 'primary');
  assert.equal(getToolbarActionLabelMode(1450), 'all');
  assert.equal(getToolbarActionLabelMode(1476), 'all');
});
test('全部环境放得下时不为更多入口预留空间', () => {
  assert.equal(fitEnvironmentCount({ ...sizes, availableWidth: 324, previousCount: 5 }), 5);
});
test('收纳区保留真实入口宽度，从末尾减少环境', () => {
  assert.equal(fitEnvironmentCount({ ...sizes, availableWidth: 285, previousCount: 5 }), 3);
  assert.equal(fitEnvironmentCount({ ...sizes, availableWidth: 262, previousCount: 3 }), 3);
});
test('收紧立即生效，重新展开需要额外16px缓冲', () => {
  assert.equal(fitEnvironmentCount({ ...sizes, availableWidth: 308, previousCount: 4 }), 3);
  assert.equal(fitEnvironmentCount({ ...sizes, availableWidth: 330, previousCount: 3 }), 4);
  assert.equal(fitEnvironmentCount({ ...sizes, availableWidth: 340, previousCount: 3 }), 5);
});
test('极窄空间仍保留第一个环境', () => {
  assert.equal(fitEnvironmentCount({ ...sizes, availableWidth: 20, previousCount: 5 }), 1);
});
