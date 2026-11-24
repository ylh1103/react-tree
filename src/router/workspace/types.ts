/** 路由与导航共用的定义，包含静态路由占位和动态页面入口。 */
import type { ComponentType } from 'react';
import type { LoaderFunction, ShouldRevalidateFunction } from 'react-router';
type PageModule = { default: ComponentType };

/** 路由、导航和静态骨架共用的业务定义；loader 直接引用函数，避免额外的名称映射。 */
export interface WorkspaceRouteConfig {
  id?: string;
  /** URL 匹配模式；菜单使用 generatePath 省略可选参数，直接派生入口地址。 */
  path: string;
  label: string;
  icon: string;
  bottom?: boolean;
  splitPane?: boolean;
  skeleton?: 'application';
  page?: () => Promise<PageModule>;
  loader?: LoaderFunction;
  shouldRevalidate?: ShouldRevalidateFunction;
  /** 子页面由所属工作区渲染，父页面可在操作期间保留自身状态与编辑器实例。 */
  children?: WorkspaceRouteConfig[];
}
