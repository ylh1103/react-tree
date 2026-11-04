/**
 * 公开产品介绍页：独立滚动容器与固定浅色配色，不依赖登录状态和平台主题。
 * 动效组件移植自 React Bits，统一遵循系统“减弱动态效果”偏好。
 */
import type { CSSProperties } from 'react';
import { ConfigProvider, theme } from 'antd';
import { MotionConfig } from 'motion/react';
import { palette, paletteVariables } from './palette';
import { LandingHeader } from './components/LandingHeader';
import { HeroSection } from './components/HeroSection';
import { IntroSection } from './components/IntroSection';
import { AdvantagesSection } from './components/AdvantagesSection';
import { WorkflowSection } from './components/WorkflowSection';
import { FeatureGrid } from './components/FeatureGrid';
import { StatsSection } from './components/StatsSection';
import { CompareSection } from './components/CompareSection';
import { CtaFooter } from './components/CtaFooter';

const landingTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: palette.blue,
    colorText: palette.ink,
    colorBorder: palette.line,
    borderRadius: 10,
    controlHeightLG: 48,
    fontSizeLG: 15,
  },
};

export default function Landing() {
  return (
    <ConfigProvider theme={landingTheme}>
      <MotionConfig reducedMotion="user">
        <div
          style={paletteVariables as CSSProperties}
          className="h-full overflow-y-auto scroll-smooth bg-[var(--lp-paper)] text-[var(--lp-ink)]"
        >
          <LandingHeader />
          <main>
            <HeroSection />
            <IntroSection />
            <AdvantagesSection />
            <WorkflowSection />
            <FeatureGrid />
            <StatsSection />
            <CompareSection />
            <CtaFooter />
          </main>
        </div>
      </MotionConfig>
    </ConfigProvider>
  );
}
