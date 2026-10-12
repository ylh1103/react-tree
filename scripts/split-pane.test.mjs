import assert from 'node:assert/strict';
import test from 'node:test';
import { dragResize } from '../src/components/SplitPane/dragResize.ts';

const initial = { x: 340, width: 340, visible: true, pointerId: 1 };

test('minimum width has a half-minimum collapse buffer', () => {
  assert.equal(dragResize(initial, 240, 260, 640).width, 260);
  assert.equal(dragResize(initial, 131, 260, 640).visible, true);
  assert.equal(dragResize(initial, 130, 260, 640).visible, true);
  const collapsed = dragResize(initial, 129, 260, 640);
  assert.equal(collapsed.visible, false);
  assert.equal(collapsed.width, 340);
});

test('same gesture reopens at its original snap point without resetting the origin', () => {
  const collapsed = dragResize(initial, 100, 260, 640);
  assert.equal(dragResize(collapsed.drag, 129, 260, 640).visible, false);
  const reopened = dragResize(collapsed.drag, 130, 260, 640);
  assert.equal(reopened.visible, true);
  assert.equal(reopened.width, 260);
  assert.equal(reopened.drag, initial);
  assert.equal(dragResize(reopened.drag, 259, 260, 640).width, 260);
  assert.equal(dragResize(reopened.drag, 300, 260, 640).width, 300);
});

test('hidden panel opens at minimum width and then follows the pointer', () => {
  const hidden = { x: 0, width: 340, visible: false, pointerId: 2 };
  assert.equal(dragResize(hidden, 129, 260, 640).visible, false);
  const opened = dragResize(hidden, 130, 260, 640);
  assert.equal(opened.width, 260);
  assert.equal(dragResize(opened.drag, 300, 260, 640).width, 300);
  assert.equal(dragResize(opened.drag, 129, 260, 640).visible, false);
  assert.equal(dragResize(hidden, 129, 260, 640).width, 340);
  assert.equal(dragResize(hidden, 60, 120, 120).width, 120);
  assert.equal(dragResize(hidden, 48, 0, 0).visible, false);
  assert.equal(dragResize(initial, 1000, 260, 640).width, 640);
});

test('threshold follows the minimum width instead of a fixed distance', () => {
  const hidden = { x: 0, width: 400, visible: false, pointerId: 3 };
  assert.equal(dragResize(hidden, 159, 320, 640).visible, false);
  assert.equal(dragResize(hidden, 160, 320, 640).visible, true);
  const visible = { ...hidden, visible: true };
  assert.equal(dragResize(visible, -239, 320, 640).visible, true);
  assert.equal(dragResize(visible, -240, 320, 640).visible, true);
  assert.equal(dragResize(visible, -241, 320, 640).visible, false);
});

test('large skipped moves and repeated reversals have the same result as small moves', () => {
  let drag = initial;
  for (const x of [50, 500, 0, 340, 1000, 100, 280]) {
    const next = dragResize(drag, x, 260, 640);
    assert.deepEqual(next, dragResize(initial, x, 260, 640));
    drag = next.drag;
  }
});

test('snap coordinates are relative to the separator rather than the viewport', () => {
  const offset = { ...initial, x: 840 };
  assert.equal(dragResize(offset, 629, 260, 640).visible, false);
  assert.equal(dragResize(offset, 630, 260, 640).visible, true);
  assert.equal(dragResize(offset, 800, 260, 640).width, 300);
  const hidden = { ...offset, visible: false };
  assert.equal(dragResize(hidden, 969, 260, 640).visible, false);
  assert.equal(dragResize(hidden, 970, 260, 640).width, 260);
  assert.equal(dragResize(hidden, 1140, 260, 640).width, 300);
});
