/** 整页恢复界面独立于业务 Provider；双栏配置控制台表达页面中断，诊断信息单独折叠。 */
import { Button } from 'antd';
import { BootstrapLoadingHandoff } from '@/components/ResourceLoading/BootstrapHandoff';
import { FailureDetails } from '@/components/FailureDetails';
import { FailureIllustration } from '@/components/FailureIllustration';
import { isResourceError } from '@/components/ComponentFailure/resourceError';

export function AppFailure({ error, onHome }: { error: unknown; onHome?: () => void }) {
  const resourceFailure = isResourceError(error);

  return (
    <BootstrapLoadingHandoff>
      <section
        role="alert"
        aria-labelledby="app-failure-title"
        className="box-border flex min-h-screen flex-col bg-canvas px-6 py-8 text-text desktop:px-12 desktop:py-10"
      >
        <div className="mx-auto flex w-full max-w-1040px flex-1 flex-col justify-center py-12 desktop:py-16">
          <div className="grid items-center gap-10 desktop:grid-cols-[1fr_480px] desktop:gap-16">
            <div className="min-w-0 desktop:self-start desktop:pt-6">
              <h1
                id="app-failure-title"
                className="m-0 text-32px font-600 leading-12 tracking-tight desktop:text-40px desktop:leading-14"
              >
                {resourceFailure ? '页面资源加载失败' : '页面暂时无法打开'}
              </h1>
              <p className="mb-0 mt-5 text-15px leading-8 text-text-secondary">
                {resourceFailure
                  ? '页面所需的资源未能加载，暂时无法显示内容。'
                  : '页面运行时遇到了问题，暂时无法继续显示。'}
                <br />
                请刷新重试，或联系技术支持协助排查。
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  type="primary"
                  icon={<span aria-hidden="true" className="i-lucide:rotate-cw" />}
                  onClick={() => window.location.reload()}
                  className="h-44px! rounded-8px! border-accent! bg-accent! px-6! text-on-accent! hover:bg-accent-hover! layout-focus"
                >
                  刷新页面
                </Button>
                {/* 支持入口按约定仅预留，不绑定尚未配置的地址或读取已失败的业务上下文。 */}
                <Button className="h-44px! rounded-8px! border-border-subtle! bg-surface! px-5! text-text! layout-focus">
                  技术支持
                  <span aria-hidden="true" className="i-lucide:arrow-up-right text-14px" />
                </Button>
                {onHome && (
                  <Button type="link" onClick={onHome} className="px-0! text-accent! layout-focus">
                    返回系统列表
                  </Button>
                )}
              </div>
            </div>
            <div className="mx-auto w-full max-w-480px">
              <FailureIllustration />
            </div>
          </div>
          <div className="mt-10 desktop:mt-14">
            <FailureDetails error={error} variant="page" />
          </div>
        </div>
      </section>
    </BootstrapLoadingHandoff>
  );
}
