/** 堆栈展示适配：参考 stacktrace-parser 的多格式分支思路，保留逐行原文，不过滤未知行或改写 eval 上下文。 */
export type StackTraceLine =
  | { kind: 'text'; raw: string }
  | { kind: 'frame'; raw: string; name: string; location: string; project: boolean };

/** 支持常见浏览器源位置；辅助函数内聚，供构建插件序列化复用，静态页与 React 使用同一解析规则。 */
export function parseStackTrace(text: string): StackTraceLine[] {
  /** 已知浏览器/Node 源位置；不把任意“字段:数字”当作文件位置。 */
  function isSource(source: string): boolean {
    return /^(?:(?:https?|file|blob|webpack(?:-internal)?|rsc|node|ms-appx|chrome(?:-extension)?|resource):|\/|[A-Za-z]:\\|\\\\|\.{1,2}\/|<anonymous>|[^\s:]+\.(?:[cm]?js|jsx|tsx?|vue|svelte):)/i.test(
      source,
    );
  }

  /** 只移除本地开发 origin，查询串与 hash 按原字节保留，不通过 URL 重新序列化。 */
  function formatLocation(source: string): { location: string; project: boolean } {
    const location = source.replace(
      /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?=\/)/i,
      '',
    );
    const file = location.replace(/:\d+(?::\d+)?$/, '').split(/[?#]/, 1)[0];
    const dependency = /(?:^|[/\\])(?:node_modules|\.vite)(?:[/\\]|$)/.test(file);
    const remote = /^(?:https?|blob|chrome(?:-extension)?|resource|ms-appx):/i.test(file);
    const project = !remote && !dependency && /(?:^|[/\\])src[/\\]/.test(file);
    return {
      location:
        location.startsWith('/src/') || location.startsWith('/node_modules/')
          ? location.slice(1)
          : location,
      project,
    };
  }

  // 复杂/超长调用原样展示，避免错误推断和正则开销。
  return text.split('\n').map((raw) => {
    if (raw.length > 4096 || /\beval\b|\[native code\]|\(native\)/.test(raw))
      return { kind: 'text', raw };
    const line = raw.trim();
    let name = '';
    let source = '';
    if (line.startsWith('at ')) {
      const body = line.slice(3).trim();
      const named = /^(.*?)\s+\((.+)\)$/.exec(body);
      name = named?.[1] ?? '';
      source = named?.[2] ?? body;
    } else {
      const separator = line.indexOf('@');
      name = separator >= 0 ? line.slice(0, separator) : '';
      source = separator >= 0 ? line.slice(separator + 1) : line;
    }
    if (!isSource(source) || !/:\d+(?::\d+)?$/.test(source)) return { kind: 'text', raw };
    return { kind: 'frame', raw, name: name || '匿名调用', ...formatLocation(source) };
  });
}

/** 展示转换的最后防线：解析器意外抛错时整段回退原文，调用者始终可显示和复制诊断文本。 */
export function safelyParseStackTrace(text: string): { lines: StackTraceLine[]; failed: boolean } {
  try {
    return { lines: parseStackTrace(text), failed: false };
  } catch {
    return { lines: [{ kind: 'text', raw: text }], failed: true };
  }
}
