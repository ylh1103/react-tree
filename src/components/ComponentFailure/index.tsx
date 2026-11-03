/** 局部失败反馈提供诊断详情；渲染异常允许重试，模块加载失败保留刷新入口。 */
import { Alert, Button } from 'antd';
import { FailureDetails } from '@/components/FailureDetails';
import { isResourceError } from './resourceError';

export function ComponentFailure({
  title,
  error,
  onRetry,
  onClose,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
  onClose?: () => void;
}) {
  const resourceFailure = isResourceError(error);
  return (
    <Alert
      type="error"
      showIcon
      title={`${title}${resourceFailure ? '资源加载失败' : '暂时无法显示'}`}
      description={<FailureDetails error={error} />}
      closable={onClose && { onClose }}
      action={
        <div className="flex flex-wrap gap-2">
          {!resourceFailure && <Button onClick={onRetry}>重试</Button>}
          <Button onClick={() => window.location.reload()}>刷新页面</Button>
        </div>
      }
    />
  );
}
