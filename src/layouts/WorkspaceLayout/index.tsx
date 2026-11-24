import { RouteOutlet } from '@/router/loading/RouteOutlet';
import { AppHeader } from '../AppHeader';
import { WorkspaceNavigation } from './WorkspaceNavigation';
import { WorkspaceFrame } from '../LayoutFrame';

/** 所有子页面共用的外壳；页面内部是否分栏由页面自己决定。 */
export default function WorkspaceLayout() {
  return (
    <WorkspaceFrame header={<AppHeader />} navigation={<WorkspaceNavigation />}>
      <RouteOutlet layoutId="workspace" />
    </WorkspaceFrame>
  );
}
