/** 创建快照页面：展示配置与待创建快照的对比布局，实际写入待业务接口接入。 */
import { ApplicationOperationWorkspace } from '@/components/ApplicationOperationWorkspace';

export default function CreateSnapshotPage() {
  return <ApplicationOperationWorkspace operation="snapshot" />;
}
