import { lazy, Suspense } from 'react';
import { Link } from '@/pages/ReactBits/TemplateLink';
import { useReducedMotion } from 'motion/react';
import { FiArrowRight } from 'react-icons/fi';
import { useColorModeValue } from '../../setup/color-mode';
import { LOOK, presetProps } from '../../../demo/Backgrounds/presets/GradientWaves';
import useNearOnce from '../../../hooks/useNearOnce';
import { templateContent } from '@/pages/ReactBits/content';
import './CTA.css';

const GradientWaves = lazy(
  () => import('../../../content/Backgrounds/GradientWaves/GradientWaves'),
);

const CTA = ({
  actions,
  waveColors,
  secondaryHref = templateContent.closing.secondaryAction.to,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const light = useColorModeValue(true, false);
  const [nearRef, near] = useNearOnce();
  const lite =
    typeof document !== 'undefined' &&
    document.querySelector('[data-reactbits-template]')?.hasAttribute('data-lite');
  return (
    <div className="ln-cta-card" ref={nearRef}>
      {near && !prefersReducedMotion && (
        <div className="ln-cta-bg" aria-hidden="true">
          <Suspense fallback={null}>
            <GradientWaves
              {...presetProps('dusk', { light, defaults: LOOK })}
              {...waveColors}
              tilt={58}
              dpr={lite ? 0.75 : 1.25}
              quality={lite ? 'low' : 'medium'}
              intro
            />
          </Suspense>
        </div>
      )}
      <h2 className="ln-cta-headline">{templateContent.closing.title}</h2>

      <p className="ln-cta-sub">{templateContent.closing.description}</p>

      <div className="ln-cta-buttons">
        {actions ?? (
          <>
            <a
              href={templateContent.closing.primaryAction.to}
              className="ln-cta-btn ln-cta-btn--primary"
            >
              {templateContent.closing.primaryAction.label} <FiArrowRight size={15} />
            </a>
            <Link to={secondaryHref} className="ln-cta-btn ln-cta-btn--secondary">
              {templateContent.closing.secondaryAction.label}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default CTA;
