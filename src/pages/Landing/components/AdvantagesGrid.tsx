import { AnimatedContent } from '../reactbits/AnimatedContent';
import { SpotlightCard } from '../reactbits/SpotlightCard';
import { SectionHeading } from './SectionHeading';

const advantages = [
  { icon: 'i-lucide-shield-check', word: '稳健', tag: 'SNAPSHOT', text: '快照机制加多维比对，变化历程一目了然。' },
  { icon: 'i-lucide-zap', word: '高效', tag: 'ONE-CLICK', text: '一键发布与快速回退，降低人工核对成本。' },
  { icon: 'i-lucide-mouse-pointer-click', word: '便捷', tag: 'HOT RELOAD', text: '热更新支持灰度，运行时参数随时可查。' },
  { icon: 'i-lucide-scan-search', word: '精准', tag: 'INSPECT', text: '发布前静态检查，发布后实例级差异扫描。' },
  { icon: 'i-lucide-puzzle', word: '广泛', tag: 'COMPATIBLE', text: '兼容 Spring Boot 2.0+，适配 ZA21 与 ZA24。' },
  { icon: 'i-lucide-life-buoy', word: '容错', tag: 'FAILOVER', text: '管家或配置中心异常，不影响系统运行。' },
];

export function AdvantagesGrid() {
  return (
    <section
      id="advantages"
      aria-labelledby="advantages-title"
      className="mx-auto max-w-1200px scroll-mt-24 px-4 pb-24 md:px-8 md:pb-32"
    >
      <SectionHeading
        id="advantages-title"
        title="降低修改风险，提升操作效率。"
        description="为行内开发人员打造的技术参数管理工具集。"
      />
      <AnimatedContent delay={0.1} className="mt-12">
        <ul className="m-0 grid list-none gap-px overflow-hidden rounded-3xl border border-solid border-[var(--lp-line)] bg-[var(--lp-line)] p-0 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((item) => (
            <li key={item.word} className="bg-[var(--lp-bg)]">
              <SpotlightCard spotlightColor="rgba(77,141,255,0.12)" className="h-full">
                <div className="flex h-full flex-col gap-5 p-7 md:p-8">
                  <div className="flex items-center justify-between">
                    <span aria-hidden="true" className={`${item.icon} h-5 w-5 text-[var(--lp-fg)]`} />
                    <span className="font-mono text-11px tracking-widest text-[var(--lp-muted)]">{item.tag}</span>
                  </div>
                  <h3 className="m-0 text-26px font-700">
                    <span className="text-[var(--lp-muted)]">更</span>
                    {item.word}
                  </h3>
                  <p className="m-0 text-pretty text-14px leading-relaxed text-[var(--lp-muted)]">{item.text}</p>
                </div>
              </SpotlightCard>
            </li>
          ))}
        </ul>
      </AnimatedContent>
    </section>
  );
}
