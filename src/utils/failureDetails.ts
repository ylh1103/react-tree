/** 诊断文本只读取明确的错误字段；字段读取彼此隔离，cause/聚合错误有界展开，预览限制由界面负责，这里仅保留极端数据保护，省略与截断必须可见。 */
/** 统一的异常诊断文本（并非原对象的全量序列化），不读取请求配置、响应正文或其他任意字段。 */
export function formatFailureDetails(error: unknown): string {
  // 构建插件将本函数序列化到启动 HTML，常量和辅助函数必须留在函数内，不能依赖模块闭包。
  const MAX_TEXT_LENGTH = 262144;
  const MAX_DEPTH = 32;
  const MAX_NODES = 2000;
  const ancestors = new Set<unknown>();
  let text = '';
  let truncated = false;
  let nodes = 0;
  let exhausted = false;
  function append(value: string) {
    if (truncated) return;
    const separator = text ? '\n' : '';
    const remaining = MAX_TEXT_LENGTH - text.length - separator.length;
    if (remaining < 0) {
      truncated = true;
      return;
    }
    text += separator + value.slice(0, remaining);
    if (value.length > remaining) truncated = true;
  }
  function read(value: object, key: string): unknown {
    try {
      return (value as Record<string, unknown>)[key];
    } catch {
      append(`[无法读取异常字段 ${key}]`);
      return undefined;
    }
  }
  function describe(value: unknown, depth: number) {
    if (truncated || exhausted) return;
    if (nodes >= MAX_NODES) {
      append(`[诊断异常节点超过 ${MAX_NODES} 项，已触及提取保护上限，其余已省略]`);
      exhausted = true;
      return;
    }
    nodes++;
    if (depth > MAX_DEPTH) {
      append(`[原因深度超过 ${MAX_DEPTH} 层，已触及提取保护上限，后续内容已省略]`);
      return;
    }
    if (value == null) {
      append('未提供具体失败原因');
      return;
    }
    if (typeof value !== 'object' && typeof value !== 'function') {
      append(String(value) || '未提供具体失败原因');
      return;
    }
    if (ancestors.has(value)) {
      append('[循环原因]');
      return;
    }
    ancestors.add(value);
    try {
      const message = read(value, 'message');
      const stack = read(value, 'stack');
      if (typeof stack === 'string' && stack) {
        if (typeof message === 'string' && message && !stack.includes(message)) append(message);
        append(stack);
      } else if (typeof message === 'string' && message) {
        const name = read(value, 'name');
        append(typeof name === 'string' && name ? `${name}: ${message}` : message);
      } else {
        append('未提供具体失败原因');
      }
      for (const key of ['status', 'code']) {
        if (truncated) break;
        const field = read(value, key);
        if (typeof field === 'string' || typeof field === 'number') append(`${key}: ${field}`);
      }
      if (truncated || exhausted) return;
      const cause = read(value, 'cause');
      if (cause != null) {
        append('原因：');
        describe(cause, depth + 1);
      }
      if (truncated || exhausted) return;
      const errors = read(value, 'errors');
      if (errors != null) {
        // 仅处理数组，不执行用户自定义迭代器；兼容跨 realm AggregateError，无需 instanceof。
        if (Array.isArray(errors)) {
          const length = read(errors, 'length');
          if (typeof length === 'number' && Number.isSafeInteger(length) && length >= 0) {
            for (let index = 0; index < length && !truncated && !exhausted; index++) {
              append(`聚合异常 ${index + 1}：`);
              describe(read(errors, String(index)), depth + 1);
            }
          } else if (length !== undefined) {
            append('[聚合异常数组长度无效，未展开]');
          }
        } else {
          append('[聚合异常 errors 不是数组，未展开]');
        }
      }
    } catch {
      // 如 revoked Proxy 连 Array.isArray 都可能抛错，保留已提取内容并追加明确提示。
      append('[无法读取异常详情，请查看浏览器控制台]');
    } finally {
      ancestors.delete(value);
    }
  }
  describe(error, 0);
  if (truncated) {
    const notice = `\n[诊断文本超过 ${MAX_TEXT_LENGTH} 字符，已触及提取保护上限，后续内容已截断；复制内容同样受此保护上限约束]`;
    return text.slice(0, MAX_TEXT_LENGTH - notice.length) + notice;
  }
  return text;
}
