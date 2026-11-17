/** 系统目录的纯展示映射：只解读接口字段，不推导身份、成员关系或访问权限。 */
import type { SystemRole } from '@/types/systems';

export const systemRoleLabels: Record<SystemRole, string> = {
  V: '观察者',
  D: '开发者',
  R: '系统负责人',
};

/** 目录展示姓名，完整的姓名/编号串仍在提示与详情中保留。 */
export function peopleNames(value: string | undefined) {
  return (
    value
      ?.split(',')
      .map((person) => person.trim().split('/')[0])
      .filter(Boolean)
      .join('、') || '暂未配置'
  );
}

/** 负责人契约为“姓名/编号”逗号分隔；头像只取姓名首字，完整值保留给提示。 */
export function peopleList(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((person) => person.trim())
    .filter(Boolean)
    .map((raw) => {
      const [name = '', ...rest] = raw.split('/');
      const displayName = name.trim() || raw;
      return {
        key: raw,
        name: displayName,
        id: rest.join('/').trim(),
        initial: Array.from(displayName)[0] ?? '?',
      };
    });
}

/** 组织契约为编号/名称；只移除首个编号段，兼容名称本身包含斜线。 */
export function organizationName(value: string | undefined) {
  if (!value) return '暂未配置';
  const separator = value.indexOf('/');
  return (separator < 0 ? value : value.slice(separator + 1)).trim() || '暂未配置';
}

/**
 * 原生网格按可用宽度自动填列，每张多列卡片至少保留 360px，窄屏允许缩到容器宽度。
 * 避免依赖任意容器断点的生成顺序；auto-fill 保留不足一行时的列宽，骨架与正文共用布局。
 * `auto-rows-fr` 让所有行取最高卡片的高度：描述按实际行数排版不留空白，
 * 多出的高度由卡片内 `mt-auto` 吸收到入口上方，整页卡片等高、入口对齐。
 */
export const systemCardContainer = '@container';
export const systemCardGrid =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] auto-rows-fr gap-3 @[640px]:gap-4 @[1200px]:gap-5';

/** 正文卡片和加载骨架共用外框与边距，减少加载交接时的布局变化。 */
export const systemCardFrame =
  'workspace-panel rounded-16px! [container-type:inline-size] [container-name:system-card] flex min-w-0 flex-col overflow-hidden shadow-[0_3px_12px_var(--color-tree-filter-shadow)]';
export const systemCardPadding = 'p-3 @[360px]/system-card:p-3.5';
export const systemCardFooter =
  '[background-color:color-mix(in_srgb,var(--color-canvas)_45%,var(--color-surface))] py-2.5!';

/** 两份系统目录默认每页 8 条，保留已有的每页数量选项。 */
export const systemPageSizes = [8, 12, 24, 48];

/** 角色标签使用随主题适配的预设色，图标和文字也能独立区分角色。 */
export const systemRoleTags: Record<SystemRole, { color: string; icon: string }> = {
  R: { color: 'gold', icon: 'i-lucide-user-round-check' },
  D: { color: 'blue', icon: 'i-lucide-code-xml' },
  V: { color: 'cyan', icon: 'i-lucide-eye' },
};
