/** HTML 启动期兜底；序列化内联时必须显式传入格式化函数，不依赖 React 或模块闭包。 */
export function startBootstrapFailure(format: (error: unknown) => string) {
  let details = '';
  const paint = () => {
    const node = document.getElementById('bootstrap-failure-details');
    // 始终写入纯文本，异常消息可能来自接口或资源 URL，不能作为 HTML 执行。
    if (node && details) node.textContent = details;
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
  const onAction = (event: Event) => {
    if ((event.target as HTMLElement | null)?.closest?.('#bootstrap-reload'))
      window.location.reload();
  };
  const stop = () => {
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
