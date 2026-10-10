import { defineConfig, presetWind3, presetIcons } from 'unocss';
import { navigationItems, databaseNavigationItems } from './src/layouts/navigation';
import lucideIcons from '@iconify-json/lucide/icons.json';

export default defineConfig({
  safelist: [...navigationItems, ...databaseNavigationItems].map(({ icon }) => icon),
  theme: {
    colors: {
      canvas: 'var(--color-canvas)',
      header: 'var(--color-header)',
      surface: 'var(--color-surface)',
      sidebar: 'var(--color-sidebar)',
      text: 'var(--color-text)',
      'text-secondary': 'var(--color-text-secondary)',
      'text-muted': 'var(--color-text-muted)',
      watermark: 'var(--color-watermark)',
      accent: 'var(--color-accent)',
      'on-accent': 'var(--color-on-accent)',
      hover: 'var(--color-hover)',
      border: 'var(--color-border)',
      'border-subtle': 'var(--color-border-subtle)',
      divider: 'var(--color-divider)',
      handle: 'var(--color-handle)',
      nav: 'var(--color-nav)',
      'nav-hover': 'var(--color-nav-hover)',
      'nav-active': 'var(--color-nav-active)',
      'nav-active-hover': 'var(--color-nav-active-hover)',
      'nav-pressed': 'var(--color-nav-pressed)',
      'nav-text': 'var(--color-nav-text)',
      'nav-emphasis': 'var(--color-nav-emphasis)',
      'logo-red': 'var(--color-logo-red)',
      'logo-blue': 'var(--color-logo-blue)',
      'logo-cyan': 'var(--color-logo-cyan)',
    },
  },
  shortcuts: {
    'compact-split-divider':
      "flex-[0_0_1px] rounded-0 bg-divider before:content-[''] before:absolute before:inset-y-0 before:left-1/2 before:translate-x-[-50%] before:w-4px before:transition-colors before:duration-100 motion-reduce:before:transition-none [&.hover]:before:bg-accent [&.active]:before:bg-accent [&:focus-visible:not([aria-disabled=true])]:before:bg-accent",
    'tree-scrollbar':
      '[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-8px [&::-webkit-scrollbar]:h-8px [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-4px [&:hover::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent',
    'system-entry':
      'h-38px! gap-6px! px-9px! text-12px! rounded-4px! focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-2 motion-reduce:transition-none!',
    'system-entry-count':
      'min-w-20px px-4px rounded-3px bg-sidebar text-text-muted text-11px leading-18px tabular-nums',
    'system-row-grid':
      'grid grid-cols-2 gap-x-12px gap-y-12px lg:grid-cols-[minmax(0,1fr)_90px_160px_300px] lg:gap-x-24px',
    'workspace-frame': 'border border-solid border-border-subtle rounded-8px',
    'workspace-panel': 'workspace-frame bg-surface',
    'workspace-muted': 'text-text-muted text-13px leading-22px',
    'workspace-page__title': 'm-0 text-text text-14px font-600 leading-22px',
    'workspace-titlebar-layout':
      'flex flex-wrap items-center gap-x-16px gap-y-10px shrink-0 min-h-52px px-16px py-10px',
    'workspace-titlebar': 'workspace-titlebar-layout border-b border-b-solid border-divider',
    'workspace-titlebar-detached': 'workspace-titlebar-layout workspace-panel',
    'workspace-title-identity': 'flex min-w-0 max-w-full shrink-0 items-center gap-8px',
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
