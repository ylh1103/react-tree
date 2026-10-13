import { defineConfig, presetWind3, presetIcons } from 'unocss';
import { navigationItems, databaseNavigationItems } from './src/layouts/navigation';
import { themeVariables } from './src/styles/theme';
import lucideIcons from '@iconify-json/lucide/icons.json';

const brandAnimations = {
  'brand-beacon': ['1.8s', 'linear'],
  'brand-shine': ['1.8s', 'cubic-bezier(.4,0,.3,1)'],
  'brand-echo': ['2s', 'ease-out'],
  'brand-inflow-red': ['1.4s', 'ease-in'],
  'brand-inflow-blue': ['1.4s', 'ease-in'],
  'loading-trace': ['1.8s', 'linear'],
  'loading-ring': ['1.6s', 'linear'],
  'loading-wave': ['1.1s', 'ease-in-out'],
  'loading-dot': ['1.4s', 'ease-in-out'],
  'loading-relay-red': ['1.6s', 'ease-in-out'],
  'loading-relay-blue': ['1.6s', 'ease-in-out'],
  'loading-segment': ['1.2s', 'linear'],
  'loading-shuttle': ['1.8s', 'cubic-bezier(.45,0,.55,1)'],
  'brand-red': ['1.25s', 'ease-in-out'],
  'brand-blue': ['1.25s', 'ease-in-out'],
  'brand-rotate': ['1.8s', 'linear'],
  'brand-flip-red': ['1.6s', 'ease-in-out'],
  'brand-flip-blue': ['1.6s', 'ease-in-out'],
  'brand-breathe': ['1.6s', 'ease-in-out'],
  'brand-bounce-red': ['1.2s', 'ease-in-out'],
  'brand-bounce-blue': ['1.2s', 'ease-in-out'],
  'brand3d-magnet-red': ['1.8s', 'cubic-bezier(.45,0,.25,1)'],
  'brand3d-magnet-blue': ['1.8s', 'cubic-bezier(.45,0,.25,1)'],
  'brand3d-enamel-red': ['2.4s', 'cubic-bezier(.45,0,.25,1)'],
  'brand3d-enamel-blue': ['2.4s', 'cubic-bezier(.45,0,.25,1)'],
  'brand3d-orbit-red': ['2.8s', 'linear'],
  'brand3d-orbit-blue': ['2.8s', 'linear'],
  'brand3d-shadow': ['1.8s', 'ease-in-out'],
} as const;

export default defineConfig({
  safelist: [...navigationItems, ...databaseNavigationItems].map(({ icon }) => icon),
  theme: {
    animation: {
      keyframes: {
        'brand-beacon': '{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
        'brand-shine':
          '{0%,10%{transform:translateX(0);opacity:0}18%{opacity:1}75%{transform:translateX(265px);opacity:1}85%,100%{transform:translateX(265px);opacity:0}}',
        'brand-echo':
          '{0%{transform:scale(1);opacity:.48}90%,100%{transform:scale(1.4);opacity:0}}',
        'brand-inflow-red':
          '{0%{transform:translateX(0);opacity:0}20%{opacity:1}75%{transform:translateX(44px);opacity:1}95%,100%{transform:translateX(44px);opacity:0}}',
        'brand-inflow-blue':
          '{0%{transform:translateX(0);opacity:0}20%{opacity:1}75%{transform:translateX(-44px);opacity:1}95%,100%{transform:translateX(-44px);opacity:0}}',
        'loading-relay-red':
          '{0%,100%{transform:translate(0,0)}25%{transform:translate(42px,-24px)}50%{transform:translate(84px,0)}75%{transform:translate(42px,24px)}}',
        'loading-relay-blue':
          '{0%,100%{transform:translate(0,0)}25%{transform:translate(-42px,24px)}50%{transform:translate(-84px,0)}75%{transform:translate(-42px,-24px)}}',
        'loading-segment': '{0%,100%{opacity:.18}25%{opacity:1}60%{opacity:.18}}',
        'loading-shuttle':
          '{0%,100%{transform:translateX(0);opacity:.55}50%{transform:translateX(104px);opacity:1}}',
        'loading-trace': '{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}',
        'loading-ring': '{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
        'loading-wave':
          '{0%,100%{transform:scaleY(.28);opacity:.5}50%{transform:scaleY(1);opacity:1}}',
        'loading-dot':
          '{0%,100%{transform:scale(.48);opacity:.25}45%{transform:scale(1);opacity:1}65%{transform:scale(.9);opacity:.8}}',
        'brand3d-magnet-red':
          '{0%,100%{transform:translate3d(0,0,0) rotateY(-8deg)}35%{transform:translate3d(-.16em,.03em,.22em) rotateY(-40deg) rotateZ(-6deg)}65%{transform:translate3d(.02em,0,-.02em) rotateY(8deg)}82%{transform:translate3d(0,0,0) rotateY(-8deg)}}',
        'brand3d-magnet-blue':
          '{0%,100%{transform:translate3d(0,0,.16em) rotateY(8deg)}35%{transform:translate3d(.16em,-.03em,-.08em) rotateY(40deg) rotateZ(6deg)}65%{transform:translate3d(-.02em,0,.18em) rotateY(-8deg)}82%{transform:translate3d(0,0,.16em) rotateY(8deg)}}',
        'brand3d-enamel-red':
          '{0%,100%{transform:translate3d(0,0,0) rotateY(0)}18%{transform:translate3d(-.12em,-.05em,.18em) rotateY(-30deg)}48%{transform:translate3d(-.12em,-.05em,.18em) rotateY(-210deg)}68%{transform:translate3d(0,0,0) rotateY(-360deg)}100%{transform:translate3d(0,0,0) rotateY(-360deg)}}',
        'brand3d-enamel-blue':
          '{0%,15%{transform:translate3d(0,0,.16em) rotateY(0)}33%{transform:translate3d(.12em,.05em,.28em) rotateY(30deg)}63%{transform:translate3d(.12em,.05em,.28em) rotateY(210deg)}83%,100%{transform:translate3d(0,0,.16em) rotateY(360deg)}}',
        'brand3d-orbit-red':
          '{0%{transform:translate3d(-.08em,0,.14em) rotateY(-15deg)}25%{transform:translate3d(.18em,-.18em,-.22em) rotateY(-105deg)}50%{transform:translate3d(.30em,.10em,-.04em) rotateY(-195deg)}75%{transform:translate3d(.05em,.20em,.30em) rotateY(-285deg)}100%{transform:translate3d(-.08em,0,.14em) rotateY(-375deg)}}',
        'brand3d-orbit-blue':
          '{0%{transform:translate3d(.08em,0,-.02em) rotateY(15deg)}25%{transform:translate3d(-.18em,.18em,.30em) rotateY(-75deg)}50%{transform:translate3d(-.30em,-.10em,.14em) rotateY(-165deg)}75%{transform:translate3d(-.05em,-.20em,-.22em) rotateY(-255deg)}100%{transform:translate3d(.08em,0,-.02em) rotateY(-345deg)}}',
        'brand3d-shadow':
          '{0%,100%{transform:scaleX(1);opacity:.65}35%{transform:scaleX(1.25);opacity:.35}70%{transform:scaleX(.9);opacity:.7}}',
        'brand-red':
          '{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(-24px,-18px) rotate(-12deg)}60%{transform:translate(-24px,18px) rotate(-8deg)}82%{transform:translate(3px,0) rotate(2deg)}}',
        'brand-blue':
          '{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(24px,18px) rotate(12deg)}60%{transform:translate(24px,-18px) rotate(8deg)}82%{transform:translate(-3px,0) rotate(-2deg)}}',
        'brand-rotate': '{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
        'brand-flip-red':
          '{0%,60%,100%{transform:scaleX(1)}25%{transform:scaleX(-1)}42%{transform:scaleX(.08)}}',
        'brand-flip-blue':
          '{0%,20%,100%{transform:scaleX(1)}55%{transform:scaleX(-1)}72%{transform:scaleX(.08)}}',
        'brand-breathe':
          '{0%,100%{transform:scale(.78);opacity:.55}50%{transform:scale(1.12);opacity:1}}',
        'brand-bounce-red':
          '{0%,45%,100%{transform:translateY(0)}22%{transform:translateY(-42px)}35%{transform:translateY(8px)}}',
        'brand-bounce-blue':
          '{0%,45%,100%{transform:translateY(0)}67%{transform:translateY(-42px)}80%{transform:translateY(8px)}}',
      },
      durations: Object.fromEntries(
        Object.entries(brandAnimations).map(([name, [duration]]) => [name, duration]),
      ),
      timingFns: Object.fromEntries(
        Object.entries(brandAnimations).map(([name, [, easing]]) => [name, easing]),
      ),
      counts: Object.fromEntries(Object.keys(brandAnimations).map((name) => [name, 'infinite'])),
    },
    // 1280px 起显示工具文字；超过 1600px 时放宽系统选择器。
    breakpoints: { desktop: '1280px', wide: '1601px' },
    spacing: { layout: 'var(--layout-gap)' },
    borderRadius: { ui: 'var(--ui-radius)', control: 'var(--control-radius)' },
    colors: Object.fromEntries(
      Object.keys(themeVariables)
        .filter((name) => name.startsWith('--color-'))
        .map((name) => [name.slice('--color-'.length), `var(${name})`]),
    ),
  },
  shortcuts: {
    'grouped-list-type-control':
      'w-full p-1! border! border-solid! border-border! bg-sidebar! [&_.ant-segmented-item]:min-w-0 [&_.ant-segmented-item]:text-text-secondary [&_.ant-segmented-item-label]:min-h-52px [&_.ant-segmented-item-label]:px-1 [&_.ant-segmented-item-label]:py-1.25 [&_.ant-segmented-item-label]:text-12px [&_.ant-segmented-item-label]:leading-5 [&_.ant-segmented-item-label]:whitespace-nowrap [&_.ant-segmented-item-selected]:text-[var(--accent-text)] [&_.ant-segmented-item-selected]:bg-surface [&_.ant-segmented-item-selected]:font-600 [&_.ant-segmented-item-selected_.application-type-filter-count]:text-[var(--accent-text)] [&_.ant-segmented-item-selected_.application-type-filter-count]:bg-[var(--accent-bg)] [&_.ant-segmented-item:focus-within]:outline-2 [&_.ant-segmented-item:focus-within]:outline-solid [&_.ant-segmented-item:focus-within]:outline-[var(--accent)] [&_.ant-segmented-item:focus-within]:outline-offset-1 [&.ant-segmented-disabled]:opacity-50 motion-reduce:[&_.ant-segmented-thumb]:transition-none motion-reduce:[&_.ant-segmented-thumb]:animate-none motion-reduce:[&_.ant-segmented-item]:transition-none motion-reduce:[&_.ant-segmented-item]:animate-none',
    'brand-loading-red':
      'animate-brand-red [transform-origin:98px_92px] motion-reduce:animate-none',
    'brand-loading-blue':
      'animate-brand-blue [transform-origin:98px_92px] motion-reduce:animate-none',
    'settings-segmented':
      'p-1! bg-sidebar! text-text-secondary! rounded-control! [&_.ant-segmented-item-label]:min-h-30px [&_.ant-segmented-item-label]:leading-30px [&_.ant-segmented-item-label]:px-2 [&_.ant-segmented-item-label]:text-12px [&_.ant-segmented-item-selected]:bg-surface! [&_.ant-segmented-item-selected]:text-accent-text! [&_.ant-segmented-item-selected]:font-500 [&_.ant-segmented-item:focus-within]:outline-2 [&_.ant-segmented-item:focus-within]:outline-solid [&_.ant-segmented-item:focus-within]:outline-accent motion-reduce:[&_.ant-segmented-thumb]:transition-none motion-reduce:[&_.ant-segmented-thumb]:animate-none',
    'settings-section-title': 'm-0 text-13px font-600 leading-5 text-text',
    'settings-choice-content': 'flex w-full min-w-0 flex-col gap-3',
    'settings-choice-preview':
      'relative block h-92px w-full shrink-0 overflow-hidden rounded-ui border border-solid border-border',
    'settings-choice-title':
      'flex min-h-20px items-center justify-center gap-1.5 text-14px font-500 leading-5',
    'settings-choice-description': 'text-12px leading-18px text-text-muted',
    'settings-choice':
      'flex! h-auto! min-w-0 [&>span:last-child]:w-full px-2.5! py-3! rounded-ui! border! border-solid! border-border! bg-surface! text-text! text-center whitespace-normal! leading-normal! before:hidden! hover:border-accent! [&.ant-radio-button-wrapper-checked]:border-accent! [&.ant-radio-button-wrapper-checked]:bg-hover! [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-solid [&:has(:focus-visible)]:outline-accent [&:has(:focus-visible)]:outline-offset-2 motion-reduce:transition-none!',
    'page-skeleton': 'motion-reduce:[&_.ant-skeleton-active_*]:animate-none!',
    'app-viewport': 'h-full overflow-auto',
    'app-desktop-shell': 'h-full min-w-1280px [&[data-layout=compact]]:[--layout-gap:0px]',
    'navigation-icon':
      'flex items-center justify-center w-36px h-36px shrink-0 rounded-control transition-colors duration-140 motion-reduce:transition-none',
    'navigation-settings':
      'mt-auto! flex! flex-col! items-center! justify-center! gap-0.5! min-h-60px h-auto! w-full! py-1! px-0! rounded-control! border-0! bg-transparent! text-nav-text! hover:text-nav-emphasis! layout-focus motion-reduce:transition-none!',
    'compact-split-divider':
      "flex-[0_0_1px] rounded-0 bg-divider before:content-[''] before:absolute before:inset-y-0 before:left-1/2 before:translate-x-[-50%] before:w-4px before:transition-colors before:duration-100 motion-reduce:before:transition-none [&.hover]:before:bg-accent [&.active]:before:bg-accent [&:focus-visible:not([aria-disabled=true])]:before:bg-accent",
    'tree-scrollbar':
      '[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-8px [&::-webkit-scrollbar]:h-8px [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-4px [&:hover::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent',
    'system-entry':
      'h-38px! gap-1.5! px-2.25! text-12px! rounded-control! focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-2 motion-reduce:transition-none!',
    'system-entry-count':
      'min-w-20px px-1 rounded-control bg-sidebar text-text-muted text-11px leading-18px tabular-nums',
    'system-row-grid': 'grid grid-cols-[minmax(0,1fr)_90px_160px_300px] gap-x-6 gap-y-3',
    'workspace-frame': 'border border-solid border-border-subtle rounded-ui',
    'workspace-panel': 'workspace-frame bg-surface',
    'workspace-muted': 'text-text-muted text-13px leading-22px',
    'workspace-page__title': 'm-0 text-text text-14px font-600 leading-22px',
    'workspace-titlebar-layout':
      'flex flex-wrap items-center gap-x-4 gap-y-2.5 shrink-0 min-h-52px px-4 py-2.5',
    'workspace-titlebar': 'workspace-titlebar-layout border-b border-b-solid border-divider',
    'workspace-titlebar-detached': 'workspace-titlebar-layout workspace-panel',
    'workspace-title-identity': 'flex min-w-0 max-w-full shrink-0 items-center gap-2',
    'layout-focus':
      'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-[-2px]',
    'split-grip':
      "after:content-[''] after:absolute after:pointer-events-none after:top-1/2 after:left-1/2 after:translate-x-[-50%] after:translate-y-[-50%] after:w-2px after:h-2px after:rounded-full after:bg-handle after:text-handle after:[box-shadow:0_-5px_currentColor,0_5px_currentColor]",
    'layout-scroll': 'flex-1 min-w-0 min-h-0 overflow-auto',
  },
  presets: [
    presetWind3(),
    presetIcons({
      collections: {
        lucide: () => lucideIcons,
      },
      extraProperties: {
        display: 'inline-block',
      },
    }),
  ],
});
