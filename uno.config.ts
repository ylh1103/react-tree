import { defineConfig, presetWind3, presetIcons } from 'unocss';
import { navigationItems, databaseNavigationItems } from './src/layouts/navigation';
import { themeVariables } from './src/styles/theme';
import lucideIcons from '@iconify-json/lucide/icons.json';

export default defineConfig({
  safelist: [...navigationItems, ...databaseNavigationItems].map(({ icon }) => icon),
  theme: {
    // 桌面布局：1280px 为最小宽度，超过 1600px 显示完整工具文字。
    breakpoints: { desktop: '1280px', wide: '1601px' },
    spacing: { layout: 'var(--layout-gap)' },
    colors: Object.fromEntries(
      Object.keys(themeVariables)
        .filter((name) => name.startsWith('--color-'))
        .map((name) => [name.slice('--color-'.length), `var(${name})`]),
    ),
  },
  shortcuts: {
    'settings-choice':
      'flex! h-auto! min-w-0 [&>span:last-child]:w-full px-2.5! py-3! rounded-8px! border! border-solid! border-border! bg-surface! text-text! text-center whitespace-normal! leading-normal! before:hidden! hover:border-accent! [&.ant-radio-button-wrapper-checked]:border-accent! [&.ant-radio-button-wrapper-checked]:bg-hover! [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-solid [&:has(:focus-visible)]:outline-accent [&:has(:focus-visible)]:outline-offset-2 motion-reduce:transition-none!',
    'page-skeleton': 'motion-reduce:[&_.ant-skeleton-active_*]:animate-none!',
    'app-viewport': 'h-full overflow-auto',
    'app-desktop-shell': 'h-full min-w-1280px [&[data-layout=compact]]:[--layout-gap:0px]',
    'navigation-settings':
      'mt-auto! flex! flex-col! items-center! justify-center! gap-1.25! min-h-54px h-auto! w-full! py-1.75! px-0! rounded-6px! border-0! text-nav-text! hover:text-nav-emphasis! hover:bg-nav-hover! active:bg-nav-pressed! layout-focus motion-reduce:transition-none!',
    'compact-split-divider':
      "flex-[0_0_1px] rounded-0 bg-divider before:content-[''] before:absolute before:inset-y-0 before:left-1/2 before:translate-x-[-50%] before:w-4px before:transition-colors before:duration-100 motion-reduce:before:transition-none [&.hover]:before:bg-accent [&.active]:before:bg-accent [&:focus-visible:not([aria-disabled=true])]:before:bg-accent",
    'tree-scrollbar':
      '[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-8px [&::-webkit-scrollbar]:h-8px [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-4px [&:hover::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent',
    'system-entry':
      'h-38px! gap-1.5! px-2.25! text-12px! rounded-4px! focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-2 motion-reduce:transition-none!',
    'system-entry-count':
      'min-w-20px px-1 rounded-3px bg-sidebar text-text-muted text-11px leading-18px tabular-nums',
    'system-row-grid': 'grid grid-cols-[minmax(0,1fr)_90px_160px_300px] gap-x-6 gap-y-3',
    'workspace-frame': 'border border-solid border-border-subtle rounded-8px',
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
