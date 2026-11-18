/** 整页恢复界面独立于业务 Provider；双栏配置控制台表达页面中断，诊断信息单独折叠。 */
import { Button } from 'antd';
import { BootstrapLoadingHandoff } from '@/components/ResourceLoading/BootstrapHandoff';
import { FailureDetails } from '@/components/FailureDetails';
import { FailureIllustration } from '@/components/FailureIllustration';
import { isResourceError } from '@/components/ComponentFailure/resourceError';

/** 公共层也可能发生异常，统一提供整页刷新，不承诺路由跳转能够恢复。 */
export function AppFailure({ error }: { error: unknown }) {
  const resourceFailure = isResourceError(error);

  return (
    <BootstrapLoadingHandoff>
      <section
        role="alert"
        aria-labelledby="app-failure-title"
        className="@container box-border flex min-h-full w-full min-w-0 flex-col bg-canvas px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,5dvh,3rem)] text-text"
      >
        <div className="mx-auto flex w-full max-w-560px flex-1 flex-col justify-center @[760px]:max-w-1040px">
          <div className="grid min-w-0 gap-5 @[760px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] @[760px]:items-center @[760px]:gap-x-[clamp(2rem,6cqi,4rem)]">
            <div className="min-w-0">
              <h1
                id="app-failure-title"
                className="m-0 text-[clamp(1.75rem,5cqi,2.5rem)] font-600 leading-tight tracking-tight"
              >
                {resourceFailure ? '页面资源加载失败' : '页面暂时无法打开'}
              </h1>
              <p className="mb-0 mt-3 text-15px leading-7 @[760px]:mt-5 text-text-secondary">
                {resourceFailure
                  ? '页面所需的资源未能加载，暂时无法显示内容。'
                  : '页面运行时遇到了问题，暂时无法继续显示。'}
                <br />
                请刷新重试，或联系技术支持协助排查。
              </p>
              <div className="mt-5 grid gap-2 @[400px]:flex @[400px]:flex-wrap @[400px]:items-center @[400px]:gap-3 @[760px]:mt-8">
                <Button
                  type="primary"
                  icon={<span aria-hidden="true" className="i-lucide:rotate-cw text-4" />}
                  onClick={() => window.location.reload()}
                  className="h-44px! px-6!"
                >
                  刷新页面
                </Button>
                {/* 支持入口按约定仅预留，不绑定尚未配置的地址或读取已失败的业务上下文。 */}
                <Button className="h-44px! px-5!">
                  技术支持
                  <span aria-hidden="true" className="i-lucide:arrow-up-right text-18px" />
                </Button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[clamp(17.5rem,80cqi,20rem)] @[760px]:max-w-480px">
              <FailureIllustration />
            </div>
          </div>
          <div className="mt-5 min-w-0 @[760px]:mt-10">
            <FailureDetails error={error} variant="page" />
          </div>
        </div>
      </section>
    </BootstrapLoadingHandoff>
  );
}
