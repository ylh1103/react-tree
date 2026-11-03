import type { parseStackTrace } from '../components/FailureDetails/parseStackTrace.ts';
import type { getDiagnosticPreview } from '../components/FailureDetails/preview.ts';

/** HTML 启动期兜底；格式化、解析及预览函数显式注入，序列化内联后不依赖 React 或模块闭包。 */
export function startBootstrapFailure(
  format: (error: unknown) => string,
  parse: typeof parseStackTrace,
  preview: typeof getDiagnosticPreview,
) {
  let details = '';
  let expanded = false;
  let raw = false;
  let batches = 1;
  let stopped = false;
  let copyVersion = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const get = (name: string) => document.getElementById(`bootstrap-${name}`);
  const element = (tag: string, className: string, text?: string) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const paint = () => {
    const node = get('failure-details');
    // 始终写入纯文本，异常消息可能来自接口或资源 URL，不能作为 HTML 执行。
    if (!details) return;
    const summary = details.split('\n')[0];
    const label = get('summary');
    if (label) label.textContent = summary;
    const toggle = get('toggle');
    toggle?.setAttribute('title', summary);
    toggle?.setAttribute('aria-expanded', String(expanded));
    toggle?.setAttribute('aria-label', `${expanded ? '收起诊断详情' : '查看诊断详情'}：${summary}`);
    if (toggle) toggle.dataset.expanded = String(expanded);
    const region = get('diagnostic');
    if (region) region.hidden = !expanded;
    const mode = get('raw');
    if (mode) {
      mode.hidden = !expanded;
      mode.textContent = raw ? '格式化展示' : '查看原文';
      mode.setAttribute('aria-pressed', String(raw));
    }
    const part = preview(details, batches);
    const more = get('more');
    if (more) more.hidden = !part.hasMore;
    if (!node) return;
    node.replaceChildren();
    if (!expanded) return;
    const textClass =
      'm-0 whitespace-pre-wrap font-mono text-12px leading-6 text-text-secondary [overflow-wrap:anywhere]';
    const showText = () => node.append(element('pre', textClass, part.text));
    if (raw) return showText();
    try {
      const list = element('ol', 'm-0 list-none p-0 font-mono text-12px leading-6');
      for (const [index, entry] of parse(part.text).entries()) {
        const item = element('li', index ? 'mt-1' : '');
        if (entry.kind === 'frame') {
          const row = element(
            'div',
            `grid gap-x-6 border-0 border-l-2 border-solid px-3 py-1.5 desktop:grid-cols-[230px_minmax(0,1fr)] ${entry.project ? 'border-accent bg-canvas' : 'border-transparent'}`,
          );
          row.title = entry.raw.trim();
          row.append(
            element(
              'div',
              `${entry.project ? 'font-600 text-text' : 'text-text-secondary'} [overflow-wrap:anywhere]`,
              entry.name,
            ),
            element('div', 'text-text-secondary [overflow-wrap:anywhere]', entry.location),
          );
          item.append(row);
        } else item.append(element('pre', `${textClass} px-3 py-1`, entry.raw || '\u00a0'));
        list.append(item);
      }
      node.append(list);
    } catch {
      node.append(
        element('p', 'mb-2 mt-0 text-12px text-text-secondary', '格式化失败，已显示诊断原文'),
      );
      showText();
    }
  };
  const fail = (error: unknown) => {
    if (!details) details = format(error);
    document.documentElement.dataset.bootstrapFailed = 'true';
    paint();
  };
  // 仅在首次交接前处理模块资源和未捕获执行异常，普通图片失败不阻断应用。
  const onError = (event: Event) => {
    const target = event.target as HTMLScriptElement | null;
    if (target?.tagName === 'SCRIPT' && target.getAttribute('type') === 'module') {
      fail(
        `模块脚本加载失败：${target.src || '未知资源地址'}\n浏览器未提供具体原因，请在 Network 中检查请求状态。`,
      );
    } else if (event instanceof ErrorEvent && event.message) {
      fail(
        event.error ??
          `${event.message}\n${event.filename || ''}:${event.lineno || 0}:${event.colno || 0}`,
      );
    }
  };
  const onRejection = (event: PromiseRejectionEvent) => fail(event.reason);
  const feedback = (message: string, status: string) => {
    const button = get('copy');
    if (button) {
      button.dataset.status = status;
      button.title = message;
    }
    const label = get('copy-label');
    if (label)
      label.textContent =
        status === 'success' ? '已复制' : status === 'failure' ? '复制失败' : '复制错误信息';
    const live = get('copy-status');
    if (live) live.textContent = message;
  };
  const copy = async () => {
    const version = ++copyVersion;
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(details);
      if (stopped || version !== copyVersion) return;
      feedback('已复制错误信息', 'success');
      timer = setTimeout(() => feedback('', ''), 2000);
    } catch {
      if (!stopped && version === copyVersion) feedback('复制失败，请展开详情手动复制', 'failure');
    }
  };
  const onAction = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('#bootstrap-reload')) return window.location.reload();
    if (target?.closest?.('#bootstrap-copy')) return void copy();
    if (target?.closest?.('#bootstrap-toggle')) {
      expanded = !expanded;
      raw = false;
      batches = 1;
    } else if (target?.closest?.('#bootstrap-raw')) raw = !raw;
    else if (target?.closest?.('#bootstrap-next')) batches++;
    else return;
    paint();
  };
  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    window.removeEventListener('error', onError, { capture: true });
    window.removeEventListener('unhandledrejection', onRejection);
    document.removeEventListener('DOMContentLoaded', paint);
    document.removeEventListener('click', onAction);
    document.removeEventListener('app:bootstrap-complete', stop);
    delete document.documentElement.dataset.bootstrapFailed;
  };
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onRejection);
  // 错误可能早于 body 解析，保留首次原因，在静态详情节点出现后补写。
  document.addEventListener('DOMContentLoaded', paint, { once: true });
  document.addEventListener('click', onAction);
  document.addEventListener('app:bootstrap-complete', stop);
}
