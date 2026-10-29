/** 检查页面：展示配置中心与运行时参数的对比布局，不推导真实检查结果。 */
import { ApplicationOperationWorkspace } from '@/components/ApplicationOperationWorkspace';

export default function InspectParametersPage() {
  return <ApplicationOperationWorkspace operation="inspect" />;
}
