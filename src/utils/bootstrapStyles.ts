/**
 * 协调 HTML 启动画面与 React 挂载，只管理插件标记了 data-bootstrap-stylesheet 的主样式链接。
 * 插件先将链接设为 media="print"，避免主 CSS 阻塞内联画面绘制；下载结束后恢复为 all。
 * 头部脚本负责恢复样式并记录结果，React 入口负责等待剩余链接；页面懒加载样式仍交给 Vite 管理。
 * “结束”包含加载成功和失败，完成标记只表示无需继续等待，避免 CSS 失败导致启动画面一直停留。
 */

/**
 * 在 HTML 头部同步安装资源监听后立即返回，不等待 CSS 下载，也不挂载 React。
 * 监听先于样式链接解析和 React 入口执行，避免 CSS 提前加载完成后，入口错过其 load/error 事件。
 * 构建插件通过 toString 内联本函数，必须保持无模块闭包；只能引用函数内变量和浏览器全局对象。
 */
export function startBootstrapStyles() {
  const cleanup = () => {
    // 必须同时满足：HTML 已解析完，且找不到带启动标记但尚无完成标记的链接。
    // 解析期间后面还可能出现新链接，因此当前链接全部结束也不能提前停止监听。
    if (
      document.readyState !== 'loading' &&
      !document.querySelector('link[data-bootstrap-stylesheet]:not([data-bootstrap-ready])')
    ) {
      // 移除监听需要匹配注册时的处理函数和捕获标志；保留链接及其已经应用的样式。
      document.removeEventListener('load', finish, true);
      document.removeEventListener('error', finish, true);
    }
  };
  const finish = (event: Event) => {
    const link = event.target as HTMLLinkElement | null;
    // document 会收到其他资源的事件，只处理由插件标记且尚未处理过的链接。
    if (
      link?.tagName !== 'LINK' ||
      !link.hasAttribute('data-bootstrap-stylesheet') ||
      link.dataset.bootstrapReady
    )
      return;
    // 先让 CSS 适用于屏幕，再记录完成标记；入口稍后执行时可直接跳过已结束的链接。
    // error 同样标记完成，允许应用继续启动；这不代表失败的 CSS 已经可用。
    link.media = 'all';
    link.dataset.bootstrapReady = 'true';
    cleanup();
  };
  // 资源的 load/error 不冒泡，使用捕获监听统一接收后续链接的事件，无需逐个绑定。
  document.addEventListener('load', finish, true);
  document.addEventListener('error', finish, true);
  // HTML 解析完后再检查一次，覆盖资源更早结束或没有目标链接的情况。
  // 若仍有链接在下载，则留给后续 finish 清理；once 只自动移除此 DOMContentLoaded 监听。
  document.addEventListener('DOMContentLoaded', cleanup, { once: true });
}

/**
 * React 入口在挂载前调用，返回等待所有目标链接结束的 Promise；不等待配置接口或路由请求。
 * 已有完成标记的链接直接通过，避免等待过去的事件；sheet 则兼容浏览器已创建样式表的情况。
 * 其余链接在成功或失败后均结束等待，并移除自身的两种监听；样式恢复由头部捕获监听先行处理。
 * 没有目标链接时直接通过；开发环境通常由 Vite 注入 style 标签，因此不会产生这部分等待。
 */
export function waitForBootstrapStyles(): Promise<void[]> {
  return Promise.all(
    [...document.querySelectorAll<HTMLLinkElement>('link[data-bootstrap-stylesheet]')].map(
      (link) =>
        new Promise<void>((resolve) => {
          if (link.dataset.bootstrapReady || link.sheet) {
            resolve();
            return;
          }
          const finish = () => {
            link.removeEventListener('load', finish);
            link.removeEventListener('error', finish);
            resolve();
          };
          link.addEventListener('load', finish, { once: true });
          link.addEventListener('error', finish, { once: true });
        }),
    ),
  );
}
