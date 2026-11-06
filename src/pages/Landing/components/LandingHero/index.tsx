/** 产品首屏沿用参考页的文字网格与断点；文案、背景和主题仍在本模块独立维护。 */
import type { CSSProperties } from 'react';
import { Button } from 'antd';
import { m } from 'motion/react';
import { heroFade } from '../HeroParticles/masks';
import HeroParticles from '../HeroParticles';
import { useLandingTheme } from '../../hooks/useLandingTheme';
import { useLandingEntrance } from '../../hooks/useLandingEntrance';

const description = [
  '从发布前校验、版本比对，到一键发布、快速回退，',
  '再到实例运行时参数核对，灵动参数管家让配置差异看得清、',
  '变更过程有记录、生效结果可核查。',
];
const buttonClass =
  'h-46px! rounded-13px! text-15px! font-500! tracking-[-0.01em]! shadow-none! transition-[background,color,transform]! active:scale-97 motion-reduce:transform-none [@media(max-width:768px)]:h-48px! [@media(max-width:768px)]:w-full!';

export default function LandingHero() {
  const entrance = useLandingEntrance('hero');
  const { theme, particleColors } = useLandingTheme();
  const light = theme === 'light';
  const variables = {
    '--hero-fade': heroFade,
    '--hero-ink': 'var(--color-text)',
    '--hero-muted': 'var(--color-text-secondary)',
    '--hero-primary': 'var(--color-accent)',
    '--hero-primary-ink': 'var(--color-on-accent)',
    '--hero-ghost': 'var(--color-surface)',
    '--hero-ghost-shadow': 'inset 0 0 0 1px var(--color-border-subtle)',
  } as CSSProperties;
  return (
    <section
      id="landing-hero"
      style={variables}
      aria-labelledby="landing-title"
      className="relative isolate min-h-200vh overflow-hidden pb-72px text-[var(--hero-ink)] [font-family:Geist,sans-serif] [@media(max-width:768px)]:pb-48px"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-0 bg-canvas ${light ? '[mask-image:var(--hero-fade)]' : ''}`}
      />
      <HeroParticles
        light={light}
        baseColor={particleColors.base}
        waveColor={particleColors.accent}
      />
      <div className="relative z-1 mx-auto w-full max-w-1728px pl-44px pr-32px pt-[clamp(100px,13vh,148px)] [@media(max-width:768px)]:px-22px [@media(max-width:768px)]:pt-100px">
        <m.header
          {...entrance}
          className="motion-reduce:opacity-100! motion-reduce:transform-none! motion-reduce:filter-none! grid grid-cols-[minmax(0,1fr)_auto] gap-x-64px  [@media(max-width:1100px)]:grid-cols-1 "
        >
          <p className="m-0 mb-26px inline-flex h-8 max-w-full items-center justify-self-start gap-2 rounded-10px bg-[var(--hero-ghost)] pl-1 pr-3 text-13px font-500 tracking-[-0.01em] shadow-[var(--hero-ghost-shadow)] col-span-2 col-start-1 row-start-1 [@media(max-width:1100px)]:col-span-1 [@media(max-width:1100px)]:mb-5">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-6px bg-[var(--hero-primary)] text-[var(--hero-primary-ink)]"
            >
              <span className="i-lucide-sliders-horizontal h-3.5 w-3.5" />
            </span>
            面向行内开发人员的技术参数管理工具集
          </p>
          <h1
            id="landing-title"
            className="m-0 text-[clamp(32px,2.9vw,54px)] font-500 leading-[1.1] tracking-[-0.036em] min-w-0 col-start-1 row-start-2 [@media(max-width:768px)]:text-[clamp(27px,7.4vw,34px)] [@media(max-width:768px)]:leading-[1.12] [@media(max-width:768px)]:[text-wrap:balance]"
          >
            让每一次参数变更，
            <br className="[@media(max-width:768px)]:hidden" />
            都更有把握
          </h1>
          <p className="m-0 -mb-[0.28em] self-end text-[clamp(15px,1.1vw,18px)] leading-[1.55] tracking-[-0.01em] text-[var(--hero-muted)] col-start-2 row-start-2 row-span-2 [@media(max-width:1100px)]:col-start-1 [@media(max-width:1100px)]:row-start-3 [@media(max-width:1100px)]:row-span-1 [@media(max-width:1100px)]:mb-0 [@media(max-width:1100px)]:mt-18px [@media(max-width:768px)]:mt-4 [@media(max-width:768px)]:text-15px">
            {description.map((line) => (
              <span
                key={line}
                className="block whitespace-nowrap [@media(max-width:1100px)]:inline [@media(max-width:1100px)]:whitespace-normal"
              >
                {line}
              </span>
            ))}
          </p>
          <div className="mt-30px flex flex-wrap gap-2.5 col-start-1 row-start-3 [@media(max-width:1100px)]:row-start-4 [@media(max-width:768px)]:mt-26px [@media(max-width:768px)]:flex-col">
            <Button
              type="primary"
              href="/"
              icon={<span aria-hidden="true" className="i-lucide-arrow-right h-17px w-17px" />}
              iconPlacement="end"
              className={`${buttonClass} gap-2! pl-21px! pr-17px!`}
            >
              控制台
            </Button>
            <Button
              href="https://doc.cmbchina.com/f/v?id=MkvTb"
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonClass} px-5!`}
            >
              接入指南
            </Button>
          </div>
        </m.header>
      </div>
    </section>
  );
}
