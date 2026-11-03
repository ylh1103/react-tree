/** 诊断内容按整页与局部场景展示；堆栈按需展开，整页和局部面板均提供独立的复制反馈。 */
import { Button } from 'antd';
import { useEffect, useId, useState } from 'react';
import { formatFailureDetails } from '@/utils/failureDetails';
import { StackTrace } from './StackTraceView';

/** page 将完整堆栈放进折叠诊断区；inline 保留面板内的复制与展开操作。 */
export interface FailureDetailsProps {
  error: unknown;
  variant?: 'inline' | 'page';
}

export default function Details({ error, variant = 'inline' }: FailureDetailsProps) {
  const text = formatFailureDetails(error);
  if (variant === 'page') return <PageDetails error={error} text={text} />;
  return <InlineDetails error={error} text={text} />;
}

/** 错误摘要直接作为折叠入口，减少重复标题；堆栈随内容撑开，仅由整页负责纵向滚动。 */
function PageDetails({ error, text }: { error: unknown; text: string }) {
  const detailsId = useId();
  const [expanded, setExpanded] = useState(false);
  const [raw, setRaw] = useState(false);
  // 反馈绑定当前错误，错误切换后不显示旧结果；剪贴板不可用时仍可展开手动复制。
  const [feedback, setFeedback] = useState<{
    error: unknown;
    status: 'success' | 'failure';
  } | null>(null);
  const status = feedback && feedback.error === error ? feedback.status : null;
  const message =
    status === 'success'
      ? '已复制错误信息'
      : status === 'failure'
        ? '复制失败，请展开详情手动复制'
        : '';
  // 摘要只做视觉省略，悬停、展开与复制仍能读取完整诊断文本。
  const summary = text.split('\n')[0];
  // 成功提示留在原按钮内并自动恢复；重复复制重置计时，错误切换或卸载时清理。
  useEffect(() => {
    if (!feedback || feedback.error !== error || feedback.status !== 'success') return;
    const timer = window.setTimeout(() => setFeedback(null), 2000);
    return () => window.clearTimeout(timer);
  }, [feedback, error]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback({ error, status: 'success' });
    } catch {
      setFeedback({ error, status: 'failure' });
    }
  };
  return (
    <div className="min-w-0 border-0 border-t border-solid border-border-subtle pt-5 text-left text-text">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          size="small"
          aria-label={`${expanded ? '收起诊断详情' : '查看诊断详情'}：${summary}`}
          aria-expanded={expanded}
          aria-controls={expanded ? detailsId : undefined}
          title={summary}
          classNames={{ content: 'min-w-0 flex-1 text-left' }}
          onClick={() => {
            setExpanded(!expanded);
            setRaw(false);
          }}
          className="h-30px! min-w-0! flex-1! justify-start! px-0! py-0! text-left! text-13px! leading-6! text-text-secondary! layout-focus"
          icon={
            <span
              aria-hidden="true"
              className={
                expanded ? 'i-lucide:chevron-down text-14px' : 'i-lucide:chevron-right text-14px'
              }
            />
          }
        >
          <span className="block truncate">{summary}</span>
        </Button>
        <div className="flex shrink-0 items-center gap-2">
          {expanded && (
            <Button
              type="text"
              size="small"
              aria-pressed={raw}
              onClick={() => setRaw(!raw)}
              className="h-30px! w-80px! px-0! py-0! text-12px! text-text-secondary! layout-focus"
            >
              {raw ? '格式化展示' : '查看原文'}
            </Button>
          )}
          <Button
            type="text"
            size="small"
            onClick={() => void copy()}
            title={message || '复制错误信息'}
            className={`h-30px! w-112px! shrink-0! px-0! py-0! text-12px! layout-focus ${status === 'success' ? 'text-accent!' : 'text-text-secondary!'}`}
            icon={
              <span
                aria-hidden="true"
                className={`${status === 'success' ? 'i-lucide:check' : status === 'failure' ? 'i-lucide:circle-alert' : 'i-lucide:copy'} text-13px`}
              />
            }
          >
            {status === 'success' ? '已复制' : status === 'failure' ? '复制失败' : '复制错误信息'}
          </Button>
        </div>
      </div>
      <span role="status" className="sr-only">
        {message}
      </span>
      {expanded && <StackTrace id={detailsId} text={text} raw={raw} />}
    </div>
  );
}

/** 轻量局部错误继续沿用原交互，不因整页样式调整改变关闭、重试或复制行为。 */
function InlineDetails({ error, text }: { error: unknown; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<{ error: unknown; message: string } | null>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback({ error, message: '已复制' });
    } catch {
      setFeedback({ error, message: '复制失败，请手动选择文本' });
    }
  };
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl text-left text-text">
      <p className="m-0 break-all text-12px leading-6">
        失败原因：{text.split('\n')[0].slice(0, 500)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="small"
          type="link"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '收起详情' : '展开详情'}
        </Button>
        <Button size="small" type="link" onClick={() => void copy()}>
          复制详情
        </Button>
        <span role="status" className="text-12px">
          {feedback && feedback.error === error ? feedback.message : ''}
        </span>
      </div>
      {expanded && (
        <pre className="m-0 max-h-64 overflow-auto whitespace-pre-wrap break-all text-12px leading-5">
          {text}
        </pre>
      )}
    </div>
  );
}
