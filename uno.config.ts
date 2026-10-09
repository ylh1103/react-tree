import { defineConfig, presetWind3, presetIcons } from 'unocss';
import { navigationItems } from './src/layouts/navigation';
import lucideIcons from '@iconify-json/lucide/icons.json';

export default defineConfig({
  safelist: navigationItems.map(({ icon }) => icon),
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
