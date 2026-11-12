/** 三项核心功能依次展开，每项插图在自己的展示区域内播放。 */
import { theme } from 'antd';
import { m as motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { withAlpha } from '../../model/themeColors';
import { RuntimePreview, VersionPreview } from './previews';

import ReleasePreview from './ReleasePreview';

const features = [
  {
    id: 'version',
    title: ['参数版本化管理'],
    description:
      '通过参数快照机制实现版本化管理，完整记录每次参数变更，支持历史追溯及跨环境、跨版本的参数比对。发生误操作时，可快速恢复至指定版本，保障数据安全',
    Preview: VersionPreview,
  },
  {
    id: 'release',
    title: ['参数一键发布', '与回退'],
    description:
      '支持在办公网查询生产参数，提权后可一键将参数快照发布到配置中心。发布前可比对当前参数与待发布快照，也可选择历史快照快速回退。',
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

function FeatureCopy({ feature }: { feature: (typeof features)[number] }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={feature.id === 'version' && !reduce ? 'hidden' : 'visible'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
        }}
        id={`core-feature-${feature.id}`}
        className="m-0 scroll-mt-22 text-3xl font-medium leading-[1.1] tracking-tight text-text [@media(min-width:640px)_and_(max-width:1023.98px)]:text-4xl [@media(min-width:1024px)]:text-5xl"
      >
        {feature.title.map((line) => (
          <span key={line} className={feature.id === 'runtime' ? 'block' : 'inline-block'}>
            {line}
          </span>
        ))}
      </motion.h2>
      <motion.p
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.45, delay: 0.16, ease: 'easeOut' },
          },
        }}
        className="m-0 mt-5 max-w-xl text-base leading-relaxed text-text-secondary [@media(min-width:640px)]:text-lg"
      >
        {feature.description}
      </motion.p>
    </motion.div>
  );
}

function CoreFeature({ feature }: { feature: (typeof features)[number] }) {
  const preview = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { Preview } = feature;
  const releasePreview = feature.id === 'release';

  useEffect(() => {
    const node = preview.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-labelledby={`core-feature-${feature.id}`}
      className={`grid min-w-0 items-start gap-10 [@media(min-width:1024px)]:items-center [@media(min-width:1024px)]:gap-16 ${releasePreview ? '[@media(min-width:1024px)]:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]' : '[@media(min-width:1024px)]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]'}`}
    >
      <div
        className={`min-w-0 ${releasePreview ? '[@media(min-width:1024px)]:w-full [@media(min-width:1024px)]:max-w-xl [@media(min-width:1024px)]:justify-self-end' : ''}`}
      >
        <FeatureCopy feature={feature} />
      </div>
      <div
        ref={preview}
        className={`min-w-0 ${releasePreview ? '[@media(min-width:1024px)]:order-first' : ''}`}
        style={{ '--core-preview-play-state': visible ? 'running' : 'paused' } as CSSProperties}
      >
        <Preview />
      </div>
    </section>
  );
}

export default function LandingCoreFeatures() {
  const { token } = theme.useToken();
  const colors = {
    '--core-feature-tint': withAlpha(token.colorPrimary, 0.12),
    '--core-feature-ink': token.colorPrimaryTextActive,
  } as CSSProperties;

  return (
    <section
      aria-label="核心功能"
      style={colors}
      className="mx-auto grid w-full max-w-1280px gap-20 py-12 pl-44px pr-32px [@media(max-width:768px)]:px-22px [@media(min-width:1024px)]:gap-28 [@media(min-width:1024px)]:py-20"
    >
      {features.map((feature) => (
        <CoreFeature key={feature.id} feature={feature} />
      ))}
      <style>{`
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
