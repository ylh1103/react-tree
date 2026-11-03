/** 用户面板共用的异步边界：加载或渲染失败均可关闭；关闭保留边界状态和子组件动画生命周期。 */
import { Suspense, useEffect, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Alert } from 'antd';
import { ComponentFailure } from '@/components/ComponentFailure';

interface PanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
}

/** 等待或失败时也支持 Escape；仅在反馈可见时监听，正常面板继续使用自身的键盘交互。 */
function PanelFeedback({
  title,
  onClose,
  failure,
}: Omit<PanelProps, 'open'> & {
  failure?: { error: unknown; onRetry: () => void };
}) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);
  return (
    <div className="fixed right-4 top-16 z-1300 w-360px max-w-[calc(100vw_-_32px)]">
      {failure ? (
        <ComponentFailure
          title={title}
          error={failure.error}
          onRetry={failure.onRetry}
          onClose={onClose}
        />
      ) : (
        <Alert
          role="status"
          type="info"
          showIcon
          title={`正在加载${title}…`}
          closable={{ onClose }}
        />
      )}
    </div>
  );
}

export function DeferredPanel({
  open,
  title,
  onClose,
  children,
}: PanelProps & { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) =>
        open ? (
          <PanelFeedback
            title={title}
            onClose={onClose}
            failure={{ error, onRetry: resetErrorBoundary }}
          />
        ) : null
      }
    >
      <Suspense fallback={open ? <PanelFeedback title={title} onClose={onClose} /> : null}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
