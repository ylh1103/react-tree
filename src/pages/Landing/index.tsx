/** 落地页只组装各独立模块；后续产品能力、流程等区块在此按顺序接入。 */
import 'virtual:features-13-utilities.css';
import 'virtual:landing-core-features-utilities.css';
import 'virtual:how-it-works-9-utilities.css';
import 'virtual:stats-4-utilities.css';
import 'virtual:faq-6-utilities.css';
import { LazyMotion } from 'motion/react';
import { theme } from 'antd';
import type { CSSProperties } from 'react';
import LandingProvider from './LandingProvider';
import LandingNavigation from './components/LandingNavigation';
import LandingHero from './components/LandingHero';
import LandingCoreFeatures from './components/LandingCoreFeatures';
import Features13 from './components/LandingRiskFeatures';
import LandingReleaseFlow from './components/LandingReleaseFlow';
import LandingAdoptionStats from './components/LandingAdoptionStats';
import LandingFaq from './components/LandingFaq';
import LandingClosing from './components/LandingClosing';

const loadMotionFeatures = () => import('./model/motionFeatures').then((module) => module.default);

/** 原始 TSX 依赖 Tailwind Preflight，局部补齐浏览器默认样式。 */
function LandingFeaturesSection() {
  const { token } = theme.useToken();
  const style = { '--landing-risk-warning-bg': token.colorWarningBg } as CSSProperties;

  return (
    <div id="features" style={style}>
      <style>{`
        :where(#features *) { border: 0 solid; }
        :where(#features h2, #features h3, #features p) { margin: 0; }
        :where(#features button) {
          background: transparent;
          color: inherit;
          font: inherit;
          padding: 0;
        }
      `}</style>
      <Features13 />
    </div>
  );
}

export default function Landing() {
  return (
    <LazyMotion features={loadMotionFeatures}>
      <LandingProvider>
        <LandingNavigation />
        <main id="landing-main" tabIndex={-1} className="outline-none">
          <LandingHero />
          <div
            id="core-features"
            className="scroll-mt-10 bg-[var(--landing-hero-background)] [@media(min-width:860px)]:scroll-mt-0"
          >
            <LandingCoreFeatures />
          </div>
          <LandingFeaturesSection />
          <div id="how-it-works" className="scroll-mt-22">
            <LandingReleaseFlow />
          </div>
          <LandingAdoptionStats />
          <LandingFaq />
        </main>
        <LandingClosing />
      </LandingProvider>
    </LazyMotion>
  );
}
