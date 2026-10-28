/** 环境面板尺寸模型：宽度连续跟随指针，只有达到名称窄条宽度时才进入折叠显示。 */
import type { DragResizeState } from '@/components/SplitPane/dragResize.ts';

export const collapsedEnvironmentWidth = 48;
export const defaultEnvironmentWidth = 500;
export const maximumEnvironmentWidth = 1600;

/** 当前应用内按环境保存的临时布局；重新勾选需同时恢复实际宽度、折叠前宽度和手动调宽标记。 */
export interface EnvironmentPanelLayout {
  width: number;
  collapsed: boolean;
  fixed: boolean;
  restoreWidth: number;
}

export const defaultEnvironmentPanelLayout: EnvironmentPanelLayout = {
  width: defaultEnvironmentWidth,
  collapsed: false,
  fixed: false,
  restoreWidth: defaultEnvironmentWidth,
};

/** 折叠手势从 48px 起算，展开手势从实际宽度起算；固定原点支持反向拖动，不设吸附缓冲。 */
export function resizeEnvironmentPanel(drag: DragResizeState, x: number) {
  const width = Math.max(
    collapsedEnvironmentWidth,
    Math.min(
      maximumEnvironmentWidth,
      (drag.visible ? drag.width : collapsedEnvironmentWidth) + x - drag.x,
    ),
  );
  return { width, collapsed: width === collapsedEnvironmentWidth };
}
