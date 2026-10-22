import { RouteOutlet } from '../router/RouteOutlet';
import { AppHeader } from './AppHeader';
import { AppNavigation } from './AppNavigation';
import { WorkspaceFrame } from './LayoutFrame';

/** 所有子页面共用的外壳；页面内部是否分栏由页面自己决定。 */
export default function AppLayout() {
  return (
    <WorkspaceFrame header={<AppHeader />} navigation={<AppNavigation />}>
      <RouteOutlet layoutId="workspace" />
    </WorkspaceFrame>
  );
}
