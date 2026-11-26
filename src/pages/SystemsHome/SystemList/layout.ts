/** 系统目录正文、加载骨架和页面宽度测量共用的视图布局。 */
export type SystemView = 'card' | 'list';

export const systemListLayout = 'grid gap-2';

/** 列表正文和骨架共用分栏：先并排入口，宽度足够后再把负责人及操作移到右列。 */
export const systemListRow =
  'workspace-panel grid min-w-0 @[960px]:grid-cols-[minmax(0,1fr)_240px] @[960px]:items-center';
export const systemListBody =
  'grid min-w-0 items-center gap-2 px-3 py-2 @[560px]:grid-cols-[minmax(0,1fr)_240px]';
export const systemListFooter =
  'flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-t-solid border-divider px-3 py-2 @[960px]:border-t-0';

/** 应用和数据库入口在正文与列表占位中使用相同的列宽与分隔线。 */
export const systemEntryGrid =
  'relative grid grid-cols-2 gap-2 before:pointer-events-none before:absolute before:inset-y-2.5 before:left-1/2 before:border-l before:border-l-solid before:border-l-border-subtle before:content-empty';

/**
 * 原生网格按可用宽度自动填列，每张多列卡片至少保留 360px，窄屏允许缩到容器宽度。
 * 避免依赖任意容器断点的生成顺序；auto-fill 保留不足一行时的列宽，骨架与正文共用布局。
 * `auto-rows-fr` 让所有行等高。卡片和骨架预留两行描述的空间，避免翻页时行高随描述变化。
 */
export const systemCardContainer = '@container';
export const systemCardGrid =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] auto-rows-fr gap-3 @[640px]:gap-4 @[1200px]:gap-5';

/** 正文卡片和加载骨架共用外框与边距，减少加载交接时的布局变化。 */
export const systemCardFrame =
  'workspace-panel [container-type:inline-size] [container-name:system-card] flex min-h-264px min-w-0 flex-col shadow-[0_3px_12px_var(--color-tree-filter-shadow)]';
export const systemCardPadding = 'p-3 @[360px]/system-card:p-3.5';
export const systemCardDescriptionHeight = 'h-36px';
export const systemCardFooter =
  '[background-color:color-mix(in_srgb,var(--color-canvas)_45%,var(--color-surface))] min-h-44px rounded-b-[inherit] py-2.5!';
