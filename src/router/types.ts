/** 路由与导航共用的业务定义；页面数据骨架及其布局参数由懒加载模块自行维护。 */
import type { ComponentType } from 'react';
import type { LoaderFunction, ShouldRevalidateFunction } from 'react-router';
type PageModule = { default: ComponentType };

/** 路由、导航和静态骨架共用的业务定义；loader 直接引用函数，避免额外的名称映射。 */
export interface WorkspaceRouteConfig {
  /** URL 匹配模式；菜单使用 generatePath 省略可选参数，直接派生入口地址。 */
  path: string;
  label: string;
  icon: string;
  bottom?: boolean;
  splitPane?: boolean;
  page?: () => Promise<PageModule>;
  loader?: LoaderFunction;
  shouldRevalidate?: ShouldRevalidateFunction;
}
