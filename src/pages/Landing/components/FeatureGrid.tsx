import { SpotlightCard } from '../reactbits/SpotlightCard';
import { AnimatedContent } from '../reactbits/AnimatedContent';
import { SectionHeading } from './SectionHeading';

const features = [
  { icon: 'i-lucide-file-clock', title: '参数版本化管理', body: '每次变更沉淀为快照，跨环境、跨版本随时比对。' },
  { icon: 'i-lucide-rocket', title: '快速发布和回退参数', body: '一键将参数发布到配置中心，快速回退到历史版本。' },
  { icon: 'i-lucide-refresh-cw', title: '参数热加载', body: '参数修改后使用热更新，无需重启应用即可加载最新参数。' },
  { icon: 'i-lucide-package-open', title: '开放参数服务 SDK', body: 'API 市场开放了参数服务 SDK，引入即可得到独立的高性能配置中心。' },
  { icon: 'i-lucide-scan-eye', title: '运行时参数可视化', body: '查看每个实例运行时的参数与平台已发布参数的差异。' },
  { icon: 'i-lucide-bell-ring', title: '参数变更实时推送', body: '订阅关注的应用和环境，参数发布后通过招乎机器人推送变更内容。' },
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-title" className="scroll-mt-16">
      <div className="mx-auto flex max-w-1200px flex-col gap-12 px-5 py-24 md:px-8">
        <SectionHeading id="features-title" eyebrow="能力全景" title="覆盖参数全生命周期的六项能力" />
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, index) => (
            <li key={item.title}>
              <AnimatedContent delay={(index % 3) * 0.08} distance={20} className="h-full">
                <SpotlightCard
                  spotlightColor="rgba(22,119,255,0.12)"
                  className="h-full rounded-2xl border border-solid border-[var(--lp-line)] bg-[var(--lp-surface)] transition-colors hover:border-[rgba(22,119,255,0.35)]"
                >
                  <div className="flex h-full flex-col gap-4 p-7">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--lp-paper)]">
                      <span aria-hidden="true" className={`${item.icon} h-5 w-5 text-[var(--lp-blue)]`} />
                    </span>
                    <h3 className="m-0 text-18px font-700 text-[var(--lp-ink)]">{item.title}</h3>
                    <p className="m-0 text-14px leading-relaxed text-[var(--lp-muted)]">{item.body}</p>
                  </div>
                </SpotlightCard>
              </AnimatedContent>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
