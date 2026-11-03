/** 完整诊断界面仅在错误反馈出现时下载；详情资源也失败时仍保留原错误原因和外层恢复按钮。 */
import { lazy, Suspense } from 'react';
import type { FailureDetailsProps } from './Details';

/** 正常等待仅显示占位；整页预留与收起后的操作栏相同高度，避免替换时推动居中的主体。 */
function FailureDetailsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="min-w-0 border-0 border-t border-solid border-border-subtle pt-5"
    >
      <span className="sr-only">诊断信息加载中</span>
      <div aria-hidden="true" className="flex h-30px items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-3 w-64 max-w-full rounded-3px bg-border-subtle" />
        </div>
        <div className="flex w-112px shrink-0 justify-center">
          <div className="h-3 w-20 rounded-3px bg-border-subtle" />
        </div>
      </div>
    </div>
  );
}

/** 整页仅在详情资源加载失败时展示基本原因；局部面板继续保留原来的即时原因反馈。 */
function FailureReason({ error, variant }: FailureDetailsProps) {
  return (
    <pre
      className={`${variant === 'page' ? 'm-0' : 'mx-auto my-0 max-w-3xl'} max-h-64 overflow-auto whitespace-pre-wrap break-all text-left text-12px`}
    >
      {error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : '无法读取详情，请查看控制台'}
    </pre>
  );
}

const Details = lazy(() => import('./Details').catch(() => ({ default: FailureReason })));

export function FailureDetails({ error, variant }: FailureDetailsProps) {
  return (
    <Suspense
      fallback={
        variant === 'page' ? (
          <FailureDetailsLoading />
        ) : (
          <FailureReason error={error} variant={variant} />
        )
      }
    >
      <Details error={error} variant={variant} />
    </Suspense>
  );
}
