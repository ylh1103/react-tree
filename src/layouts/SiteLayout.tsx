/** 站点入口复用基础容器，在内容区消费路由加载状态。 */
import { RouteOutlet } from '@/router/RouteOutlet';
import { AppHeader } from './AppHeader';
import { SiteFrame } from './LayoutFrame';

export default function SiteLayout() {
  return (
    <SiteFrame header={<AppHeader />}>
      <RouteOutlet layoutId="site" />
    </SiteFrame>
  );
}
