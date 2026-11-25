/** 全局工具类主题与图标配置，由 Vite 和首屏构建插件共用。 */
import { defineConfig, presetWind3, presetIcons } from 'unocss';
import { themeVariables } from './src/styles/theme.ts';
import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' };

const wind3 = presetWind3();

export default defineConfig({
  // 扫描 React 源码和 HTML；TS 路由配置也包含完整图标类名。
  content: {
    pipeline: {
      include: [/\.(tsx?|jsx|html)($|\?)/],
    },
  },
  theme: {
    // 落地页使用 Wind3 标准断点，后台的 desktop 和 wide 沿用平台断点。
    breakpoints: { ...wind3.theme?.breakpoints, desktop: '1280px', wide: '1601px' },
    spacing: { layout: 'var(--layout-gap)' },
    borderRadius: { ui: 'var(--ui-radius)', control: 'var(--control-radius)' },
    colors: Object.fromEntries(
      Object.keys(themeVariables)
        .filter((name) => name.startsWith('--color-'))
        .map((name) => [name.slice('--color-'.length), `var(${name})`]),
    ),
  },
  preflights: [
    {
      // 普通链接复用 Ant Design 的主题色，保留导航等位置主动设置的颜色。
      getCSS: () =>
        ':where(a[href]){color:var(--color-link)}:where(a[href]:hover){color:var(--color-link-hover)}:where(a[href]:active){color:var(--color-link-active)}',
    },
  ],
  shortcuts: {
    // 根节点统一原生滚动条配色，覆盖 body 弹层；后代选择器降低优先级，保留局部隐藏与悬停行为。
    'app-scrollbars':
      '[scrollbar-color:var(--color-border)_transparent] [:where(&)_*]:[scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar-thumb]:bg-border [:where(&)_*::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [:where(&)_*::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent [:where(&)_*::-webkit-scrollbar-corner]:bg-transparent',

    'tree-scrollbar':
      '[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-8px [&::-webkit-scrollbar]:h-8px [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-4px [&:hover::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent',
    'workspace-frame': 'border border-solid border-border-subtle rounded-ui',
    'workspace-panel':
      'workspace-frame bg-surface [--color-text:var(--color-surface-text)] text-text',
    'workspace-muted': 'text-text-muted text-13px leading-22px',
    'workspace-page__title': 'm-0 text-text text-14px font-600 leading-22px',
    'workspace-titlebar-layout':
      'flex flex-wrap items-center gap-x-4 gap-y-2.5 shrink-0 min-h-52px px-4 py-2.5',
    'workspace-titlebar': 'workspace-titlebar-layout border-b border-b-solid border-divider',
    'workspace-titlebar-detached': 'workspace-titlebar-layout workspace-panel',
    'workspace-collection-titlebar':
      'h-48px min-h-48px! py-0! flex-nowrap! gap-x-2! [container-type:inline-size]',
    'workspace-titlebar-frame-edge': '-mt-1px border-t border-t-solid border-border-subtle',
    'layout-focus':
      'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-[-2px]',

    'layout-scroll': 'flex-1 min-w-0 min-h-0 overflow-auto',
  },
  presets: [
    wind3,
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
