/** 产品导航模块：保留参考页几何与交互，去掉社区、文档站及通用品牌模板分支。 */
import { useEffect, useRef, useState, useSyncExternalStore, type SyntheticEvent } from 'react';
import { Button } from 'antd';
import { useLinkClickHandler } from 'react-router';
import logo from '@/assets/logo.jpg';
import { useLandingTheme } from '../../hooks/useLandingTheme';

const navigation = [
  { label: '产品能力', href: '#core-features' },
  { label: '使用流程', href: '#how-it-works' },
  { label: '接入指南', href: '#landing-integration' },
  { label: '常见问题', href: '#faq' },
];
const linkClass =
  'relative z-1 rounded-12px px-2.5 py-1.5 text-13px font-500 tracking-[0.04em] text-text layout-focus active:scale-96 motion-reduce:transform-none';

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

function isScrolled() {
  return window.scrollY > 50;
}

export default function LandingNavigation() {
  const openConsole = useLinkClickHandler<HTMLElement>('/');
  const { theme, setTheme, canChangeTheme } = useLandingTheme();
  const scrolled = useSyncExternalStore(subscribeToScroll, isScrolled);
  const [menuOpen, setMenuOpen] = useState(false);
  const highlight = useRef<HTMLSpanElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const { style } = document.documentElement;
    const previous = style.overflowY;
    style.overflowY = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 769px)');
    const resize = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener('keydown', escape);
    desktop.addEventListener('change', resize);
    return () => {
      style.overflowY = previous;
      document.removeEventListener('keydown', escape);
      desktop.removeEventListener('change', resize);
    };
  }, [menuOpen]);
  function moveHighlight(event: SyntheticEvent<HTMLAnchorElement>) {
    const node = highlight.current;
    const parent = event.currentTarget.parentElement;
    if (!node || !parent) return;
    const link = event.currentTarget.getBoundingClientRect();
    const bounds = parent.getBoundingClientRect();
    Object.assign(node.style, {
      width: `${link.width}px`,
      height: `${link.height}px`,
      transform: `translateX(${link.left - bounds.left}px)`,
      opacity: '1',
    });
  }
  function hideHighlight() {
    if (highlight.current) highlight.current.style.opacity = '0';
  }
  const glass = scrolled || menuOpen;
  return (
    <header
      className={`pointer-events-none sticky z-1500 h-0 flex flex-col items-center transition-[top] duration-300 motion-reduce:transition-none [@media(max-width:768px)]:px-4 ${scrolled ? 'top-4' : 'top-2'}`}
    >
      <div
        className={`pointer-events-auto relative flex h-56px w-full shrink-0 items-center justify-between rounded-14px border border-solid py-0 transition-[max-width,padding,background,border-color] duration-500 ease-out motion-reduce:transition-none [@media(max-width:768px)]:rounded-16px [@media(max-width:768px)]:px-5px ${glass ? 'max-w-[calc(100%-12px)] border-[var(--landing-glass-border)] bg-[var(--landing-glass)] px-20px shadow-[var(--landing-shadow)] [backdrop-filter:blur(24px)_saturate(1.4)] [@media(min-width:769px)]:max-w-[min(1204px,calc(100%-76px))] [@media(min-width:769px)]:left-6px' : 'max-w-1280px border-transparent bg-transparent pl-43px pr-31px'}`}
      >
        <a
          href="#landing-top"
          aria-label="灵动参数管家"
          className="flex shrink-0 items-center text-16px [@media(max-width:768px)]:text-14px font-500 leading-6 tracking-normal text-text layout-focus [font-family:Geist,sans-serif]"
        >
          <img src={logo} alt="" className="mr-2 h-7 w-7 rounded-6px object-contain" />
          灵动参数管家
        </a>
        <nav
          aria-label="主导航"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 [@media(max-width:768px)]:hidden"
          onMouseLeave={hideHighlight}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) hideHighlight();
          }}
        >
          <span
            ref={highlight}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 rounded-12px border border-solid border-border-subtle bg-[var(--landing-glass)] opacity-0 shadow-[var(--landing-shadow)] [backdrop-filter:blur(24px)_saturate(1.4)] transition-[transform,width,height,opacity] duration-300 motion-reduce:transition-none"
          />
          {navigation.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className={linkClass}
              onMouseEnter={moveHighlight}
              onFocus={moveHighlight}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3 [@media(max-width:768px)]:gap-1.5">
          <Button
            type="text"
            disabled={!canChangeTheme}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? '切换深色主题' : '切换浅色主题'}
            icon={
              <span
                aria-hidden="true"
                className={theme === 'light' ? 'i-lucide-moon h-4 w-4' : 'i-lucide-sun h-4 w-4'}
              />
            }
            className="h-9! w-9! min-w-9! rounded-10px! border-border-subtle! bg-[var(--landing-ghost)]! p-0! text-text-secondary! hover:bg-[var(--landing-ghost-hover)]! hover:text-text!"
          />
          <Button
            href="/"
            onClick={openConsole}
            type="primary"
            className="h-9! rounded-10px! border-transparent! px-18px! text-13px! font-600! [@media(max-width:768px)]:h-8! [@media(max-width:768px)]:rounded-8px! [@media(max-width:768px)]:px-3! [@media(max-width:768px)]:text-12px!"
          >
            进入控制台
          </Button>
          <Button
            ref={menuButton}
            type="text"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            className="hidden! h-9! w-9! flex-col! justify-center! gap-1! rounded-10px! border-border-subtle! bg-[var(--landing-ghost)]! p-9px! [@media(max-width:768px)]:flex!"
          >
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                aria-hidden="true"
                className={`block h-1.5px w-full rounded-1px bg-text transition-[transform,opacity] duration-250 motion-reduce:transition-none ${menuOpen ? (index === 0 ? 'translate-y-5.5px rotate-45' : index === 1 ? 'opacity-0' : '-translate-y-5.5px -rotate-45') : ''}`}
              />
            ))}
          </Button>
        </div>
        <nav
          id="landing-menu"
          aria-label="移动端导航"
          inert={!menuOpen}
          className={`absolute right-5px top-[calc(100%+8px)] z-1001 hidden min-w-200px flex-col gap-0.5 rounded-14px border border-solid border-border-subtle bg-[var(--landing-menu)] p-2 shadow-[var(--landing-menu-shadow)] [backdrop-filter:blur(32px)_saturate(1.3)] transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none [@media(max-width:768px)]:flex ${menuOpen ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1.5 opacity-0'}`}
        >
          {navigation.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="rounded-10px px-3.5 py-3 text-13px font-500 tracking-[0.04em] text-text-secondary layout-focus hover:bg-[var(--landing-ghost-hover)] hover:text-text"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
