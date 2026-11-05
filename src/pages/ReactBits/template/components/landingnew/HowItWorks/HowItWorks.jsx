import { useEffect, useRef, useState } from 'react';
import { Link } from '@/pages/ReactBits/TemplateLink';
import { m } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import './HowItWorks.css';

const COMMAND = 'npx shadcn@latest add @react-bits/Aurora-TS-TW';

const OUTPUT = ['✔ Checking registry.', '✔ Created 1 file:', '  - components/Aurora.tsx'];

const CODE = [
  [
    ["'use client'", 'str'],
    [';', 'punc'],
  ],
  [],
  [
    ['import', 'kw'],
    [' { useEffect, useRef } ', 'ink'],
    ['from', 'kw'],
    [" 'react'", 'str'],
    [';', 'punc'],
  ],
  [],
  [
    ['const', 'kw'],
    [' Aurora ', 'ink'],
    ['= ({', 'punc'],
  ],
  [
    ['  colorStops', 'attr'],
    [' = [', 'punc'],
    ["'#5227FF'", 'str'],
    [', ', 'punc'],
    ["'#7cff67'", 'str'],
    [', ', 'punc'],
    ["'#5227FF'", 'str'],
    ['],', 'punc'],
  ],
  [
    ['  amplitude', 'attr'],
    [' = ', 'punc'],
    ['1', 'ink'],
    [',', 'punc'],
  ],
  [
    ['  blend', 'attr'],
    [' = ', 'punc'],
    ['0.5', 'ink'],
    [',', 'punc'],
  ],
  [
    ['  speed', 'attr'],
    [' = ', 'punc'],
    ['0.6', 'ink'],
    [',', 'punc'],
  ],
  [
    ['}: ', 'punc'],
    ['AuroraProps', 'ink'],
    [') => {', 'punc'],
  ],
  [
    ['  const', 'kw'],
    [' containerRef ', 'ink'],
    ['= ', 'punc'],
    ['useRef', 'ink'],
    ['<HTMLDivElement>(', 'punc'],
    ['null', 'kw'],
    [');', 'punc'],
  ],
];

const EDITED_LINE = 8;
const EASE = [0.21, 0.47, 0.32, 0.98];

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const life = useRef(null);
  useEffect(() => {
    const token = { active: true };
    life.current = token;
    return () => {
      token.active = false;
      window.clearTimeout(token.timer);
    };
  }, []);
  const copy = async () => {
    const token = life.current;
    try {
      await navigator.clipboard.writeText(COMMAND);
      if (!token.active) return;
      setCopied(true);
      setFailed(false);
      window.clearTimeout(token.timer);
      token.timer = window.setTimeout(() => setCopied(false), 1400);
    } catch {
      if (token.active) setFailed(true);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ln-how-copy"
        onClick={copy}
        aria-label={copied ? 'Install command copied' : 'Copy install command'}
      >
        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={13} strokeWidth={1.8} />
      </button>
      {failed && <span role="alert">Copy failed. Please select and copy the command.</span>}
    </>
  );
}

const HowItWorks = () => (
  <section className="ln-how-section">
    <div className="ln-how-inner">
      <m.div
        className="ln-how-copy-block"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h2 className="ln-how-title">保存参数，生成并发布快照。</h2>
        <p className="ln-how-sub">保存参数后生成快照，完成检查再发布，通过重启或热更新生效。</p>
        <Link to="https://reactbits.dev/get-started/installation" className="ln-how-btn">
          进入控制台
          <HugeiconsIcon icon={ArrowRight02Icon} size={17} strokeWidth={1.8} />
        </Link>
      </m.div>

      <m.div
        className="ln-how-visual"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.07, ease: EASE }}
      >
        <div className="ln-how-window ln-how-terminal">
          <div className="ln-how-bar">
            Terminal
            <CopyCommand />
          </div>
          <div className="ln-how-well ln-how-term">
            <div className="ln-how-term-line">
              <span className="ln-how-t-punc">$</span> {COMMAND}
            </div>
            {OUTPUT.map((line) => (
              <div className="ln-how-term-line ln-how-t-muted" key={line}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div
          className="ln-how-window ln-how-editor"
          role="img"
          aria-label="Aurora.tsx open in your editor as plain source"
        >
          <div className="ln-how-bar">Aurora.tsx</div>
          <pre className="ln-how-well ln-how-code">
            <code>
              {CODE.map((line, index) => (
                <span
                  className={`ln-how-line${index === EDITED_LINE ? ' is-edited' : ''}`}
                  key={index}
                >
                  {line.length
                    ? line.map(([text, kind], part) => (
                        <span className={`ln-how-t-${kind}`} key={part}>
                          {text}
                        </span>
                      ))
                    : ' '}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </m.div>
    </div>
  </section>
);

export default HowItWorks;
