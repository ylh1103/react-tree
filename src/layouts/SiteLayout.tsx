/** 站点入口与系统访问失败共用页头外壳；正常导航在内容区消费路由加载状态。 */
import type { ReactNode } from 'react';
import { RouteOutlet } from '@/router/RouteOutlet';
import { AppHeader } from './AppHeader';
import { SiteFrame } from './LayoutFrame';

export default function SiteLayout({ children }: { children?: ReactNode }) {
  return (
    <SiteFrame header={<AppHeader />}>{children ?? <RouteOutlet layoutId="site" />}</SiteFrame>
  );
}
