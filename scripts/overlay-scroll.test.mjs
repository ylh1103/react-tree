/** 回归覆盖条的异步反馈：连续滚动不能被上一帧的同步事件拉回，小数坐标与裁剪也不能反向回写。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createScrollSync } from '../src/components/OverlayScroll/scrollSync.ts';

for (const axis of ['scrollTop', 'scrollLeft']) {
  test(`${axis} 连续原生滚动时忽略覆盖条的延迟事件，用户反向操作仍能同步`, () => {
    const sync = createScrollSync();
    const viewport = { scrollTop: 0, scrollLeft: 0 };
    const scrollbar = { scrollTop: 0, scrollLeft: 0 };
    viewport[axis] = 20;
    sync.synchronize(viewport, scrollbar, axis);
    viewport[axis] = 35.25;
    // 覆盖条上一帧的 scroll 事件晚于内容区下一次滚动，不能把 20 写回内容区。
    sync.synchronize(scrollbar, viewport, axis);
    sync.synchronize(scrollbar, viewport, axis);
    assert.equal(viewport[axis], 35.25);
    sync.synchronize(viewport, scrollbar, axis);
    assert.equal(scrollbar[axis], 35.25);
    scrollbar[axis] = 10.5;
    sync.synchronize(scrollbar, viewport, axis);
    assert.equal(viewport[axis], 10.5);
    scrollbar[axis] = 5;
    sync.synchronize(viewport, scrollbar, axis);
    assert.equal(scrollbar[axis], 5);
    sync.synchronize(scrollbar, viewport, axis);
    assert.equal(viewport[axis], 5);
  });

  test(`${axis} 同步目标被浏览器裁剪或舍入后，不把目标坐标反馈给内容区`, () => {
    const sync = createScrollSync();
    const viewport = { scrollTop: 10.25, scrollLeft: 10.25 };
    const scrollbar = { scrollTop: 0, scrollLeft: 0 };
    let actual = 0;
    Object.defineProperty(scrollbar, axis, {
      get: () => actual,
      set: (value) => {
        actual = Math.min(9, Math.round(value));
      },
    });
    sync.align(viewport, scrollbar, axis);
    sync.synchronize(scrollbar, viewport, axis);
    assert.equal(viewport[axis], 10.25);
    assert.equal(scrollbar[axis], 9);
    scrollbar[axis] = 3;
    sync.synchronize(scrollbar, viewport, axis);
    assert.equal(viewport[axis], 3);
  });
}
