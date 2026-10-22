/** 加载画面的纯展示布局，供 HTML 静态生成与 React 图标回退共用；不读取 Store 或管理启动状态。 */
import type { ReactNode } from 'react';

/** children 传入实际图标；外层统一提供居中布局和读屏提示，图标本身作为装饰内容隐藏。 */
export function ResourceLoadingView({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas text-text"
      role="status"
      aria-busy="true"
    >
      <div className="flex h-16 w-16 items-center justify-center text-64px" aria-hidden="true">
        {children}
      </div>
      <span className="text-13px">资源加载中…</span>
    </div>
  );
}
