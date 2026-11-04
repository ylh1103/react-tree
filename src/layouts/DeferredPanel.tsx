/** 面板内部共用的异步边界；外壳保持挂载，下载或渲染失败不影响关闭、焦点和动画。 */
import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Skeleton } from 'antd';
import { ComponentFailure } from '@/components/ComponentFailure';

export function DeferredPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-6">
          <ComponentFailure title={title} error={error} onRetry={resetErrorBoundary} />
        </div>
      )}
    >
      <Suspense
        fallback={
          <div role="status" aria-label={`${title}加载中`} aria-busy="true" className="p-6">
            <Skeleton paragraph={{ rows: 4 }} />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
