/** 实际产品公开介绍页：局部主题映射、唯一滚动容器与页面元信息，不扩展后台业务。 */
import 'virtual:landing.css';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import LandingHeader from './components/LandingHeader';
import FluidDots from './components/FluidDots';
import SpotlightCard from './components/SpotlightCard';
import { ProductPreview } from './Previews';
import { RiskSection, WorkflowSection } from './InteractiveSections';
import {
  CapabilitiesSection,
  ClosingSection,
  FaqSection,
  IntegrationSection,
  StatsSection,
} from './ContentSections';
import { Actions, container, muted } from './ui';

const palettes = {
  light: {
    '--landing-canvas': '#ffffff',
    '--landing-on-accent': '#102030',
    '--landing-link': 'color-mix(in srgb, var(--color-accent) 60%, #18181b)',
    '--landing-surface': '#f8f8fa',
    '--landing-raised': '#eeeef1',
    '--landing-text': '#18181b',
    '--landing-muted': '#52525b',
    '--landing-border': '#e7e7e9',
    '--landing-control': '#8b8791',
    '--landing-glass': '#ffffffed',
    '--landing-add': '#216747',
    '--landing-delete': '#9c3447',
    '--landing-add-bg': '#edf6f0',
  },
  dark: {
    '--landing-canvas': '#120f17',
    '--landing-on-accent': '#120f17',
    '--landing-link': 'var(--color-accent)',
    '--landing-surface': '#1b1722',
    '--landing-raised': '#2b2534',
    '--landing-text': '#ffffff',
    '--landing-muted': '#b8b3bf',
    '--landing-border': '#37303f',
    '--landing-control': '#81768d',
    '--landing-glass': '#120f17ed',
    '--landing-add': '#9cd7b3',
    '--landing-delete': '#f1a2ae',
    '--landing-add-bg': '#1c2b25',
  },
};
export default function Landing() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const mode = useAppSelector((state) => state.preferences.themeMode);
  const theme = useResolvedTheme(mode);
  useEffect(() => {
    const title = document.title,
      lang = document.documentElement.lang;
    const existing = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const description = existing ?? document.createElement('meta');
    const previous = existing?.getAttribute('content');
    description.name = 'description';
    description.content =
      '灵动参数管家为行内开发人员提供集中化参数管理，通过快照版本、发布前检查与运行时比对，让参数变更更可控。';
    if (!existing) document.head.append(description);
    document.title = '灵动参数管家｜让参数变更更可控';
    document.documentElement.lang = 'zh-CN';
    return () => {
      document.title = title;
      document.documentElement.lang = lang;
      if (existing) {
        if (previous === null) description.removeAttribute('content');
        else description.content = previous ?? '';
      } else description.remove();
    };
  }, []);
  useEffect(() => {
    let frame = 0;
    const position = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let id: string;
        try {
          id = decodeURIComponent(window.location.hash.slice(1)) || 'top';
        } catch {
          return;
        }
        const element = scrollRef.current?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
        element?.scrollIntoView({ block: 'start' });
      });
    };
    position();
    window.addEventListener('hashchange', position);
    window.addEventListener('popstate', position);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', position);
      window.removeEventListener('popstate', position);
    };
  }, []);
  return (
    <div
      data-landing-theme={theme}
      style={{ ...palettes[theme], height: '100%', minHeight: 0 } as CSSProperties}
    >
      <div className="relative h-full min-h-0 bg-[var(--landing-canvas)] text-[var(--landing-text)] transition-colors duration-200 [font-family:var(--app-font-family,system-ui,sans-serif)] [&_*]:box-border [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-solid [&_a:focus-visible]:outline-accent [&_a:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-accent [&_button:focus-visible]:outline-offset-3 [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-solid [&_summary:focus-visible]:outline-accent [&_summary:focus-visible]:outline-offset-3">
        {/* 专用切换关键帧就近内嵌；仅当前画面淡化，不延迟首屏或正文。 */}
        <style>{'@keyframes landing-detail {from {opacity:.55} to {opacity:1}}'}</style>
        <a
          href="#landing-main"
          className="absolute left-5 top-5 z-50 -translate-y-30 rounded-8px bg-[var(--landing-surface)] p-3 text-inherit focus:translate-y-0"
        >
          跳转到主要内容
        </a>
        <LandingHeader scrollRef={scrollRef} />
        <div
          ref={scrollRef}
          data-landing-scroll
          className="h-full overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]"
          onClick={(event) => {
            const link =
              event.target instanceof Element
                ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
                : null;
            if (!link) return;
            const id = link.hash.slice(1),
              target = scrollRef.current?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
            if (target) {
              if (window.location.hash === link.hash) {
                event.preventDefault();
                target.scrollIntoView({ block: 'start' });
              }
              target.tabIndex = -1;
              target.focus({ preventScroll: true });
            }
          }}
        >
          <main id="landing-main" className="scroll-mt-104px">
            <section
              id="top"
              data-hero
              className="relative isolate overflow-hidden pb-12 pt-130px min-[768px]:pb-18 min-[1200px]:pt-160px"
            >
              <FluidDots paused={paused} dark={theme === 'dark'} />
              <div
                className={`${container} relative grid items-center gap-10 min-[1200px]:grid-cols-[5fr_7fr] min-[1200px]:gap-12`}
              >
                <div className="relative py-5 before:pointer-events-none before:absolute before:-inset-8 before:-z-1 before:bg-[var(--landing-canvas)] before:opacity-90 before:blur-24px">
                  <p className={`mb-5 mt-0 flex items-center gap-2 text-14px ${muted}`}>
                    <span
                      aria-hidden="true"
                      className="i-lucide-sliders-horizontal text-[var(--landing-link)]"
                    />
                    灵动参数管家
                  </p>
                  <h1 className="m-0 text-[clamp(34px,3.7vw,52px)] font-700 leading-[1.25]">
                    让每一次参数变更，
                    <br />
                    更可控。
                  </h1>
                  <p
                    className={`mb-8 mt-6 max-w-520px text-16px leading-[1.9] min-[768px]:text-17px ${muted}`}
                  >
                    灵动参数管家为行内开发人员提供集中化参数管理，通过快照版本、发布前检查与运行时比对，降低漏配、误配和变更未生效的风险。
                  </p>
                  <Actions />
                  <p className={`mb-0 mt-6 text-12px leading-[1.8] ${muted}`}>
                    参数快照 · 发布前检查 · 运行时比对
                  </p>
                </div>
                <SpotlightCard
                  className="p-3! min-[768px]:p-5!"
                  theme={theme}
                  spotlightColor="var(--color-accent)"
                  intensity={0.05}
                >
                  <ProductPreview />
                </SpotlightCard>
              </div>
              <div className={`${container} relative mt-8 flex justify-end`}>
                <button
                  type="button"
                  aria-pressed={paused}
                  onClick={() => setPaused(!paused)}
                  className={`flex min-h-44px cursor-pointer items-center gap-2 rounded-8px border border-solid border-[var(--landing-border)] bg-[var(--landing-canvas)] px-3 text-12px ${muted}`}
                >
                  <span
                    aria-hidden="true"
                    className={paused ? 'i-lucide-play' : 'i-lucide-pause'}
                  />
                  {paused ? '继续背景' : '暂停背景'}
                </button>
              </div>
            </section>
            <StatsSection />
            <RiskSection theme={theme} />
            <WorkflowSection />
            <CapabilitiesSection />
            <IntegrationSection />
            <FaqSection />
          </main>
          <ClosingSection />
        </div>
      </div>
    </div>
  );
}
