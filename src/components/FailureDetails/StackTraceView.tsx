/** 整页堆栈的只读调用列表：突出可识别的项目代码，其他调用降低视觉权重，所有文本均由 React 转义。 */
import { Button } from 'antd';
import { useState } from 'react';
import { safelyParseStackTrace } from './parseStackTrace';
import { getDiagnosticPreview } from './preview';

/** raw 由外层诊断操作栏控制，内容组件仅维护分批预览进度。 */
export function StackTrace({ text, id, raw = false }: { text: string; id: string; raw?: boolean }) {
  // 将预览进度绑定文本，切换异常时自动从首批开始，不用 Effect 维护派生状态。
  const [progress, setProgress] = useState<{ text: string; batches: number } | null>(null);
  const batches = progress?.text === text ? progress.batches : 1;
  const preview = getDiagnosticPreview(text, batches);
  const result = raw ? null : safelyParseStackTrace(preview.text);
  const showRaw = raw || result?.failed;
  return (
    <div
      id={id}
      role="region"
      aria-label="错误诊断信息"
      className="mt-4 rounded-8px border border-solid border-border-subtle bg-surface p-4 desktop:p-5"
    >
      {result?.failed && (
        <p role="status" className="mb-2 mt-0 text-12px text-text-secondary">
          格式化失败，已显示诊断原文
        </p>
      )}
      {showRaw ? (
        <pre className="m-0 whitespace-pre-wrap font-mono text-12px leading-6 text-text-secondary [overflow-wrap:anywhere]">
          {preview.text}
        </pre>
      ) : (
        <ol className="m-0 list-none p-0 font-mono text-12px leading-6">
          {result?.lines.map((entry, index) => (
            <li key={`${index}:${entry.raw}`} className={index ? 'mt-1' : ''}>
              {entry.kind === 'frame' ? (
                <div
                  className={`grid gap-x-6 border-0 border-l-2 border-solid px-3 py-1.5 desktop:grid-cols-[230px_minmax(0,1fr)] ${entry.project ? 'border-accent bg-canvas' : 'border-transparent'}`}
                  title={entry.raw.trim()}
                >
                  <div className={entry.project ? 'font-600 text-text' : 'text-text-secondary'}>
                    <span className="[overflow-wrap:anywhere]">{entry.name}</span>
                  </div>
                  <div className="text-text-secondary [overflow-wrap:anywhere]">
                    {entry.location}
                  </div>
                </div>
              ) : (
                <pre className="m-0 whitespace-pre-wrap px-3 py-1 font-mono text-12px leading-6 text-text-secondary [overflow-wrap:anywhere]">
                  {entry.raw || '\u00a0'}
                </pre>
              )}
            </li>
          ))}
        </ol>
      )}
      {preview.hasMore && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-0 border-t border-solid border-border-subtle pt-3 text-12px text-text-secondary">
          <span>当前仅预览部分内容，复制将包含全部已提取诊断文本。</span>
          <Button
            type="link"
            size="small"
            onClick={() => setProgress({ text, batches: batches + 1 })}
            className="px-0! text-12px! layout-focus"
          >
            继续显示
          </Button>
        </div>
      )}
    </div>
  );
}
