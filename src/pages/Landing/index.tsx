/** 落地页只组装各独立模块；后续产品能力、流程等区块在此按顺序接入。 */
import { LazyMotion } from 'motion/react';
import LandingProvider from './LandingProvider';
import LandingNavigation from './components/LandingNavigation';
import LandingHero from './components/LandingHero';
const loadMotionFeatures = () => import('./model/motionFeatures').then((module) => module.default);

export default function Landing() {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <LandingProvider>
        <LandingNavigation />
        <main id="landing-main" tabIndex={-1} className="outline-none">
          <LandingHero />
        </main>
      </LandingProvider>
    </LazyMotion>
  );
}
