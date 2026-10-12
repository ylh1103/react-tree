import type { ComponentType } from 'react';

/** 默认导出的页面按路由加载，布局外壳保持稳定。 */
export function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default });
}

/** 尚未实现的工作区共用页面，保留各自标题和分栏设置。 */
export function lazyWorkspace(title: string, splitPane = false) {
  return async () => {
    const { default: LayoutPage } = await import('../pages/LayoutPage');
    return { Component: () => <LayoutPage title={title} splitPane={splitPane} /> };
  };
}
