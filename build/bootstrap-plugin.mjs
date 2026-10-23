/**
 * HTML 启动插件：统一注入字符集、主题、加载画面和首屏样式交接，避免配置层依赖两个插件的先后顺序。
 * 主题与图标初始化各自独立，只复用正式配置和校验函数；React 接管后仍由原 Provider 管理生命周期。
 */
import { createGenerator } from 'unocss';
import unoConfig from '../uno.config.ts';
import { renderBootstrapLoading } from './loading-bootstrap-view.tsx';
import {
  bootstrapLoadingKey,
  readLoadingStyle,
} from '../src/store/preferences/loadingBootstrap.ts';
import { loadingStyleIds } from '../src/types/loading.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';
import { startBootstrapStyles } from '../src/utils/bootstrapStyles.ts';
import { themeVariablesByMode } from '../src/styles/theme.ts';
import { bootstrapThemeKey, readThemeMode } from '../src/store/preferences/themeBootstrap.ts';

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
 * 浏览器头部脚本：读取经过白名单校验的方案，在 HTML 解析出图标前设置显示条件。
 * 本函数通过 toString 写入 HTML，只能引用参数和浏览器全局对象，不能引用模块中的 import。
 * 缓存仅用于选择本次启动图标；不读取服务端配置，也不把回退值写回存储。
 */
function initializeLoading(readStyle, key, allowed, fallback) {
  let style = fallback;
  try {
    style = readStyle(window.localStorage, key, allowed, fallback);
  } catch {
    // 获取存储对象本身也可能失败，使用默认图标。
  }
  document.documentElement.dataset.bootstrapLoadingStyle = style;
}

/** 只序列化构建时固定配置；转义 <，防止配置文本提前闭合 script 标签，用户缓存不参与拼接。 */
function serializeArguments(values) {
  return values.map((value) => JSON.stringify(value).replaceAll('<', '\\u003c')).join(',');
}

/** 从正式主题提取最小配色，校验函数作为参数内联，避免脚本依赖模块作用域或携带完整主题库。 */
function createThemeScript() {
  const colors = Object.fromEntries(
    Object.entries(themeVariablesByMode).map(([mode, variables]) => [
      mode,
      { canvas: variables['--color-canvas'], text: variables['--color-text'] },
    ]),
  );
  const args = serializeArguments([bootstrapThemeKey, defaultUserSettings.themeMode, colors]);
  return `;(${initializeTheme.toString()})(${readThemeMode.toString()},${args});`;
}

/** 在图标与样式链接解析前选择缓存方案并安装样式监听，与主题脚本分别执行以保持异常隔离。 */
function createLoadingScript() {
  const args = serializeArguments([
    bootstrapLoadingKey,
    loadingStyleIds,
    defaultUserSettings.loadingStyle,
  ]);
  return `;(${initializeLoading.toString()})(${readLoadingStyle.toString()},${args});(${startBootstrapStyles.toString()})();`;
}

/** 开发与生产共用一次 HTML 转换；静态画面、内联脚本和 UnoCSS 在插件创建时生成，后续转换复用。 */
export function bootstrapPlugin() {
  const markup = renderBootstrapLoading();
  const themeScript = createThemeScript();
  const loadingScript = createLoadingScript();
  // React 会把 class 内的 & 转义为实体，提取工具类前恢复，保证祖先属性变体与真实 DOM 一致。
  // 不生成 preflight，避免为临时画面重复注入会影响整个页面的基础样式。
  const css = createGenerator(unoConfig).then((uno) =>
    uno.generate(markup.replaceAll('&amp;', '&'), { preflights: false }),
  );
  return {
    name: 'html-bootstrap',
    transformIndexHtml: {
      // 生产主样式链接由 Vite 注入；在常规转换之后处理，才能把这些链接纳入启动等待。
      order: 'post',
      async handler(html) {
        return {
          html: html
            // 统一在头部最前面补齐 UTF-8 声明，避免大段内联内容将其推到文档最初的 1024 字节之外。
            .replace(/<meta\s+charset\s*=[^>]*>/gi, '')
            // 入口模板保留空的 root；把画面插在其后，使 createRoot 提交时不会重建正在播放的 SVG。
            .replace(/(<div\b[^>]*\bid=["']root["'][^>]*>)\s*(<\/div>)/i, `$1$2${markup}`)
            // 普通 stylesheet 会阻塞首屏绘制；先用 print 下载，由头部捕获监听在成功或失败后切回 all。
            // data-bootstrap-stylesheet 同时供监听器和入口识别，只等待这些被改写的链接。
            // 显式声明媒体条件的模板链接不改写；后续动态插入的懒加载样式仍由 Vite 管理。
            .replace(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi, (tag) =>
              /\bmedia\s*=/i.test(tag)
                ? tag
                : tag.replace(/\s*\/?>$/, ' media="print" data-bootstrap-stylesheet>'),
            ),
          // 在同一批标签内固定顺序：字符集 → 最小配色 → 图标选择和样式监听 → 图标样式。
          // 保留两个普通同步脚本及原有 ID，使主题异常不阻断图标初始化，并兼容现有定位与验证。
          tags: [
            { tag: 'meta', attrs: { charset: 'UTF-8' }, injectTo: 'head-prepend' },
            {
              tag: 'script',
              attrs: { id: 'theme-bootstrap' },
              children: themeScript,
              injectTo: 'head-prepend',
            },
            {
              tag: 'script',
              attrs: { id: 'loading-bootstrap' },
              children: loadingScript,
              injectTo: 'head-prepend',
            },
            {
              tag: 'style',
              attrs: { id: 'loading-bootstrap-style' },
              children: (await css).css,
              injectTo: 'head-prepend',
            },
          ],
        };
      },
    },
  };
}
