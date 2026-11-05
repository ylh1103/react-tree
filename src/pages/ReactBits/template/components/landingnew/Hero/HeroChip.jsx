import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '@/pages/ReactBits/TemplateLink';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { templateContent } from '@/pages/ReactBits/content';
const ITEMS = templateContent.announcements;

const INTERVAL = 3200;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const HeroChip = () => {
  const [{ index, previous }, setRoll] = useState({ index: 0, previous: -1 });
  const [held, setHeld] = useState(false);
  const [widths, setWidths] = useState([]);
  const labelRefs = useRef([]);

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (!cancelled)
        setWidths(labelRefs.current.map((el) => (el ? Math.ceil(el.scrollWidth) : 0)));
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (held || ITEMS.length < 2 || prefersReducedMotion()) return undefined;
    const id = setInterval(() => {
      setRoll((roll) => ({ index: (roll.index + 1) % ITEMS.length, previous: roll.index }));
    }, INTERVAL);
    return () => clearInterval(id);
  }, [held]);

  const item = ITEMS[index];
  if (!item) return null;

  return (
    <Link
      to={item.to}
      className="lh-chip"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <span className="lh-chip-tag">New</span>
      <span className="lh-chip-roll" style={widths[index] ? { width: widths[index] } : undefined}>
        {ITEMS.map((entry, i) => (
          <span
            key={entry.label}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            aria-hidden={i !== index}
            className={`lh-chip-label${i === index ? ' is-in' : i === previous ? ' is-out' : ''}`}
          >
            {entry.label}
          </span>
        ))}
      </span>
      <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={1.8} />
    </Link>
  );
};

export default HeroChip;
