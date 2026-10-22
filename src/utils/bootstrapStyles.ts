/**
 * 连接 HTML 头部脚本与 React 入口的样式等待逻辑，只处理 data-bootstrap-stylesheet 标记的链接。
 * 插件把这些链接暂设为 media=print，让内联画面先绘制；加载结束后恢复 all，入口再挂载 React。
 * “结束”包含成功和失败：样式失败时仍允许进入应用，不把资源错误变成永久的启动等待。
 */

/**
 * 在 HTML 头部、样式链接解析前安装监听，记录可能早于 React 入口发生的 load/error 事件。
 * 资源事件不冒泡，因此在 document 的捕获阶段监听，无需为每个尚未解析出的链接绑定处理器。
 * 构建插件通过 toString 内联本函数，必须保持无模块闭包；只能引用函数内变量和浏览器全局对象。
 */
export function startBootstrapStyles() {
  const cleanup = () => {
    // 解析未结束时，后面还可能出现新的样式链接；解析结束且所有标记链接完成后才释放捕获监听。
    if (
      document.readyState !== 'loading' &&
      !document.querySelector('link[data-bootstrap-stylesheet]:not([data-bootstrap-ready])')
    ) {
      document.removeEventListener('load', finish, true);
      document.removeEventListener('error', finish, true);
    }
  };
  const finish = (event: Event) => {
    const link = event.target as HTMLLinkElement | null;
    if (
      link?.tagName !== 'LINK' ||
      !link.hasAttribute('data-bootstrap-stylesheet') ||
      link.dataset.bootstrapReady
    )
      return;
    // 先恢复样式适用范围，再记录完成标记，供稍后执行的入口识别已经结束的请求。
    // error 也走相同流程；该标记表示无需继续等待，不保证样式加载成功。
    link.media = 'all';
    link.dataset.bootstrapReady = 'true';
    cleanup();
  };
  document.addEventListener('load', finish, true);
  document.addEventListener('error', finish, true);
  document.addEventListener('DOMContentLoaded', cleanup, { once: true });
}

/**
 * main 在执行挂载前调用，等待当前 HTML 中被插件标记的全部样式结束，不等待页面懒加载样式。
 * 完成标记可识别早于入口发生的成功或失败事件；sheet 则兼容浏览器已经创建样式表的情况。
 * 尚未结束的链接在成功或失败后都兑现 Promise，并移除自身监听；没有标记链接时直接通过。
 * 开发环境通常由 Vite 的模块注入样式，不产生这些链接，因此无需此处额外等待。
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
