/** 仅识别模块或 chunk 下载失败；普通请求和渲染错误不能据此误判为部署资源失效。 */
export function isResourceError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported|module script|loading chunk|preload CSS/i.test(error.message)
  );
}
