/** 应用统一播放动效：在 Ant Design 样式生成阶段移除系统减少动态效果分支。 */
import type { Transformer } from '@ant-design/cssinjs';

/**
 * cssinjs 会逐层访问选择器和伪元素；只移除该媒体条件，保留原始动画、响应式及主题规则。
 * 使用稳定的转换器数组，覆盖 body 弹层，避免通过全局 animation 覆盖破坏组件的进入退出状态。
 */
export const appMotionTransformers: Transformer[] = [
  {
    visit(style) {
      const condition = '@media (prefers-reduced-motion: reduce)';
      if (!(condition in style)) return style;
      const result = { ...style };
      delete result[condition];
      return result;
    },
  },
];
