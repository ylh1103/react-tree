/** 展示分享链接中的申请信息；审批入口预留，接入服务前不改变成员权限。 */
import { Alert, App, Button } from 'antd';
import { useNavigate, useSearchParams } from 'react-router';
import { readSystemJoinLink } from '@/utils/systemJoinLink';
import { systemJoinRoleLabels } from '@/utils/systemRoles';

export default function SystemJoinRequestPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const request = readSystemJoinLink(params);

  return (
    <div className="box-border mx-auto w-full max-w-632px px-4 py-6 [@media(min-width:600px)]:py-12">
      <section
        className="workspace-panel min-w-0 p-5 shadow-[0_16px_40px_var(--color-tree-filter-shadow)] [@media(min-width:600px)]:p-9"
        aria-labelledby="join-request-title"
      >
        <header className="mb-6 flex items-center gap-4 [@media(min-width:600px)]:mb-7">
          <div className="grid size-52px shrink-0 place-items-center rounded-ui bg-hover text-accent-text">
            <span className="i-lucide-user-round-plus size-24px" aria-hidden="true" />
          </div>
          <h1
            id="join-request-title"
            className="m-0 text-24px font-700 leading-tight [@media(min-width:600px)]:text-26px"
          >
            系统加入申请
          </h1>
        </header>

        {request ? (
          <>
            <div className="flex items-center gap-4 rounded-ui bg-accent p-5 text-on-accent [--join-ring:color-mix(in_srgb,currentColor_16%,transparent)] [background-image:radial-gradient(circle_at_right_40px_top_40px,transparent_49px,var(--join-ring)_49px_50.5px,transparent_50.5px_79px,var(--join-ring)_79px_80.5px,transparent_80.5px_107px,var(--join-ring)_107px_108.5px,transparent_108.5px)] [html[data-theme=dark]_&]:bg-hover [html[data-theme=dark]_&]:text-text [html[data-theme=dark]_&]:[--join-ring:color-mix(in_srgb,var(--color-accent)_16%,transparent)] [@media(min-width:600px)]:gap-4.5 [@media(min-width:600px)]:p-7">
              <div className="grid size-52px shrink-0 place-items-center rounded-ui bg-[var(--join-ring)] [html[data-theme=dark]_&]:text-accent-text [@media(min-width:600px)]:size-60px">
                <span className="i-lucide-boxes size-26px" aria-hidden="true" />
              </div>
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="m-0 text-26px font-700 leading-tight [@media(min-width:600px)]:text-32px">
                  {request.systemName}
                </p>
                {request.systemChineseName && (
                  <p className="m-0 mt-1 text-15px font-500 leading-6 [html[data-theme=dark]_&]:text-text-secondary">
                    {request.systemChineseName}
                  </p>
                )}
              </div>
            </div>
            <dl className="m-0 mt-3 grid gap-3 [@media(min-width:440px)]:grid-cols-2">
              <div className="min-w-0 rounded-ui bg-sidebar p-4 [@media(min-width:600px)]:p-6">
                <dt className="text-13px leading-5 text-sidebar-text">申请人</dt>
                <dd className="m-0 mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 [overflow-wrap:anywhere]">
                  {request.userName && (
                    <span className="min-w-0 text-20px font-700 leading-7">{request.userName}</span>
                  )}
                  <span
                    className={`min-w-0 tabular-nums ${request.userName ? 'text-15px text-sidebar-text' : 'text-20px font-700 leading-7'}`}
                  >
                    {request.ystId}
                  </span>
                </dd>
              </div>
              <div className="min-w-0 rounded-ui bg-hover p-4 [@media(min-width:600px)]:p-6">
                <dt className="text-13px leading-5 text-text-secondary">申请角色</dt>
                <dd className="m-0 mt-2 text-20px font-700 leading-7 text-accent-text">
                  {systemJoinRoleLabels[request.role]}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <Alert showIcon type="warning" title="申请链接不完整或无效，请向申请人索取完整链接。" />
        )}

        <footer className="mt-6 flex justify-end [@media(min-width:600px)]:mt-7">
          <div className="grid w-full grid-cols-2 gap-3 [&>button]:min-h-48px [@media(min-width:440px)]:w-auto [@media(min-width:440px)]:grid-cols-[112px_128px]">
            <Button
              size="large"
              variant="filled"
              color="default"
              icon={<span className="i-lucide-house size-16px" aria-hidden="true" />}
              onClick={() => navigate('/')}
            >
              返回首页
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<span className="i-lucide-check size-16px" aria-hidden="true" />}
              disabled={!request}
              onClick={() => void message.info('审批功能尚未接入，暂时无法通过申请。')}
            >
              通过申请
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}
