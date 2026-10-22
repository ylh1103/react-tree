/**
 * 在等待回退与内容交接边界之间共享 HTML 启动画面的生命周期，不代表路由或配置请求是否完成。
 * 状态从启动时的 active 变为 false 后不再恢复，后续页面加载使用各自的骨架或 React 图标。
 */
import { createContext } from 'react';

export const BootstrapLoadingContext = createContext({
  /** 是否仍由 root 外的 HTML 画面提供加载提示；默认 false，兼容未安装 Provider 的独立渲染。 */
  active: false,
  /** 由交接边界在布局 Effect 中调用，移除 HTML 画面并结束启动阶段；默认实现不操作 DOM。 */
  dismiss: () => {},
});
