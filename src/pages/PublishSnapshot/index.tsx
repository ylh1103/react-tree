/** 发布页面：展示快照选择与发布前的参数对比布局，不执行真实发布。 */
import { ApplicationOperationWorkspace } from '@/components/ApplicationOperationWorkspace';

export default function PublishSnapshotPage() {
  return <ApplicationOperationWorkspace operation="publish" />;
}
