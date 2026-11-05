/** React Bits 首页复刻。页面展示状态就近维护，外部产品和文档链接保留原站目的地。 */
import { useEffect, useState, type CSSProperties } from 'react';
import Button from 'antd/es/button';
import ConfigProvider from 'antd/es/config-provider';
import theme from 'antd/es/theme';
import WavePlayground, { CopyCommand } from './components/WavePlayground';
import HoldButton from './components/HoldButton';
import Carousel from './components/Carousel';
import Faq from './components/Faq';
import { github, pro, source } from './model/presets';

const assets = '/landing/';
const container = 'mx-auto w-full max-w-1324px px-24px max-[640px]:px-16px';
const heading = 'm-0 text-[clamp(28px,2.6vw,42px)] font-500 leading-[1.08] tracking-[-0.036em]';
const card =
  'min-w-0 overflow-hidden rounded-16px border border-solid border-border-subtle bg-surface p-5px shadow-[inset_0_1px_0_#ffffff08] transition-transform duration-300 hover:-translate-y-2px';

const features = [
  [
    '215+ Components',
    "Backgrounds, text effects, animations, creative UI components. The stuff you'd build from scratch, already done and battle-tested.",
    'col-span-5',
  ],
  [
    'Visual Editors',
    'Five free tools to play with components & create stunning assets for your work.',
    'col-span-3',
  ],
  [
    'Well Organized',
    "Five clear categories so you're not scrolling through a wall of unrelated stuff.",
    'col-span-4',
  ],
  [
    'Pick Your Stack',
    'JavaScript or TypeScript, CSS or Tailwind. Every component comes in all four flavors for full flexibility.',
    'col-span-4',
  ],
  [
    'AI-Ready',
    'The docs give you ready-to-use prompts. Works great with Cursor, Copilot, and v0. Describe what you need, drop it in, ship.',
    'col-span-5',
  ],
  [
    'Growing Fast',
    "React's fastest-growing component library on GitHub. Not even close.",
    'col-span-3',
  ],
];
const demos = [
  ['Micro Slats', 'Backgrounds', '/backgrounds/micro-slats', 'col-span-7'],
  ['Electric Logo', 'Animations', '/animations/electric-logo', 'col-span-5'],
  ['Tech Text', 'Text Animations', '/text-animations/tech-text', 'col-span-4'],
  ['Circular Carousel', 'Components', '/components/circular-carousel', 'col-span-5'],
  ['Hold Button', 'Micro', '/micro/hold-button', 'col-span-3'],
];
const products = [
  [
    '230 animated components',
    'Shaders, 3D, cursor effects and text, in Tailwind or plain CSS.',
    '/components',
  ],
  [
    '300 page sections',
    'Heroes, pricing, FAQs and footers that stack into a full landing page.',
    '/blocks',
  ],
  [
    '300 app UI blocks',
    'Dashboards, tables, AI chat and auth, in two styles and one theme panel.',
    '/app-ui',
  ],
  ['15 full templates', 'Multi-page Next.js sites. Swap the copy and deploy.', '/templates'],
  ['20 agent skills', 'Give Claude Code, Cursor and Copilot real design taste.', '/agent-kit'],
];
const tools = [
  [
    'Background Studio',
    'Pick an animated background, start from a preset, tune it live, then export the code, a 4K image or a looping video.',
    'background-studio',
  ],
  [
    'Center Stage',
    'Turn screenshots and recordings into polished product shots. Perfect for launch videos or demos.',
    'center-stage',
  ],
  [
    'Shape Magic',
    'Design a logo mark or style your own logo with 3D materials. Export SVG, PNG, favicons, video or React.',
    'shape-magic',
  ],
  [
    'Texture Lab',
    'Stack animated effects on a photo, video or your camera, then export an image, a video, a GIF or a shareable style.',
    'texture-lab',
  ],
  [
    'Sound Lab',
    'Interface and video sounds, tune them live, then install one with a single command or download WAV, MP3 or OGG.',
    'sound-lab',
  ],
];
const testimonials = [
  ['Everything about this is next level: the components, the registry, dynamic items.', 'shadcn'],
  [
    "React Bits has become the ultimate visual animation library for React. This level of flexibility doesn't exist anywhere else.",
    'orcdev',
  ],
  [
    'Have you heard of react bits? David Haz has lovingly put together a collection of animated and fully customizable React components.',
    'DIYDevs',
  ],
  [
    'React Bits: A stellar collection of React components to make your landing pages shine ✨',
    'gregberge_',
  ],
  ['Literally the coolest react library in react —', 'Logreg_n_coffee'],
  [
    'Got to know about React Bits and its just wow, the components are incredibly well designed! Really loved the overall feel and quality.',
    'irohandev',
  ],
  [
    'React Bits has got to be the most artistic ui component lib I have seen in a while 🤌',
    'GibsonSMurray',
  ],
  [
    'Just discovered reactbits.dev — a sleek, minimal, and super dev-friendly React component library. Clean UI, easy to use, and perfect for modern projects.',
    'syskey_dmg',
  ],
  [
    'Really impressed by reactbits.dev. Check it out. The Splash Cursor effect is amazing.',
    'makwanadeepam',
  ],
];

function DiagonalArrow() {
  return (
    <span
      aria-hidden="true"
      className="i-lucide-arrow-up size-1em align-middle rotate-45 text-12px text-text-muted"
    />
  );
}
function Brand({ light }: { light: boolean }) {
  return (
    <img
      src={`${assets}brand.svg`}
      alt="React Bits"
      width="100"
      height="20"
      className={light ? 'brightness-0' : ''}
    />
  );
}

export default function LoadingCopy() {
  const [light, setLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcement, setAnnouncement] = useState(0);
  const announcements = ['React Bits 2.0', 'Center Stage', 'Sound Lab', '35 Micro components'];
  const announcementPaths = [
    '/get-started/changelog',
    '/tools/center-stage',
    '/tools/sound-lab',
    '/c/micro',
  ];
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setAnnouncement((current) => (current + 1) % 4), 3200);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, []);
  const colors = {
    '--color-canvas': light ? '#ffffff' : '#120f17',
    '--color-surface': light ? '#f4f4f5' : '#1c1822',
    '--color-text': light ? '#17151c' : '#f6f4f9',
    '--color-text-secondary': light ? '#5b5866' : '#a09ca7',
    '--color-text-muted': light ? '#9b98a4' : '#77737e',
    '--color-border-subtle': light ? '#18181b12' : '#ffffff0e',
    '--landing-window': light ? '#f2f2f5bd' : '#18151ecc',
    '--landing-well': light ? '#ffffff9e' : '#08060c4d',
    '--landing-selected': light ? '#18181b0e' : '#ffffff10',
    colorScheme: light ? 'light' : 'dark',
    '--landing-alt': light ? '#fafafa' : '#0e0b13',
  } as CSSProperties;
  const navigation = [
    ['Docs', '/get-started/introduction'],
    ['Tools', '/tools'],
    ['Pro', '/pro'],
    ['Sponsors', '/sponsors'],
  ];
  return (
    <ConfigProvider
      theme={{
        algorithm: light ? theme.defaultAlgorithm : theme.darkAlgorithm,
        token: {
          fontFamily: 'LandingGeist, sans-serif',
          colorPrimary: '#a855f7',
          colorText: light ? '#17151c' : '#f6f4f9',
          colorTextSecondary: light ? '#5b5866' : '#a09ca7',
          colorBorder: light ? '#18181b12' : '#ffffff0f',
          borderRadius: 12,
          colorBgContainer: light ? '#ffffff' : '#221e29',
        },
      }}
    >
      <div
        lang="en"
        style={colors}
        data-testid="landing-page"
        data-theme={light ? 'light' : 'dark'}
        className="relative h-full overflow-y-auto overflow-x-hidden bg-canvas text-text font-[LandingGeist,sans-serif] [--landing-pro-padding:20px] max-[640px]:[--landing-pro-padding:13px] [--landing-cta-height:46px] max-[640px]:[--landing-cta-height:48px] [&_a]:no-underline [&_a]:text-inherit [&_a]:transition-colors [&_a:hover]:text-text [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-accent [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-accent"
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 40)}
      >
        <style>{`@font-face{font-family:LandingGeist;src:url('/landing/geist.woff2') format('woff2');font-weight:100 900;font-display:swap}@font-face{font-family:LandingMono;src:url('/landing/geist-mono.woff2') format('woff2');font-weight:100 900;font-display:swap}`}</style>
        <a
          href="#landing-content"
          className="absolute -top-100px z-50 rounded-8px bg-surface p-12px focus:top-20px"
        >
          Skip to content
        </a>
        <header
          className={`fixed left-44px right-32px top-20px z-20 mx-auto rounded-16px max-[640px]:left-16px max-[640px]:right-16px max-[640px]:px-6px ${scrolled || menuOpen ? 'max-w-1276px border border-solid border-border-subtle bg-[var(--landing-window)] px-20px backdrop-blur-24px max-[640px]:px-6px' : ''}`}
        >
          <div className="flex h-56px items-center justify-between gap-12px">
            <div className="flex items-center gap-24px max-[640px]:gap-12px">
              <a href="#landing-content" aria-label="React Bits home">
                <Brand light={light} />
              </a>
              <span className="max-[899px]:hidden">/</span>
              <nav
                aria-label="Main navigation"
                className="flex items-center gap-28px text-13px font-500 tracking-[.02em] max-[899px]:hidden"
              >
                {navigation.map(([label, path]) => (
                  <a key={label} href={`${source}${path}`} className="hover:opacity-70">
                    {label}
                    {label === 'Tools' && (
                      <span className="ml-6px rounded-3px bg-[var(--landing-selected)] px-5px py-2px text-9px">
                        New
                      </span>
                    )}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-12px">
              <Button
                type="text"
                aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
                onClick={() => setLight((current) => !current)}
                icon={
                  light ? (
                    <span aria-hidden="true" className="i-lucide-moon size-1em align-middle " />
                  ) : (
                    <span aria-hidden="true" className="i-lucide-sun size-1em align-middle " />
                  )
                }
                className="h-36px! w-36px! rounded-10px! bg-surface! text-text-secondary!"
              />
              <Button
                href={github}
                icon={
                  <span aria-hidden="true" className="i-lucide-github size-1em align-middle " />
                }
                className="h-36px! border-0! bg-surface! text-text! max-[899px]:hidden!"
              >
                43.5k
              </Button>
              <Button
                type="primary"
                href={pro}
                className="h-36px! border-0! rounded-10px! px-[var(--landing-pro-padding)]! text-13px! font-600!"
              >
                <span className="max-[640px]:hidden">Get React Bits Pro</span>
                <span className="hidden min-[641px]:hidden max-[640px]:inline">Get Pro</span>
              </Button>
              <Button
                type="text"
                aria-label="Menu"
                aria-expanded={menuOpen}
                aria-controls="landing-mobile-menu"
                onClick={() => setMenuOpen((current) => !current)}
                icon={
                  menuOpen ? (
                    <span aria-hidden="true" className="i-lucide-x size-1em align-middle " />
                  ) : (
                    <span aria-hidden="true" className="i-lucide-menu size-1em align-middle " />
                  )
                }
                className="hidden! h-36px! w-36px! rounded-10px! bg-surface! max-[899px]:inline-flex!"
              />
            </div>
          </div>
          {menuOpen && (
            <nav
              id="landing-mobile-menu"
              aria-label="Mobile navigation"
              className="flex flex-col gap-4px pb-12px min-[900px]:hidden"
            >
              {[...navigation, ['GitHub 43.5k', github]].map(([label, path]) => (
                <a
                  key={label}
                  href={path.startsWith('http') ? path : `${source}${path}`}
                  className="flex justify-between rounded-8px px-12px py-14px text-14px hover:bg-surface"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                  <span
                    aria-hidden="true"
                    className="i-lucide-arrow-right size-1em align-middle "
                  />
                </a>
              ))}
            </nav>
          )}
        </header>
        <main id="landing-content">
          <section className="mx-auto max-w-1728px pb-72px pl-44px pr-32px pt-130px max-[899px]:px-22px max-[899px]:pt-100px">
            <a
              href={`${source}${announcementPaths[announcement]}`}
              className="mb-26px max-[640px]:mb-20px inline-flex h-32px items-center gap-8px rounded-10px border border-solid border-border-subtle bg-surface py-4px pl-4px pr-12px text-13px font-500"
            >
              <span
                className={`flex h-24px items-center rounded-6px px-8px text-12px font-600 ${light ? 'bg-[#17151c] text-white' : 'bg-[#f4f2f7] text-[#141118]'}`}
              >
                New
              </span>
              {announcements[announcement]}
              <span
                aria-hidden="true"
                className="i-lucide-arrow-right size-1em align-middle text-text-muted"
              />
            </a>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-64px max-[1100px]:grid-cols-1">
              <h1 className="m-0 text-[clamp(32px,2.9vw,54px)] font-500 leading-[1.1] tracking-[-.036em] max-[640px]:text-[clamp(27px,7.4vw,34px)] max-[640px]:leading-[1.12]">
                Animated React components for
                <br className="max-[1100px]:hidden" /> websites people remember.
              </h1>
              <p className="row-span-2 m-0 self-end text-[clamp(15px,1.1vw,18px)] leading-[1.55] tracking-[-.01em] text-text-secondary max-[1100px]:row-span-1 max-[1100px]:mt-18px max-[640px]:mt-16px">
                217 animated components and backgrounds for React.
                <br className="max-[1100px]:hidden" /> Tune them yourself, or hand them to your
                agent.
              </p>
              <div className="mt-30px flex gap-10px max-[640px]:mt-26px max-[640px]:flex-col">
                <Button
                  href={`${source}/get-started/index`}
                  icon={
                    <span
                      aria-hidden="true"
                      className="i-lucide-arrow-right size-1em align-middle "
                    />
                  }
                  iconPlacement="end"
                  className={`h-[var(--landing-cta-height)]! rounded-13px! px-20px! text-15px! font-500! ${light ? 'bg-[#18171c]! text-white! border-0!' : 'bg-[#f4f2f7]! text-[#141118]! border-0!'}`}
                >
                  Browse components
                </Button>
                <Button
                  href={github}
                  className="h-[var(--landing-cta-height)]! rounded-13px! px-20px! text-15px!"
                >
                  Star on GitHub
                </Button>
              </div>
            </div>
            <WavePlayground light={light} />
          </section>
          <section className="pb-100px pt-80px max-[640px]:py-40px" aria-labelledby="inside-title">
            <div className={container}>
              <h2 id="inside-title" className={`${heading} mb-40px`}>
                What&apos;s inside
              </h2>
              <div className="grid grid-cols-12 gap-16px max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1">
                {features.map(([title, description, span], index) => (
                  <article key={title} className={`${card} ${span} max-[1024px]:col-span-1`}>
                    <img
                      src={`${assets}feature-${index + 1}.png`}
                      alt=""
                      loading="lazy"
                      width="510"
                      height="172"
                      className={`block h-172px w-full rounded-11px object-cover ${light ? 'invert' : ''}`}
                    />
                    <div className="px-17px pb-15px pt-16px">
                      <h3 className="m-0 mb-6px text-15px font-600 tracking-[-.01em]">{title}</h3>
                      <p className="m-0 text-13px leading-[1.55] text-text-secondary">
                        {description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
          <section
            className="bg-[var(--landing-alt)] py-80px max-[640px]:py-60px"
            aria-labelledby="demos-title"
          >
            <div className={container}>
              <h2 id="demos-title" className={`${heading} mb-44px`}>
                See them in action
              </h2>
              <div className="grid grid-cols-12 gap-12px max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1">
                {demos.map(([title, category, path, span], index) => (
                  <article
                    key={title}
                    className={`${card} ${span} max-[1024px]:col-span-1 ${index === 4 ? 'max-[1024px]:col-span-full max-[640px]:col-span-1' : ''}`}
                  >
                    <div
                      className={`${index < 2 ? 'h-320px' : 'h-220px'} overflow-hidden rounded-11px bg-[var(--landing-alt)] max-[640px]:h-240px`}
                    >
                      {index === 4 ? (
                        <HoldButton />
                      ) : index === 3 ? (
                        <Carousel />
                      ) : (
                        <a href={`${source}${path}`} aria-label={`Explore ${title}`}>
                          <img
                            src={`${assets}demo-${index + 1}.png`}
                            alt={
                              title === 'Tech Text' ? 'Bits — animated technical typography' : ''
                            }
                            loading="lazy"
                            className={`block h-full w-full object-cover transition-transform duration-500 hover:scale-105 ${light ? 'invert' : ''}`}
                          />
                        </a>
                      )}
                    </div>
                    <a
                      href={`${source}${path}`}
                      className="flex items-center justify-between gap-8px px-12px pb-8px pt-13px"
                    >
                      <span className="text-14px font-600">{title}</span>
                      <span className="flex items-center gap-6px text-12px text-text-muted">
                        {category}
                        <DiagonalArrow />
                      </span>
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </section>
          <section className="bg-[var(--landing-alt)] py-112px max-[640px]:py-72px">
            <div
              className={`${container} grid grid-cols-[5fr_7fr] items-center gap-64px max-[899px]:grid-cols-1 max-[640px]:gap-40px`}
            >
              <div>
                <h2 className={heading}>One command, and the code is yours.</h2>
                <p className="mt-18px max-w-44ch text-15px leading-[1.65] text-text-secondary">
                  The CLI copies the component&apos;s source into your Vite, Next.js, Astro or Remix
                  project. No wrapper library, no runtime dependency, nothing to lock you in.
                </p>
                <Button
                  href={`${source}/get-started/installation`}
                  icon={
                    <span
                      aria-hidden="true"
                      className="i-lucide-arrow-right size-1em align-middle "
                    />
                  }
                  iconPlacement="end"
                  className="mt-14px h-46px! px-20px! text-15px!"
                >
                  Installation guide
                </Button>
              </div>
              <div className="flex flex-col gap-14px font-[LandingMono,monospace]">
                <div className="w-[76%] rounded-18px border border-solid border-border-subtle bg-surface px-6px pb-6px max-[640px]:w-full">
                  <div className="relative flex h-36px items-center justify-center text-12px text-text-muted">
                    Terminal
                    <CopyCommand command="npx shadcn@latest add @react-bits/Aurora-TS-TW" />
                  </div>
                  <div className="overflow-x-auto rounded-12px bg-[var(--landing-alt)] p-16px text-11px leading-24px">
                    <div className="whitespace-nowrap">
                      $ npx shadcn@latest add @react-bits/Aurora-TS-TW
                    </div>
                    <div className="text-text-secondary">
                      ✔ Checking registry.
                      <br />✔ Created 1 file:
                      <br /> - components/Aurora.tsx
                    </div>
                  </div>
                </div>
                <div className="w-[86%] self-end rounded-18px border border-solid border-border-subtle bg-surface p-6px pt-0 max-[640px]:w-full">
                  <div className="flex h-36px items-center justify-center text-12px text-text-muted">
                    Aurora.tsx
                  </div>
                  <pre className="m-0 overflow-x-auto rounded-12px bg-[var(--landing-alt)] p-20px text-12px leading-24px text-text-secondary">{`'use client';\n \nimport { useEffect, useRef } from 'react';\n \nconst Aurora = ({\n  colorStops = ['#5227FF', '#7cff67', '#5227FF'],\n  amplitude = 1,\n  blend = 0.5,\n  speed = 0.6,\n}: AuroraProps) => {\n  const containerRef = useRef<HTMLDivElement>(null);`}</pre>
                </div>
              </div>
            </div>
          </section>
          <section className="bg-[var(--landing-alt)] py-96px max-[640px]:py-64px">
            <div className={container}>
              <div className="mb-44px flex items-end justify-between gap-24px max-[640px]:flex-col max-[640px]:items-start">
                <div className="max-w-720px">
                  <h2 className={heading}>Build the whole product, not just the hero.</h2>
                  <p className="mb-0 mt-18px text-15px leading-[1.65] text-text-secondary">
                    Page sections, app UI, full Next.js templates and agent skills, all as source
                    you own.
                  </p>
                </div>
                <Button
                  type="primary"
                  href={pro}
                  icon={
                    <span
                      aria-hidden="true"
                      className="i-lucide-arrow-right size-1em align-middle "
                    />
                  }
                  iconPlacement="end"
                  className="h-46px! shrink-0 px-20px!"
                >
                  Get React Bits Pro
                </Button>
              </div>
              <div className="grid grid-cols-6 gap-12px max-[640px]:grid-cols-1">
                {products.map(([title, description, path], index) => (
                  <a
                    key={title}
                    href={`${pro}docs${path}`}
                    className={`${card} rounded-24px! p-8px! ${index < 2 ? 'col-span-3' : 'col-span-2'} max-[640px]:col-span-1`}
                  >
                    <img
                      src={`${assets}pro-${index + 1}.png`}
                      alt=""
                      loading="lazy"
                      className={`block h-auto w-full rounded-16px object-cover ${index < 2 || index === 4 ? 'aspect-[2.3/1]' : 'aspect-[2/1]'} max-[640px]:aspect-[2/1] ${light ? 'invert' : ''}`}
                    />
                    <div className="px-17px pb-18px pt-16px">
                      <h3 className="m-0 flex items-center justify-between text-18px font-500">
                        {title}
                        <DiagonalArrow />
                      </h3>
                      <p className="mb-0 mt-8px text-14px leading-[1.6] text-text-secondary">
                        {description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
          <section className="pb-104px pt-96px max-[640px]:py-64px">
            <div className={container}>
              <h2 className={`${heading} mb-40px`}>Five free tools, in your browser.</h2>
              <div className="grid grid-cols-6 gap-12px max-[640px]:grid-cols-1">
                {tools.map(([title, description, path], index) => (
                  <a
                    key={title}
                    href={`${source}/tools/${path}`}
                    className={`${card} ${index < 2 ? 'col-span-3' : 'col-span-2'} max-[640px]:col-span-1`}
                  >
                    <img
                      src={`${assets}tool-${index + 1}.png`}
                      alt=""
                      loading="lazy"
                      className={`block h-277px w-full rounded-11px object-cover ${light ? 'invert' : ''}`}
                    />
                    <div className="px-13px pb-10px pt-14px">
                      <h3 className="m-0 flex items-center justify-between text-15px font-600">
                        {title}
                        <DiagonalArrow />
                      </h3>
                      <p className="mb-0 mt-6px text-13px leading-[1.55] text-text-secondary">
                        {description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
          <section className="py-96px max-[640px]:py-64px">
            <div className={container}>
              <div className="mb-40px flex items-start justify-between gap-20px max-[640px]:flex-col">
                <div>
                  <h2 className={heading}>Sponsors</h2>
                  <p className="mb-0 mt-18px text-14px text-text-secondary">
                    React Bits stays free thanks to these teams.
                  </p>
                </div>
                <Button
                  href={`${source}/sponsors#sponsor-plans`}
                  icon={
                    <span
                      aria-hidden="true"
                      className="i-lucide-arrow-right size-1em align-middle "
                    />
                  }
                  iconPlacement="end"
                  className="h-46px! px-24px!"
                >
                  Become a sponsor
                </Button>
              </div>
              <div className="grid grid-cols-6 justify-center gap-12px max-[640px]:grid-cols-1">
                {[
                  ['shadcnblocks', 'https://www.shadcnblocks.com', 'Diamond'],
                  ['shaders', 'https://shaders.com', 'Diamond'],
                  ['shadcnuikit', 'https://shadcnuikit.com', 'Silver'],
                  ['shadcnstudio', 'https://shadcnstudio.com', 'Silver'],
                ].map(([name, href, tier], index) => (
                  <a
                    key={name}
                    href={href}
                    className={`${card} ${index < 2 ? 'col-span-3' : index === 2 ? 'col-span-2 col-start-2' : 'col-span-2'} max-[640px]:col-span-1 max-[640px]:col-start-auto`}
                  >
                    <div className="flex h-126px items-center justify-center rounded-11px bg-[var(--landing-alt)]">
                      <img
                        src={`${assets}${name}.svg`}
                        alt={name}
                        loading="lazy"
                        className={`max-h-64px w-[52%] max-w-290px ${light ? 'brightness-0' : ''}`}
                      />
                    </div>
                    <div className="flex justify-between p-12px pb-8px text-13px text-text-secondary">
                      {tier}
                      <DiagonalArrow />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
          <section className="py-96px max-[640px]:py-64px">
            <div className={container}>
              <h2 className={`${heading} mb-40px`}>Loved by developers</h2>
              <div className="grid grid-cols-3 items-start gap-12px max-[640px]:grid-cols-1">
                {testimonials.map(([quote, author]) => (
                  <a
                    key={author}
                    href={`https://x.com/${author}`}
                    className="rounded-12px border border-solid border-border-subtle p-20px transition-colors hover:bg-surface"
                  >
                    <p className="m-0 mb-16px text-14px leading-[1.6]">{quote}</p>
                    <span className="text-12px text-text-muted">@{author}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
          <section className="pb-112px pt-96px max-[640px]:py-72px">
            <div
              className={`${container} grid grid-cols-2 gap-64px max-[899px]:grid-cols-1 max-[640px]:gap-32px`}
            >
              <div>
                <h2 className={heading}>Questions, answered</h2>
                <p className="mt-14px max-w-34ch text-15px leading-[1.65] text-text-secondary">
                  What&apos;s free, what&apos;s in Pro and how the pieces fit together.
                </p>
              </div>
              <Faq />
            </div>
          </section>
        </main>
        <footer className={`${container} pb-16px`}>
          <div className="overflow-hidden rounded-20px border border-solid border-border-subtle bg-surface p-6px">
            <section className="flex flex-col items-center rounded-18px border border-solid border-border-subtle bg-[var(--landing-alt)] px-24px pb-156px pt-104px text-center max-[640px]:pb-88px max-[640px]:pt-72px">
              <h2 className={heading}>Build something people remember.</h2>
              <p className="mb-24px mt-14px max-w-65ch text-14px leading-[1.65] text-text-secondary">
                Start with the free library. When you need the complete page,
                <br className="max-[640px]:hidden" /> product UI and tools to ship it, React Bits
                Pro is ready.
              </p>
              <div className="flex gap-10px max-[640px]:flex-col">
                <Button
                  type="primary"
                  href={pro}
                  icon={
                    <span
                      aria-hidden="true"
                      className="i-lucide-arrow-right size-1em align-middle "
                    />
                  }
                  iconPlacement="end"
                >
                  Get React Bits Pro
                </Button>
                <Button href={`${source}/get-started/index`}>Browse free components</Button>
              </div>
            </section>
            <div className="flex justify-between gap-40px px-36px py-48px max-[640px]:flex-col max-[640px]:px-18px">
              <div>
                <a href="#landing-content" aria-label="React Bits home">
                  <Brand light={light} />
                </a>
                <p className="mt-14px text-13px leading-[1.7] text-text-secondary">
                  Animated React components.
                  <br />
                  Open source. Fully customizable.
                </p>
              </div>
              <nav
                aria-label="Footer"
                className="grid grid-cols-3 gap-48px text-12px max-[640px]:gap-24px"
              >
                {[
                  [
                    'Community',
                    ['GitHub', github],
                    ['Vue Bits', 'https://vue-bits.dev/'],
                    ['Svelte Bits', 'https://sveltebits.xyz/'],
                  ],
                  [
                    'Product',
                    ['Docs', `${source}/get-started/introduction`],
                    ['Tools', `${source}/tools`],
                    ['Showcase', `${source}/showcase`],
                    ['Sponsors', `${source}/sponsors`],
                  ],
                  [
                    'Pro',
                    ["What's in Pro", pro],
                    ['Components', `${pro}docs/components`],
                    ['Blocks', `${pro}docs/blocks`],
                    ['Templates', `${pro}docs/templates`],
                  ],
                ].map(([title, ...links]) => (
                  <div key={title as string}>
                    <h3 className="m-0 mb-16px text-12px font-500">{title}</h3>
                    <div className="flex flex-col gap-12px text-text-secondary">
                      {(links as string[][]).map(([label, href]) => (
                        <a key={label} href={href}>
                          {label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
            <div className="flex flex-wrap gap-16px px-36px pb-24px text-11px text-text-muted max-[640px]:px-18px">
              <span>© 2026 React Bits</span>
              <span>
                Built with love by <a href="https://x.com/davidhaz">@davidhaz</a>
              </span>
              <a href={`${github}/blob/main/LICENSE.md`}>License</a>
            </div>
            <img
              src={`${assets}footer.png`}
              alt="React Bits"
              loading="lazy"
              className={`block h-300px w-full object-cover object-top max-[640px]:h-140px ${light ? 'invert' : ''}`}
            />
          </div>
        </footer>
      </div>
    </ConfigProvider>
  );
}
