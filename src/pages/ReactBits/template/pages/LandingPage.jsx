import Features from '../components/landingnew/Features/Features';
import LiveDemo from '../components/landingnew/LiveDemo/LiveDemo';
import HowItWorks from '../components/landingnew/HowItWorks/HowItWorks';
import ProSpotlight from '../components/landingnew/ProSpotlight/ProSpotlight';
import Tools from '../components/landingnew/Tools/Tools';
import Sponsors from '../components/landingnew/Sponsors/Sponsors';
import Testimonials from '../components/landingnew/Testimonials/Testimonials';
import FAQ from '../components/landingnew/FAQ/FAQ';
import CTA from '../components/landingnew/CTA/CTA';
import Footer from '../components/landingnew/Footer/Footer';
/** 官方首页区块的本地组合；加载标记限制在模板根节点。 */
import { useTemplateRoot } from '@/pages/ReactBits/hooks/useTemplateTheme';
import { useEffect, useState } from 'react';
import { LazyMotion } from 'motion/react';
import Navbar from '../components/landingnew/Navbar/Navbar';
import Hero from '../components/landingnew/Hero/Hero';
import LandingLoader from '../components/landingnew/LandingLoader/LandingLoader';
import useScrollToTop from '../hooks/useScrollToTop';
import usePageSEO from '../hooks/usePageSEO';
import usePauseOffscreenAnimations from '../hooks/usePauseOffscreenAnimations';

const loadMotionFeatures = () => import('../utils/motionFeatures').then((module) => module.default);

const MIN_LOADER_MS = 800;
const MAX_FONT_WAIT_MS = 2500;
const LOADER_FADE_MS = 600;

const LandingPage = () => {
  const templateRoot = useTemplateRoot();
  const [phase, setPhase] = useState('loading');
  const [hidingLoader, setHidingLoader] = useState(false);
  const ready = phase === 'ready';

  useScrollToTop();
  usePageSEO();
  usePauseOffscreenAnimations(phase !== 'loading');

  useEffect(() => {
    if (ready) return;
    const root = templateRoot.current;
    if (!root) return;
    root.setAttribute('data-rb-landing-loading', '');

    return () => {
      root.removeAttribute('data-rb-landing-loading');
    };
  }, [ready, templateRoot]);

  useEffect(() => {
    let cancelled = false;
    let minimumTimer;
    let fontTimer;
    const started = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fontDeadline = new Promise((resolve) => {
      fontTimer = window.setTimeout(resolve, MAX_FONT_WAIT_MS);
    });
    const reveal = () => setPhase(reducedMotion ? 'ready' : 'revealing');

    Promise.race([document.fonts?.ready ?? Promise.resolve(), fontDeadline])
      .catch(() => {})
      .then(() => {
        window.clearTimeout(fontTimer);
        if (cancelled) return;
        const remaining = reducedMotion
          ? 0
          : Math.max(0, MIN_LOADER_MS - (performance.now() - started));
        if (remaining > 0) minimumTimer = window.setTimeout(reveal, remaining);
        else reveal();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(fontTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'revealing') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let secondFrame;
    let fadeTimer;
    const firstFrame = requestAnimationFrame(() => {
      if (reduced) {
        setPhase('ready');
        return;
      }
      secondFrame = requestAnimationFrame(() => {
        setHidingLoader(true);
        fadeTimer = window.setTimeout(() => setPhase('ready'), LOADER_FADE_MS);
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(fadeTimer);
    };
  }, [phase]);

  return (
    <LazyMotion features={loadMotionFeatures}>
      {!ready && <LandingLoader hiding={hidingLoader} />}
      <section
        className={`landing-wrapper no-side-fades ${phase === 'loading' ? 'ln-loading' : 'ln-loaded'}`}
        inert={!ready}
      >
        <Navbar />
        <Hero />
        <Features />
        <LiveDemo />
        <HowItWorks />
        <ProSpotlight />
        <Tools />
        <Sponsors />
        <Testimonials />
        <FAQ />
        <Footer lead={<CTA />} />
      </section>
    </LazyMotion>
  );
};

export default LandingPage;
