/**
 * 公开产品介绍页：独立滚动容器与固定深色配色，不依赖登录状态和平台主题。
 * 动效组件移植自 React Bits，统一遵循系统“减弱动态效果”偏好。
 */
import { useState, type CSSProperties } from 'react';
import { MotionConfig } from 'motion/react';
import { paletteVariables } from './palette';
import { LandingHeader } from './components/LandingHeader';
import { HeroSection } from './components/HeroSection';
import { CapabilityMarquee } from './components/CapabilityMarquee';
import { FeatureTabs } from './components/features/FeatureTabs';
import { AdvantagesGrid } from './components/AdvantagesGrid';
import { StatsSection } from './components/StatsSection';
import { CompareSection } from './components/CompareSection';
import { CtaFooter } from './components/CtaFooter';

const rootStyle = {
  ...paletteVariables,
  fontFamily: '"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", system-ui, sans-serif',
  colorScheme: 'dark',
} as CSSProperties;

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  return (
    <MotionConfig reducedMotion="user">
      <div
        style={rootStyle}
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 16)}
        className="h-full overflow-y-auto scroll-smooth bg-[var(--lp-bg)] text-[var(--lp-fg)] antialiased"
      >
        <LandingHeader scrolled={scrolled} />
        <main>
          <HeroSection />
          <CapabilityMarquee />
          <FeatureTabs />
          <AdvantagesGrid />
          <StatsSection />
          <CompareSection />
          <CtaFooter />
        </main>
      </div>
    </MotionConfig>
  );
}
