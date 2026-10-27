import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { fitToolbarLayout } from '../src/pages/SystemApplications/components/toolbarLayout.ts';

const sizes = {
  allWidth: 50,
  environmentWidths: [50, 50, 50, 50, 50],
  moreWidths: { label: 70, icon: 40 },
  actionWidths: { all: 400, primary: 180, icons: 112 },
  groupGap: 12,
};
const fit = (availableWidth, previous, overrides = {}) =>
  fitToolbarLayout({ ...sizes, ...overrides, availableWidth, previous });

test('按实测内容宽度展开操作文字，没有固定容器断点', () => {
  assert.deepEqual(fit(736), { visibleCount: 5, actionLabelMode: 'all', showMoreLabel: false });
  assert.deepEqual(fit(735), { visibleCount: 5, actionLabelMode: 'primary', showMoreLabel: false });
  assert.deepEqual(fit(515), { visibleCount: 5, actionLabelMode: 'icons', showMoreLabel: false });
  assert.equal(
    fit(700, undefined, { actionWidths: { all: 350, primary: 180, icons: 112 } }).actionLabelMode,
    'all',
  );
});

test('短标题释放的空间可以展开文字，长标题占宽后优先保留环境', () => {
  const totalWidth = 800;
  assert.equal(fit(totalWidth - 60).actionLabelMode, 'all');
  assert.equal(fit(totalWidth - 220).actionLabelMode, 'primary');
  assert.equal(fit(totalWidth - 300).visibleCount, 5);
});

test('环境从末尾收纳，更多入口按带文字和纯图标的真实宽度计算', () => {
  assert.deepEqual(fit(447), { visibleCount: 4, actionLabelMode: 'icons', showMoreLabel: false });
  assert.deepEqual(fit(430), { visibleCount: 3, actionLabelMode: 'icons', showMoreLabel: true });
  assert.deepEqual(fit(400), { visibleCount: 3, actionLabelMode: 'icons', showMoreLabel: false });
});

test('收紧立即生效，环境和操作文字重新展开均预留16px缓冲', () => {
  const primary = fit(600);
  assert.equal(fit(736, primary).actionLabelMode, 'primary');
  assert.equal(fit(752, primary).actionLabelMode, 'all');
  const compact = fit(400);
  assert.equal(fit(448, compact).visibleCount, 3);
  assert.equal(fit(464, compact).visibleCount, 5);
  assert.equal(fit(350, compact).visibleCount, 2);
});

test('重复测量相同空间不会在两种布局之间反复切换', () => {
  let layout = fit(447);
  for (let iteration = 0; iteration < 10; iteration++) {
    const next = fit(447, layout);
    assert.deepEqual(next, layout);
    layout = next;
  }
});

test('极窄空间仍保留全选、第一个环境和操作入口', () => {
  assert.deepEqual(fit(20), { visibleCount: 1, actionLabelMode: 'icons', showMoreLabel: false });
});
