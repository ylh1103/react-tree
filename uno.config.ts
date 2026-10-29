/** 全局工具类主题与图标配置，由 Vite 和首屏构建插件共用。 */
import { defineConfig, presetWind3, presetIcons } from 'unocss';
import { themeVariables } from './src/styles/theme.ts';
import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' };

export default defineConfig({
  // 项目使用 React + TypeScript，扫描 TS/TSX 与 HTML 入口，包含路由配置中的完整图标类名。
  content: {
    pipeline: {
      include: [/\.(tsx?|html)($|\?)/],
    },
  },
  theme: {
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
    // 根节点统一原生滚动条配色，覆盖 body 弹层；后代选择器降低优先级，保留局部隐藏与悬停行为。
    'app-scrollbars':
      '[scrollbar-color:var(--color-border)_transparent] [:where(&)_*]:[scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar-thumb]:bg-border [:where(&)_*::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [:where(&)_*::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent [:where(&)_*::-webkit-scrollbar-corner]:bg-transparent',

    'tree-scrollbar':
      '[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-8px [&::-webkit-scrollbar]:h-8px [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-4px [&:hover::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent',
    'workspace-frame': 'border border-solid border-border-subtle rounded-ui',
    'workspace-panel': 'workspace-frame bg-surface',
    'workspace-muted': 'text-text-muted text-13px leading-22px',
    'workspace-page__title': 'm-0 text-text text-14px font-600 leading-22px',
    'workspace-titlebar-layout':
      'flex flex-wrap items-center gap-x-4 gap-y-2.5 shrink-0 min-h-52px px-4 py-2.5',
    'workspace-titlebar': 'workspace-titlebar-layout border-b border-b-solid border-divider',
    'workspace-titlebar-detached': 'workspace-titlebar-layout workspace-panel',
    'workspace-collection-titlebar':
      'h-48px min-h-48px! py-0! flex-nowrap! gap-x-2! [container-type:inline-size]',
    'workspace-titlebar-frame-edge': '-mt-1px border-t border-t-solid border-border-subtle',
    'workspace-title-identity': 'flex min-w-0 max-w-full shrink-0 items-center gap-2',
    'layout-focus':
      'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-[-2px]',

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
