/** 产品首屏采用左对齐的单列排版，粒子背景独立铺满区块。 */
import { lazy, Suspense, type CSSProperties } from 'react';
import { Button } from 'antd';
import { m } from 'motion/react';
import { heroFade } from '../HeroParticles/masks';
import HeroParticles from '../HeroParticles';
import LandingPreview from '../LandingPreview';
import { useLandingTheme } from '../../hooks/useLandingTheme';
import { useLandingEntrance } from '../../hooks/useLandingEntrance';

const HeroLightKnot = lazy(() => import('../HeroLightKnot'));

const buttonClass =
  'h-46px! rounded-13px! text-15px! font-500! tracking-[-0.01em]! shadow-none! transition-[background,color,transform]! active:scale-97 motion-reduce:transform-none [@media(max-width:768px)]:h-44px! [@media(max-width:768px)]:text-14px! [@media(max-width:768px)]:px-3!';

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
        className="pointer-events-none relative z-2 mx-auto w-full max-w-1280px pl-44px pr-32px pt-[clamp(104px,16vh,144px)] [@media(max-width:768px)]:px-22px [@media(max-width:768px)]:pt-[clamp(88px,13svh,110px)] motion-reduce:opacity-100! motion-reduce:transform-none! motion-reduce:filter-none!"
      >
        <div className="relative">
          <div
            aria-hidden="true"
            className="h-[min(22rem,84vw)] [@media(min-width:1024px)]:hidden"
          />
          <header className="relative z-1 flex min-w-0 [@media(min-width:1024px)]:max-w-54% flex-col items-start [&_a]:pointer-events-auto [&_p]:pointer-events-auto [&_h1]:pointer-events-auto">
            <h1
              id="landing-title"
              className="m-0 text-[clamp(28px,calc(18px+2.3vw),52px)] font-500 leading-[1.15] tracking-[-0.03em] [@media(max-width:768px)]:text-[clamp(27px,8vw,40px)] [text-wrap:balance]"
            >
              让每一次参数变更，
              <span className="block text-[var(--hero-primary)]">都更有把握</span>
            </h1>
            <p className="m-0 mt-16px max-w-380px text-[clamp(14px,calc(13px+0.25vw),16px)] leading-[1.65] text-[var(--hero-muted)]">
              从发布前校验、版本比对，到一键发布、快速回退，再到实例运行时参数核对，灵动参数管家让配置差异看得清、变更过程有记录、生效结果可核查。
            </p>
            <div className="mt-24px flex w-full flex-wrap gap-2.5 [@media(max-width:768px)]:grid [@media(max-width:768px)]:grid-cols-2 [@media(max-width:359px)]:grid-cols-1">
              <Button
                type="primary"
                href="/"
                icon={<span aria-hidden="true" className="i-lucide-arrow-right h-17px w-17px" />}
                iconPlacement="end"
                className={`${buttonClass} gap-2! pl-21px! pr-17px!`}
              >
                进入控制台
              </Button>
              <Button
                href="https://doc.cmbchina.com/f/v?id=MkvTb"
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClass} px-5!`}
              >
                查看接入指南
              </Button>
            </div>
          </header>
        </div>

        <LandingPreview light={light} />
      </m.div>
    </section>
  );
}
