/**
 * HTML 启动画面插件：在开发服务器或生产构建中渲染现有 SVG，并生成对应的 UnoCSS 内联样式。
 * 浏览器收到 HTML 后即可选择缓存中的图标，不必等 React 资源下载完成。
 * 插件负责注入画面和样式监听；React 提交骨架、正文或错误页后，由交接组件移除画面。
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

/** 开发与生产共用注入规则；静态画面和样式在插件创建时生成，后续 HTML 转换复用结果。 */
export function loadingBootstrapPlugin() {
  const markup = renderBootstrapLoading();
  // 这里只序列化项目内的固定配置；转义 <，避免配置文本意外提前闭合 script 标签。
  const args = [bootstrapLoadingKey, loadingStyleIds, defaultUserSettings.loadingStyle]
    .map((value) => JSON.stringify(value).replaceAll('<', '\\u003c'))
    .join(',');
  // React 会把 class 内的 & 转义为实体，提取工具类前恢复，保证祖先属性变体与真实 DOM 一致。
  // 不生成 preflight，避免为临时画面重复注入会影响整个页面的基础样式。
  const css = createGenerator(unoConfig).then((uno) =>
    uno.generate(markup.replaceAll('&amp;', '&'), { preflights: false }),
  );
  return {
    name: 'loading-bootstrap',
    transformIndexHtml: {
      // 生产主样式链接由 Vite 注入；在常规转换之后处理，才能把这些链接纳入启动等待。
      order: 'post',
      async handler(html) {
        return {
          html: html
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
          tags: [
            {
              tag: 'script',
              attrs: { id: 'loading-bootstrap' },
              children: `;(${initializeLoading.toString()})(${readLoadingStyle.toString()},${args});(${startBootstrapStyles.toString()})();`,
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
