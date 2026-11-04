/**
 * 在 Vite 运行的 Node 环境中生成启动 HTML，复用正式 SVG 和 ResourceLoadingView 的布局。
 * 静态错误页对齐 AppFailure 的布局；原生按钮与折叠详情在主 JS/CSS 不可用时仍能展示和操作。
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
  name: 'rotate-cw' | 'arrow-up-right' | 'chevron-right' | 'copy' | 'check' | 'circle-alert';
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
  // React 不可用时保留原生按钮，交互色和阴影由构建插件从同一 Ant Design 主题提取。
  const buttonClass =
    'inline-flex h-44px cursor-pointer touch-manipulation select-none items-center justify-center gap-2 whitespace-nowrap rounded-control border border-solid text-14px font-normal leading-normal outline-none [transition:all_0.2s_cubic-bezier(0.645,0.045,0.355,1)] focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-accent-border focus-visible:outline-offset-1';
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
        className="box-border hidden min-h-screen flex-col bg-canvas px-6 py-8 text-text desktop:px-12 desktop:py-10 [[data-bootstrap-failed]_&]:flex"
      >
        <div className="mx-auto flex w-full max-w-1040px flex-1 flex-col justify-center [@media(min-height:700px)]:-translate-y-8 py-12 desktop:py-16">
          <div className="grid items-center gap-10 desktop:grid-cols-[1fr_480px] desktop:gap-16">
            <div className="min-w-0">
              <h1
                id="bootstrap-failure-title"
                className="m-0 text-32px font-600 leading-12 tracking-tight desktop:text-40px desktop:leading-14"
              >
                应用启动失败
              </h1>
              <p className="mb-0 mt-5 text-15px leading-8 text-text-secondary">
                启动过程中遇到问题，暂时无法打开工作区。
                <br />
                请刷新重试，或联系技术支持协助排查。
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  id="bootstrap-reload"
                  type="button"
                  className={`${buttonClass} border-accent bg-accent px-6 text-[var(--color-button-primary-text)] [box-shadow:var(--color-button-primary-shadow)] hover:border-accent-hover hover:bg-accent-hover active:border-accent-active active:bg-accent-active`}
                >
                  <BootstrapIcon name="rotate-cw" size={16} className="shrink-0" />
                  刷新页面
                </button>
                {/* 预留技术支持入口，具体跳转由后续业务配置接入，不猜测工单地址或联系方式。 */}
                <button
                  id="bootstrap-support"
                  type="button"
                  className={`${buttonClass} border-[var(--color-button-border)] bg-[var(--color-button-bg)] px-5 text-[var(--color-button-text)] [box-shadow:var(--color-button-shadow)] hover:border-accent-hover hover:bg-[var(--color-button-hover-bg)] hover:text-accent-hover active:border-accent-active active:bg-[var(--color-button-active-bg)] active:text-accent-active`}
                >
                  技术支持
                  <BootstrapIcon name="arrow-up-right" size={18} className="shrink-0" />
                </button>
              </div>
            </div>
            <div aria-hidden="true" className="mx-auto w-full max-w-480px">
              <FailureIllustration />
            </div>
          </div>
          {/* 原生操作栏对齐 PageDetails；错误内容仅由内联脚本通过 textContent 创建。 */}
          <div className="mt-10 min-w-0 border-0 border-t border-solid border-border-subtle pt-5 text-left desktop:mt-14">
            <div className="flex items-center gap-4">
              <button
                id="bootstrap-toggle"
                type="button"
                aria-label="查看诊断详情"
                aria-expanded="false"
                aria-controls="bootstrap-diagnostic"
                className="flex h-30px min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left text-13px leading-6 text-text-secondary layout-focus"
              >
                <BootstrapIcon
                  name="chevron-right"
                  size={14}
                  className="shrink-0 [[data-expanded=true]_&]:[transform:rotate(90deg)]"
                />
                <span id="bootstrap-summary" className="block truncate">
                  未提供具体失败原因
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  id="bootstrap-raw"
                  type="button"
                  hidden
                  aria-pressed="false"
                  className="h-30px w-80px cursor-pointer border-0 bg-transparent p-0 text-12px text-text-secondary layout-focus"
                >
                  查看原文
                </button>
                <button
                  id="bootstrap-copy"
                  type="button"
                  title="复制错误信息"
                  className="inline-flex h-30px w-112px cursor-pointer items-center justify-center gap-2 border-0 bg-transparent p-0 text-12px text-text-secondary [&[data-status=success]]:text-accent layout-focus"
                >
                  <BootstrapIcon
                    name="copy"
                    size={13}
                    className="shrink-0 [[data-status=success]_&]:hidden [[data-status=failure]_&]:hidden"
                  />
                  <BootstrapIcon
                    name="check"
                    size={13}
                    className="hidden shrink-0 [[data-status=success]_&]:block"
                  />
                  <BootstrapIcon
                    name="circle-alert"
                    size={13}
                    className="hidden shrink-0 [[data-status=failure]_&]:block"
                  />
                  <span id="bootstrap-copy-label">复制错误信息</span>
                </button>
              </div>
            </div>
            <span id="bootstrap-copy-status" role="status" className="sr-only" />
            <div
              id="bootstrap-diagnostic"
              role="region"
              aria-label="错误诊断信息"
              hidden
              className="mt-4 rounded-8px border border-solid border-border-subtle bg-surface p-4 desktop:p-5"
            >
              <div id="bootstrap-failure-details" />
              <div
                id="bootstrap-more"
                hidden
                className="mt-3 flex flex-wrap items-center justify-between gap-2 border-0 border-t border-solid border-border-subtle pt-3 text-12px text-text-secondary [&[hidden]]:hidden"
              >
                <span>当前仅预览部分内容，复制将包含全部已提取诊断文本。</span>
                <button
                  id="bootstrap-next"
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-12px text-accent layout-focus"
                >
                  继续显示
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>,
  );
}
