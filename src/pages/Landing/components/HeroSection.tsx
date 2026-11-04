import { useNavigate } from 'react-router';
import { palette } from '../palette';
import { AnimatedContent } from '../reactbits/AnimatedContent';
import { BlurText } from '../reactbits/BlurText';
import { GradientText } from '../reactbits/GradientText';
import { ShinyText } from '../reactbits/ShinyText';
import { ActionButton } from './ActionButton';
import { ProductStage } from './stage/ProductStage';

export function HeroSection() {
  const navigate = useNavigate();
  return (
    <section id="top" aria-labelledby="hero-title" className="mx-auto max-w-1200px px-4 pt-12 md:px-8 md:pt-20">
      <AnimatedContent distance={12}>
        <a
          href="#features"
          className="inline-flex items-center gap-2 rounded-full border border-solid border-[var(--lp-line)] bg-[var(--lp-panel)] py-1 pl-1 pr-3 text-13px no-underline transition-colors hover:border-[rgba(255,255,255,0.2)]"
        >
          <span className="rounded-full bg-[var(--lp-fg)] px-2 py-0.5 text-12px font-600 text-[var(--lp-bg)]">新</span>
          <ShinyText text="参数热更新已支持灰度" baseColor={palette.muted} shineColor={palette.fg} />
          <span aria-hidden="true" className="i-lucide-arrow-right h-3.5 w-3.5 text-[var(--lp-muted)]" />
        </a>
      </AnimatedContent>

      <h1
        id="hero-title"
        className="m-0 mt-6 text-balance text-40px font-700 leading-[1.15] tracking-tight md:text-64px"
      >
        <BlurText text="每一次参数变更" delay={45} />
        <br />
        <GradientText colors={[palette.blue, '#a9c2ff', palette.red, palette.blue]} animationSpeed={7}>
          都可追溯、可回退
        </GradientText>
      </h1>

      <AnimatedContent
        delay={0.3}
        distance={16}
        className="mt-8 flex flex-col-reverse gap-6 md:flex-row md:items-end md:justify-between"
      >
        <div className="flex flex-wrap gap-3">
          <ActionButton onClick={() => void navigate('/')}>
            开始使用
            <span aria-hidden="true" className="i-lucide-arrow-right h-4 w-4" />
          </ActionButton>
          <ActionButton variant="ghost" href="#features">
            了解核心功能
          </ActionButton>
        </div>
        <p className="m-0 max-w-380px text-pretty text-15px leading-relaxed text-[var(--lp-muted)]">
          面向行内开发人员的一站式技术参数管理平台。快照发布、一键回退、热更新、运行时比对，一处完成。
        </p>
      </AnimatedContent>

      <AnimatedContent delay={0.45} distance={40} className="mt-12 md:mt-14">
        <ProductStage />
      </AnimatedContent>
    </section>
  );
}
