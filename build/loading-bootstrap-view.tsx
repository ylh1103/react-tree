/**
 * 在 Vite 运行的 Node 环境中生成启动 HTML，复用正式 SVG 和 ResourceLoadingView 的布局。
 * 这里只生成静态标记，不挂载组件；浏览器显示这份 HTML 时无需先下载 React。
 */
import { FailureIllustration } from '../src/components/FailureIllustration/index.tsx';
import { renderToStaticMarkup } from 'react-dom/server';
import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' };
import { LoadingIndicator } from '../src/components/LoadingIndicator/index.tsx';
import { loadingStyles } from '../src/components/LoadingIndicator/model/styles.ts';
import { ResourceLoadingView } from '../src/components/ResourceLoading/LoadingView.tsx';

/** 复用本地图标库的固定 SVG，直接内联以免启动页依赖图标 CSS 或产生额外请求。 */
function BootstrapIcon({
  name,
  size,
  className,
}: {
  name: 'unplug' | 'chevron-down';
  size: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      dangerouslySetInnerHTML={{ __html: lucideIcons.icons[name].body }}
    />
  );
}

/**
 * 所有内置方案随 HTML 一起返回，避免读取浏览器缓存后再请求对应图标。
 * 各方案默认隐藏，由头部脚本设置的 data-bootstrap-loading-style 选择其中一款。
 * 此处只使用项目内的固定方案；浏览器缓存不参与 HTML 拼接，也不会在配置返回时重建这组 SVG。
 */
export function renderBootstrapLoading() {
  return renderToStaticMarkup(
    <div id="bootstrap-loading" className="fixed inset-0 overflow-auto font-sans">
      <div className="[[data-bootstrap-failed]_&]:hidden">
        <ResourceLoadingView>
          {loadingStyles.map((item) => (
            <span
              key={item.id}
              data-loading-style={item.id}
              className={`hidden [[data-bootstrap-loading-style=${item.id}]_&]:inline-flex`}
            >
              <LoadingIndicator styleId={item.id} />
            </span>
          ))}
        </ResourceLoadingView>
      </div>
      {/* React 不可用时只能使用原生按钮；样式随启动 HTML 内联，不依赖主 JS/CSS 下载。 */}
      <section
        role="alert"
        aria-labelledby="bootstrap-failure-title"
        className="box-border hidden min-h-screen items-center justify-center bg-canvas px-6 py-10 text-text [[data-bootstrap-failed]_&]:flex"
      >
        <div className="w-full max-w-920px">
          <p className="mb-8 mt-0 text-14px font-600 text-text-secondary">灵动参数管家</p>
          <div className="grid items-center gap-8 desktop:grid-cols-[1fr_320px] desktop:gap-16">
            <div className="min-w-0">
              <h1
                id="bootstrap-failure-title"
                className="m-0 text-32px font-600 leading-11 desktop:text-38px desktop:leading-13"
              >
                应用启动失败
              </h1>
              <p className="mb-0 mt-4 max-w-440px text-15px leading-7 text-text-secondary">
                启动过程中遇到问题，暂时无法打开工作区。
                <br />
                请尝试刷新页面，或联系技术支持。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  id="bootstrap-reload"
                  type="button"
                  className="min-h-44px min-w-108px cursor-pointer rounded-8px border border-solid border-accent bg-accent px-5 py-2 text-14px font-500 text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-3"
                >
                  刷新页面
                </button>
                {/* 预留技术支持入口，具体跳转由后续业务配置接入，不猜测工单地址或联系方式。 */}
                <button
                  id="bootstrap-support"
                  type="button"
                  className="min-h-44px min-w-108px cursor-pointer rounded-8px border border-solid border-border-subtle bg-surface px-5 py-2 text-14px font-500 text-text hover:border-accent focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-3"
                >
                  技术支持
                </button>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="order-first mx-auto w-full max-w-280px desktop:order-none desktop:max-w-320px"
            >
              <FailureIllustration />
            </div>
          </div>
          <details className="group mt-10 border-0 border-t border-solid border-border-subtle">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-5 text-13px font-500 outline-offset-3 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
              <span>查看失败详情</span>
              <BootstrapIcon
                name="chevron-down"
                size={16}
                className="shrink-0 text-text-secondary group-open:[transform:rotate(180deg)]"
              />
            </summary>
            <pre
              id="bootstrap-failure-details"
              className="m-0 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-8px border border-solid border-border-subtle bg-surface p-5 text-left font-mono text-12px leading-6 text-text-secondary"
            >
              浏览器未提供具体失败原因，请查看控制台。
            </pre>
            <p className="mb-0 mt-3 text-12px leading-5 text-text-secondary">
              联系技术支持时，可提供以上失败信息以便排查。
            </p>
          </details>
        </div>
      </section>
    </div>,
  );
}
