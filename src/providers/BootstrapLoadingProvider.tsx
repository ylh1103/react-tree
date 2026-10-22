/**
 * 管理 root 外 HTML 启动画面的交接状态，供根级等待回退和内容交接边界共享。
 * 只要 React 已提交可展示的骨架、正文或错误页，就可结束启动画面，无需等全部请求完成。
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { BootstrapLoadingContext } from '../contexts/BootstrapLoadingContext';

/**
 * initialActive 由 main 在渲染前检查 DOM 后传入，仅作为本次挂载的初始值。
 * HTML 节点由构建插件创建，本组件不接管、移动或重建其中的 SVG，以保留已有动画进度。
 */
export function BootstrapLoadingProvider({
  initialActive,
  children,
}: {
  initialActive: boolean;
  children: ReactNode;
}) {
  const [active, setActive] = useState(initialActive);
  // 保持回调和 Context 引用稳定，避免无关重渲染重新触发消费者的布局 Effect。
  const dismiss = useCallback(() => {
    // 调用方在布局 Effect 中触发：先移除外部画面，再让回退组件获知启动阶段已结束。
    // 多个交接边界可能在同次提交中调用；节点不存在及重复设置 false 都可安全处理。
    document.getElementById('bootstrap-loading')?.remove();
    setActive(false);
  }, []);
  const value = useMemo(() => ({ active, dismiss }), [active, dismiss]);
  return <BootstrapLoadingContext value={value}>{children}</BootstrapLoadingContext>;
}
