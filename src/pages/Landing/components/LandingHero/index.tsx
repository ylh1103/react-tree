/** 产品首屏采用左对齐的单列排版，粒子背景独立铺满区块。 */
import { lazy, Suspense, type CSSProperties } from 'react';
import LandingActions from '../LandingActions';
import { m } from 'motion/react';
import { heroFade } from '../HeroParticles/masks';
import HeroParticles from '../HeroParticles';
import LandingPreview from '../LandingPreview';
import { useLandingTheme } from '../../hooks/useLandingTheme';
import { useLandingEntrance } from '../../hooks/useLandingEntrance';

const HeroLightKnot = lazy(() => import('../HeroLightKnot'));
export default function LandingHero() {
  const entrance = useLandingEntrance('hero');
  const { theme, particleColors } = useLandingTheme();
  const light = theme === 'light';
  const variables = {
    '--hero-fade': heroFade,
    '--hero-ink': 'var(--color-text)',
    '--hero-muted': 'var(--color-text-secondary)',
    '--hero-primary': 'var(--color-accent)',
  } as CSSProperties;
  return (
    <section
      id="landing-hero"
      style={variables}
      aria-labelledby="landing-title"
      className="relative isolate min-h-svh overflow-hidden pb-72px text-[var(--hero-ink)] [font-family:Geist,sans-serif] [@media(max-width:768px)]:pb-48px"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-0 bg-[var(--landing-hero-background)] ${light ? '[mask-image:var(--hero-fade)]' : ''}`}
      />
      <Suspense fallback={null}>
        <HeroLightKnot theme={theme} accentColor={particleColors.accent} />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 z-0">
        <HeroParticles
          light={light}
          baseColor={light ? '#ffffff' : particleColors.base}
          waveColor={particleColors.accent}
        />
      </div>
      <m.div
        {...entrance}
        className="pointer-events-none relative z-2 mx-auto w-full max-w-1280px pl-44px pr-32px pt-[clamp(104px,16vh,144px)] desktop:pt-[clamp(144px,17vh,176px)] [@media(max-width:768px)]:px-22px [@media(max-width:768px)]:pt-[clamp(88px,13svh,110px)] motion-reduce:opacity-100! motion-reduce:transform-none! motion-reduce:filter-none!"
      >
        <div className="relative">
          <div
            aria-hidden="true"
            className="h-[min(22rem,84vw)] [@media(min-width:1024px)]:hidden"
          />
          <header className="relative z-1 flex min-w-0 [@media(min-width:1024px)]:max-w-[min(48%,540px)] flex-col items-start [&_a]:pointer-events-auto [&_p]:pointer-events-auto [&_h1]:pointer-events-auto">
            <span className="mb-20px inline-flex min-h-26px max-w-full items-center gap-1.5 rounded-9px border border-solid border-border-subtle bg-canvas px-2.5 py-0.5 text-12px font-500 leading-5 text-text desktop:mb-24px">
              <span
                aria-hidden="true"
                className="i-lucide-terminal h-3.5 w-3.5 shrink-0 text-text-secondary"
              />
              面向行内开发人员的技术参数管理工具集
            </span>
            <h1
              id="landing-title"
              className="m-0 text-[clamp(30px,3.9vw,60px)] font-650 leading-[1.1] tracking-[-0.045em] [@media(max-width:768px)]:text-[clamp(25px,6.8vw,32px)] [text-wrap:balance]"
            >
              让每一次参数变更，
              <span className="block text-[var(--hero-primary)]">都更有把握</span>
            </h1>
            <p className="m-0 mt-20px max-w-500px text-[clamp(14px,calc(12px+0.35vw),17px)] leading-[1.65] desktop:mt-28px [@media(max-width:768px)]:mt-16px text-[var(--hero-muted)]">
              从发布前校验、参数版本管理，到一键发布、快速回退与运行时核对，灵动参数管家帮助你降低配置风险，提升参数管理效率。
            </p>
            <div className="mt-28px flex w-full flex-col items-start gap-3 desktop:mt-36px [@media(max-width:768px)]:mt-24px">
              <LandingActions />
            </div>
          </header>
        </div>

        <LandingPreview light={light} />
      </m.div>
    </section>
  );
}
