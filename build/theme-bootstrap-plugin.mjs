/**
 * Vite 的 HTML 主题启动插件：在 Node 开发/构建阶段生成内联脚本，浏览器收到 HTML 后立即执行。
 * 只提前设置画布、文字颜色和 color-scheme，避免等待外部 JS/CSS 时显示默认白色画布。
 * 配色取自正式主题，缓存键与校验函数和 Store 共用；完整变量及后续切换由 AppThemeProvider 管理。
 */
import { themeVariablesByMode } from '../src/styles/theme.ts';
import { bootstrapThemeKey, readThemeMode } from '../src/store/preferences/themeBootstrap.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';

/**
 * 浏览器首屏函数，源码会经 toString 内联；只能引用参数、函数内变量和浏览器全局对象。
 * 不可直接引用本模块的 import 或其他闭包变量，也不能等待网络请求或 React 挂载。
 * 只读缓存并设置最小样式，不安装系统外观监听、不写缓存，生命周期在本次同步执行后结束。
 */
function initializeTheme(readMode, key, fallback, colors) {
  try {
    let mode = fallback;
    try {
      mode = readMode(window.localStorage, key, fallback);
    } catch {
      // 获取 localStorage 本身也可能抛错，仍继续按系统主题绘制。
    }
    // 首屏脚本独立于 React 运行，只在此刻解析 system；持续跟随系统由 useResolvedTheme 负责。
    const resolved =
      mode === 'system'
        ? typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : mode;
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    root.style.setProperty('--color-canvas', colors[resolved].canvas);
    root.style.setProperty('--color-text', colors[resolved].text);
    // UnoCSS 此时可能尚未下载，所以直接设置最小根节点样式；这部分不能依赖外部工具类。
    // 背景引用变量而非固定颜色，Provider 后续更新变量时，画布也会随之变化。
    root.style.backgroundColor = 'var(--color-canvas)';
    root.style.color = 'var(--color-text)';
  } catch {
    // 首屏配色是体验增强，系统外观或 DOM 操作异常时交由应用主题接管，不向外抛错。
  }
}

/**
 * 开发返回 HTML 与生产构建共用同一注入规则，只写入首屏函数与必要数据，不复制完整插件或主题库。
 * 生成普通内联脚本而非异步脚本，使它在首次绘制前执行；脚本很小且不产生额外网络请求。
 */
export function themeBootstrapPlugin() {
  // 在 Node 阶段从完整主题中提取两种基础颜色，内联脚本只携带结果，不包含 Ant Design 主题算法。
  const colors = Object.fromEntries(
    Object.entries(themeVariablesByMode).map(([mode, variables]) => [
      mode,
      { canvas: variables['--color-canvas'], text: variables['--color-text'] },
    ]),
  );
  // JSON 编码固定配置，并转义 <，防止配置字符串中的 HTML 片段提前结束 script 标签。
  // 用户缓存是在浏览器执行时读取的，不参与 HTML 字符串拼接。
  const args = [bootstrapThemeKey, defaultUserSettings.themeMode, colors]
    .map((value) => JSON.stringify(value).replaceAll('<', '\\u003c'))
    .join(',');
  return {
    name: 'theme-bootstrap',
    transformIndexHtml: {
      // 等常规 HTML 转换完成后，再把启动标签放到头部，避免排在外部样式之后。
      order: 'post',
      handler(html) {
        return {
          // 统一生成 UTF-8 声明并放在脚本前，确保声明仍位于文档最初的 1024 字节内。
          // 将模板的标准 charset 声明移到最前面；即使模板删除该声明，下方仍会补齐。
          html: html.replace(/<meta\s+charset\s*=[^>]*>/gi, ''),
          tags: [
            { tag: 'meta', attrs: { charset: 'UTF-8' }, injectTo: 'head-prepend' },
            {
              tag: 'script',
              attrs: { id: 'theme-bootstrap' },
              // 把校验函数作为参数传给首屏函数，让内联脚本脱离模块作用域也能独立执行。
              children: `;(${initializeTheme.toString()})(${readThemeMode.toString()},${args});`,
              injectTo: 'head-prepend',
            },
          ],
        };
      },
    },
  };
}
