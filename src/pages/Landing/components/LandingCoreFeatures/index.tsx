/** 核心功能轮播。离开视口或悬停在内容上时清零，恢复播放时重新计时。 */
import { Button, theme } from 'antd';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { withAlpha } from '../../model/themeColors';
import { ReleasePreview, RuntimePreview, VersionPreview } from './previews';

const features = [
  {
    id: 'version',
    title: ['参数版本化管理'],
    description:
      '合并应用参数与公共参数，生成静态快照。每次变更都有版本可追溯，支持跨环境、跨版本比对。',
    Preview: VersionPreview,
  },
  {
    id: 'release',
    title: ['参数一键发布', '与回退'],
    description:
      '发布前比对配置中心的当前值与目标快照。确认后可一键发布，也可选择历史快照快速回退。',
    Preview: ReleasePreview,
  },
  {
    id: 'runtime',
    title: ['参数热更新与', '运行时参数可视化'],
    description:
      '对支持热更新的应用，触发实例加载最新配置。按实例查看运行时参数，与配置中心逐项比对。',
    Preview: RuntimePreview,
  },
];

export default function LandingCoreFeatures() {
  const { token } = theme.useToken();
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [visible, setVisible] = useState(false);
  const playing = visible && !hovering && !keyboardFocus;
  const { id, Preview } = features[active];
  const colors = {
    '--core-feature-tint': withAlpha(token.colorPrimary, 0.12),
    '--core-feature-ink': token.colorPrimaryTextActive,
  } as CSSProperties;

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') setHovering(true);
  }

  function handlePointerLeave() {
    setHovering(false);
  }

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={section}
      aria-label="核心功能"
      style={colors}
      className="mx-auto w-full max-w-1280px py-12 pl-44px pr-32px [@media(max-width:768px)]:px-22px [@media(min-width:1024px)]:py-20"
    >
      <div className="relative grid items-start gap-10 [@media(min-width:1024px)]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] [@media(min-width:1024px)]:gap-16">
        <div
          className="relative z-1 min-w-0"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerDown={() => setKeyboardFocus(false)}
          onFocus={(event) => setKeyboardFocus(event.target.matches(':focus-visible'))}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false);
          }}
        >
          <div
            role="group"
            aria-label="选择核心功能"
            className="absolute right-full top-0 grid justify-items-center [@media(min-width:769px)]:mr-2"
          >
            {features.map((feature, index) => (
              <Button
                key={feature.id}
                type="text"
                aria-label={feature.title.join('')}
                aria-pressed={index === active}
                aria-controls="landing-core-feature-panel"
                onClick={() => setActive(index)}
                className="h-auto! w-22px! min-w-0! rounded-6px! bg-transparent! px-0! py-4px! layout-focus hover:bg-transparent! active:bg-transparent! [@media(min-width:769px)]:w-8!"
              >
                <span
                  aria-hidden="true"
                  className={`relative block w-8px overflow-hidden rounded-full bg-[var(--landing-preview-frame)] transition-[height] duration-300 motion-reduce:transition-none ${index === active ? 'h-50px' : 'h-24px'}`}
                >
                  {index === active && playing && (
                    <span
                      key={id}
                      className="absolute inset-x-0 top-0 rounded-full bg-[var(--landing-preview-dot)] motion-reduce:hidden [animation:landing-feature-progress_6s_linear_both]"
                      onAnimationEnd={() => setActive((current) => (current + 1) % features.length)}
                    />
                  )}
                  {index === active && (
                    <span className="absolute inset-0 hidden rounded-full bg-[var(--landing-preview-dot)] motion-reduce:block" />
                  )}
                </span>
              </Button>
            ))}
          </div>
          <div id="landing-core-feature-panel" aria-live={playing ? 'off' : 'polite'}>
            <div className="grid">
              {/* 同一网格单元以最长文案确定高度，切换时不会推移插图或下方内容。 */}
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  aria-hidden={index !== active}
                  className={`col-start-1 row-start-1 ${index === active ? '[animation:landing-feature-reveal_360ms_ease-out_both] motion-reduce:animate-none!' : 'invisible'}`}
                >
                  <h2 className="m-0 text-3xl font-medium leading-[1.1] tracking-tight text-text [@media(min-width:640px)_and_(max-width:1023.98px)]:text-4xl [@media(min-width:1024px)]:text-5xl">
                    {feature.title.map((line) => (
                      <span
                        key={line}
                        className={feature.id === 'runtime' ? 'block' : 'inline-block'}
                      >
                        {line}
                      </span>
                    ))}
                  </h2>
                  <p className="m-0 mt-5 max-w-xl text-base leading-relaxed text-text-secondary [@media(min-width:640px)]:text-lg">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="min-w-0"
          style={{ '--core-preview-play-state': visible ? 'running' : 'paused' } as CSSProperties}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          <Preview />
        </div>
      </div>
      <style>{`
        @keyframes landing-feature-progress {
          from { height: 0; }
          to { height: 100%; }
        }
        @keyframes landing-feature-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes landing-feature-preview-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes landing-feature-panel-in {
          from {
            opacity: 0;
            transform: translateY(var(--core-preview-offset, 8px)) var(--core-preview-angle, scale(1));
          }
        }
      `}</style>
    </section>
  );
}
