/** 内容交接边界：确认 React 已提交可展示内容后，通知 Provider 移除 root 外的 HTML 启动画面。 */
import { useContext, useLayoutEffect, type ReactNode } from 'react';
import { BootstrapLoadingContext } from '@/contexts/BootstrapLoadingContext';

/**
 * 包裹可直接展示的骨架、正文或错误页，不应包裹仍需保留启动动画的空回退。
 * 布局 Effect 在子内容提交后、浏览器绘制前执行，使移除启动画面与展示 React 内容发生在同次绘制中。
 * 多个边界或重新挂载都可能调用 dismiss，Provider 会安全处理重复调用；本组件不增加 DOM 容器。
 */
export function BootstrapLoadingHandoff({ children }: { children: ReactNode }) {
  const { dismiss } = useContext(BootstrapLoadingContext);
  useLayoutEffect(() => {
    dismiss();
  }, [dismiss]);
  return children;
}
