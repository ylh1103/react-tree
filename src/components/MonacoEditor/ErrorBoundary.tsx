/** 两类编辑器共享局部容错：保留原尺寸和外层草稿，切换模型后解除旧文档的失败状态。 */
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ComponentFailure } from '@/components/ComponentFailure';

export function EditorErrorBoundary({
  children,
  width = '100%',
  height = 400,
  modelKeys,
}: {
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  modelKeys: unknown[];
}) {
  return (
    <ErrorBoundary
      resetKeys={modelKeys}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div style={{ width, height }} className="box-border overflow-auto p-4">
          <ComponentFailure title="编辑器" error={error} onRetry={resetErrorBoundary} />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
