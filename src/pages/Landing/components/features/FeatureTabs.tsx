import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, useState, type ReactNode } from 'react';
import { AnimatedContent } from '../../reactbits/AnimatedContent';
import { SectionHeading } from '../SectionHeading';
import { HotReloadPanel } from './HotReloadPanel';
import { RollbackTimeline } from './RollbackTimeline';
import { RuntimeDiff } from './RuntimeDiff';
import { VersionFlow } from './VersionFlow';

interface Feature {
  tab: string;
  title: string;
  description: string;
  demo: ReactNode;
}

const features: Feature[] = [
  {
    tab: '版本化',
    title: '像管理应用版本一样管理参数',
    description: '应用参数与公共参数合并为静态快照，每次变更留痕，可跨环境、跨版本比对。',
    demo: <VersionFlow />,
  },
  {
    tab: '发布与回退',
    title: '一键发布，一次点击回退',
    description: '快照直接发布到配置中心，生产发布需提权；任一历史版本随时回退。',
    demo: <RollbackTimeline />,
  },
  {
    tab: '热更新',
    title: '改完即生效，应用无需重启',
    description: '触发后实例立即加载最新配置，可先灰度一台验证再全量。',
    demo: <HotReloadPanel />,
  },
  {
    tab: '运行时比对',
    title: '精确到实例的生效校验',
    description: '对照每个实例运行时参数与平台已发布参数，快速定位未生效项。',
    demo: <RuntimeDiff />,
  },
];

const AUTOPLAY_SECONDS = 8;

const dotGrid = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '18px 18px',
};

/** 核心功能标签页：视口内自动轮播，悬停暂停，用户操作后停止轮播。 */
export function FeatureTabs() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: '-25% 0px -25% 0px' });
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [stopped, setStopped] = useState(false);
  const autoplay = !reduceMotion && inView && !hovering && !stopped;
  const feature = features[active];

  return (
    <section
      ref={sectionRef}
      id="features"
      aria-labelledby="features-title"
      className="mx-auto max-w-1200px scroll-mt-24 px-4 py-24 md:px-8 md:py-32"
    >
      <SectionHeading
        id="features-title"
        title={
          <>
            参数发布全流程，
            <br />
            自动化、可视化、版本化。
          </>
        }
        description="从保存参数到实例生效，每一步都看得见、退得回。"
      />

      <AnimatedContent delay={0.1} className="mt-12">
        <div className="flex items-end justify-between gap-4 border-b border-b-solid border-[var(--lp-line)]">
          <div role="tablist" aria-label="核心功能" className="flex gap-1 overflow-x-auto md:gap-6">
            {features.map((item, index) => (
              <button
                key={item.tab}
                id={`feature-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-controls="feature-panel"
                onClick={() => {
                  setActive(index);
                  setStopped(true);
                }}
                className={`relative shrink-0 cursor-pointer border-0 bg-transparent px-2 pb-3 pt-1 text-14px transition-colors md:px-0 md:text-15px ${
                  index === active ? 'text-[var(--lp-fg)]' : 'text-[var(--lp-muted)] hover:text-[var(--lp-fg)]'
                }`}
              >
                {item.tab}
                {index === active && (
                  <motion.span
                    key={`${active}-${autoplay}`}
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-px h-px origin-left bg-[var(--lp-fg)]"
                    initial={{ scaleX: autoplay ? 0 : 1 }}
                    animate={{ scaleX: 1 }}
                    transition={autoplay ? { duration: AUTOPLAY_SECONDS, ease: 'linear' } : { duration: 0 }}
                    onAnimationComplete={() => {
                      if (autoplay) setActive((current) => (current + 1) % features.length);
                    }}
                  />
                )}
              </button>
            ))}
          </div>
          <span className="hidden shrink-0 pb-3 font-mono text-12px text-[var(--lp-muted)] sm:inline">
            {String(active + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}
          </span>
        </div>

        <div
          id="feature-panel"
          role="tabpanel"
          aria-labelledby={`feature-tab-${active}`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onPointerDown={() => setStopped(true)}
          className="mt-6 overflow-hidden rounded-3xl border border-solid border-[var(--lp-line)] bg-[var(--lp-panel)]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
            >
              <div className="flex flex-col gap-4 p-6 md:p-10">
                <span className="font-mono text-12px tracking-wider text-[var(--lp-blue)]">
                  {String(active + 1).padStart(2, '0')} · {feature.tab}
                </span>
                <h3 className="m-0 text-balance text-24px font-700 leading-snug md:text-28px">{feature.title}</h3>
                <p className="m-0 text-pretty text-15px leading-relaxed text-[var(--lp-muted)]">
                  {feature.description}
                </p>
              </div>
              <div
                style={dotGrid}
                className="min-w-0 border-t border-t-solid border-[var(--lp-line)] bg-[var(--lp-bg)] p-4 md:border-l md:border-l-solid md:border-t-0 md:p-8"
              >
                {feature.demo}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </AnimatedContent>
    </section>
  );
}
