/** 滚动位置同步边界：标记程序写入，避免浮动条的延迟 scroll 事件反向打断内容区原生滚动。 */
export type ScrollAxis = 'scrollTop' | 'scrollLeft';

/** 只依赖滚动坐标，允许测试模拟浏览器的边界裁剪及小数像素舍入。 */
interface ScrollTarget {
  scrollTop: number;
  scrollLeft: number;
}

export function createScrollSync() {
  const writes = new WeakMap<ScrollTarget, { axis: ScrollAxis; value: number }>();

  /** 尺寸变化时也走同一写入边界；读取浏览器实际接受的坐标，兼容裁剪和舍入。 */
  function align(source: ScrollTarget, target: ScrollTarget, axis: ScrollAxis) {
    if (target[axis] === source[axis]) return;
    target[axis] = source[axis];
    writes.set(target, { axis, value: target[axis] });
  }

  function synchronize(source: ScrollTarget, target: ScrollTarget, axis: ScrollAxis) {
    const written = writes.get(source);
    // 不在消费事件时清除标记：同一位置可能有多个延迟通知，只有实际移动后才重新成为滚动源。
    if (written?.axis === axis && written.value === source[axis]) return;
    writes.delete(source);
    align(source, target, axis);
  }

  return { align, synchronize };
}
