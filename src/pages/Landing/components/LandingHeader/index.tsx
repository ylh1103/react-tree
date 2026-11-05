/** 官网首页参考的浮动头部；滚动、活动项与共享高亮均基于 Landing 唯一滚动容器。 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { navigation } from '../../content';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUserSettings, saveThemeMode, saveUserSettings } from '@/store/slices/preferencesSlice';
import { container } from '../../ui';
import type { ThemeMode } from '@/types/preferences';

const modes: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: '浅色', icon: 'i-lucide-sun' },
  { value: 'dark', label: '深色', icon: 'i-lucide-moon' },
  { value: 'system', label: '跟随系统', icon: 'i-lucide-monitor' },
];
function ThemeChoices({ close }: { close?: () => void }) {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.preferences.themeMode);
  const status = useAppSelector((state) => state.preferences.status);
  const error = useAppSelector((state) => state.preferences.error);
  const failed = useAppSelector((state) => state.preferences.failedSettings);
  const disabled = !['ready', 'saving', 'save-error'].includes(status);
  return (
    <div>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 px-2 text-13px text-[var(--landing-muted)]">外观</legend>
        {modes.map((item) => (
          <label
            key={item.value}
            className="flex min-h-44px cursor-pointer items-center gap-3 rounded-8px px-3 hover:bg-[var(--landing-raised)]"
          >
            <span aria-hidden="true" className={item.icon} />
            <span className="flex-1 text-14px">{item.label}</span>
            <input
              type="radio"
              name={close ? 'desktop-theme' : 'mobile-theme'}
              value={item.value}
              checked={mode === item.value}
              disabled={disabled}
              className="h-4 w-4 accent-[var(--color-accent)]"
              onChange={() => {
                void dispatch(saveThemeMode(item.value));
                close?.();
              }}
            />
          </label>
        ))}
      </fieldset>
      <div role="status" className="px-2 text-12px leading-[1.7] text-[var(--landing-muted)]">
        {status === 'saving' && '正在保存外观设置…'}
        {(status === 'load-error' || status === 'save-error') && (
          <p className="mb-0">
            {status === 'load-error'
              ? '设置读取失败，暂时无法保存外观。'
              : '设置保存失败，已恢复上次设置。'}
            {error && <span className="sr-only">{error}</span>}
            <button
              type="button"
              className="ml-2 min-h-44px cursor-pointer border-0 bg-transparent p-0 text-[var(--landing-link)] underline"
              onClick={() => {
                if (status === 'load-error') void dispatch(loadUserSettings());
                else if (failed) void dispatch(saveUserSettings(failed));
              }}
            >
              重试
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
/** 保存错误在关闭面板后仍可感知，重试继续走原设置状态机。 */
function ThemeFeedback() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.preferences.status);
  const failed = useAppSelector((state) => state.preferences.failedSettings);
  if (status !== 'save-error') return null;
  return (
    <div
      role="alert"
      className="pointer-events-auto ml-auto mt-2 flex max-w-360px items-center gap-3 rounded-10px border border-solid border-[var(--landing-control)] bg-[var(--landing-surface)] px-4 py-2 text-13px leading-[1.7] shadow-lg"
    >
      <span>设置保存失败，已恢复上次设置。</span>
      <button
        type="button"
        className="min-h-44px shrink-0 cursor-pointer border-0 bg-transparent text-[var(--landing-link)] underline"
        onClick={() => {
          if (failed) void dispatch(saveUserSettings(failed));
        }}
      >
        重试
      </button>
    </div>
  );
}
export default function LandingHeader({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [panel, setPanel] = useState<'theme' | 'menu' | null>(null);
  const headerRef = useRef<HTMLElement>(null),
    navRef = useRef<HTMLElement>(null),
    highlightRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null),
    themeRef = useRef<HTMLButtonElement>(null);
  const mode = useAppSelector((state) => state.preferences.themeMode);
  const saveError = useAppSelector((state) => state.preferences.status === 'save-error');
  const currentMode = modes.find((item) => item.value === mode)!;
  const target = hovered ?? focused ?? active;
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(root.scrollTop > 50);
      const top = root.getBoundingClientRect().top;
      let next: string | null = null;
      for (const item of navigation) {
        const element = root.querySelector(`#${item.id}`);
        if (element && element.getBoundingClientRect().top - top <= 150) next = item.id;
      }
      setActive(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    if (root.firstElementChild) observer.observe(root.firstElementChild);
    root.addEventListener('scroll', schedule, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener('scroll', schedule);
    };
  }, [scrollRef]);
  useLayoutEffect(() => {
    const nav = navRef.current,
      light = highlightRef.current;
    if (!nav || !light) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const link = target ? nav.querySelector<HTMLAnchorElement>(`a[href="#${target}"]`) : null;
      light.style.opacity = link ? '1' : '0';
      if (link) {
        const box = link.getBoundingClientRect(),
          parent = nav.getBoundingClientRect();
        light.style.transform = `translateX(${box.left - parent.left}px)`;
        light.style.width = `${box.width}px`;
        light.style.height = `${box.height}px`;
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(nav);
    for (const link of nav.children) if (link !== light) observer.observe(link);
    let alive = true;
    void document.fonts.ready.then(() => {
      if (alive) schedule();
    });
    headerRef.current?.addEventListener('transitionend', schedule);
    measure();
    const header = headerRef.current;
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      header?.removeEventListener('transitionend', schedule);
    };
  }, [target, scrolled]);
  useEffect(() => {
    if (!panel) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target))
        setPanel(null);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanel(null);
        (panel === 'theme' ? themeRef : menuRef).current?.focus();
      }
    };
    const media = window.matchMedia('(min-width: 1200px)');
    const resized = () => setPanel(null);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    media.addEventListener('change', resized);
    if (panel === 'theme')
      headerRef.current
        ?.querySelector<HTMLInputElement>('#landing-appearance input:checked')
        ?.focus();
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
      media.removeEventListener('change', resized);
    };
  }, [panel]);
  return (
    <header ref={headerRef} className="pointer-events-none absolute inset-x-0 top-5 z-30">
      <div
        className={`${container} transition-[max-width,padding] duration-500 ease-in-out ${scrolled ? 'max-w-1120px!' : ''}`}
      >
        <div
          className={`pointer-events-auto relative flex h-56px items-center justify-between gap-3 rounded-16px border border-solid px-3 transition-[background-color,border-color,box-shadow] duration-500 min-[768px]:px-4 ${scrolled || panel ? 'border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-lg supports-[backdrop-filter:blur(1px)]:bg-[var(--landing-glass)] [backdrop-filter:blur(24px)_saturate(1.4)]' : 'border-transparent bg-transparent'}`}
        >
          <a
            href="#top"
            className="flex shrink-0 items-center gap-2 text-15px font-700 text-inherit no-underline min-[768px]:text-17px"
          >
            <span
              aria-hidden="true"
              className="i-lucide-sliders-horizontal text-20px text-[var(--landing-link)]"
            />
            灵动参数管家
          </a>
          <nav
            aria-label="页面导航"
            ref={navRef}
            onMouseLeave={() => setHovered(null)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
            }}
            className="relative hidden items-center min-[1200px]:flex"
          >
            <span
              ref={highlightRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 rounded-8px bg-[var(--landing-raised)] opacity-0 transition-[transform,width,height,opacity] duration-300 ease-in-out"
            />
            {navigation.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active === item.id ? 'location' : undefined}
                onMouseEnter={() => setHovered(item.id)}
                onFocus={() => setFocused(item.id)}
                className="relative z-1 flex min-h-40px items-center rounded-8px px-4 text-14px text-inherit no-underline transition-transform active:scale-96"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <button
              ref={themeRef}
              type="button"
              aria-label={`外观：${currentMode.label}${saveError ? '，保存失败' : ''}`}
              aria-expanded={panel === 'theme'}
              aria-controls="landing-appearance"
              onClick={() => setPanel(panel === 'theme' ? null : 'theme')}
              className="hidden min-h-44px cursor-pointer items-center gap-2 rounded-8px border-0 bg-transparent px-3 text-inherit hover:bg-[var(--landing-raised)] min-[1200px]:flex"
            >
              <span aria-hidden="true" className={currentMode.icon} />
              <span>外观</span>
              {saveError && <span aria-hidden="true">!</span>}
            </button>
            <a
              href="/"
              className="flex min-h-38px items-center justify-center rounded-8px bg-accent px-3 text-12px font-600 text-[var(--landing-on-accent)] no-underline transition-[filter,transform] hover:brightness-110 active:scale-97 min-[768px]:px-4 min-[768px]:text-14px"
            >
              进入控制台
            </a>
            <button
              ref={menuRef}
              type="button"
              aria-label={panel === 'menu' ? '关闭导航菜单' : '打开导航菜单'}
              aria-expanded={panel === 'menu'}
              aria-controls="landing-menu"
              onClick={() => setPanel(panel === 'menu' ? null : 'menu')}
              className="flex h-44px w-32px cursor-pointer flex-col items-center justify-center gap-4px border-0 bg-transparent text-inherit min-[1200px]:hidden"
            >
              {[0, 1, 2].map((line) => (
                <span
                  key={line}
                  aria-hidden="true"
                  className={`block h-2px w-19px bg-current transition-[transform,opacity] duration-250 ${panel === 'menu' ? (line === 0 ? 'translate-y-6px rotate-45' : line === 1 ? 'opacity-0' : '-translate-y-6px -rotate-45') : ''}`}
                />
              ))}
            </button>
          </div>
          {panel === 'theme' && (
            <div
              id="landing-appearance"
              className="absolute right-4 top-[calc(100%+8px)] w-220px rounded-12px border border-solid border-[var(--landing-border)] bg-[var(--landing-surface)] p-3 shadow-xl"
            >
              <ThemeChoices
                close={() => {
                  setPanel(null);
                  themeRef.current?.focus();
                }}
              />
            </div>
          )}
          {panel === 'menu' && (
            <div
              id="landing-menu"
              className="absolute right-0 top-[calc(100%+8px)] max-h-[calc(100dvh-110px)] w-[min(310px,calc(100vw-40px))] overflow-auto rounded-12px border border-solid border-[var(--landing-border)] bg-[var(--landing-surface)] p-3 shadow-xl min-[1200px]:hidden"
            >
              <nav
                aria-label="移动页面导航"
                className="mb-4 flex flex-col border-b border-b-solid border-[var(--landing-border)] pb-3"
              >
                {navigation.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setPanel(null)}
                    className="flex min-h-46px items-center rounded-8px px-3 text-14px text-inherit no-underline hover:bg-[var(--landing-raised)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <ThemeChoices />
            </div>
          )}
        </div>
        <ThemeFeedback />
      </div>
    </header>
  );
}
