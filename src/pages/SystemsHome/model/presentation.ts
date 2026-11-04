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
 * 页面不设最小宽度，列数按容器宽度计算（窄窗口逐级降到 2 列、1 列），不受视口断点和侧边内容影响；
 * 骨架与正文共用同一容器与网格，避免加载时跳动。
 * `auto-rows-fr` 让所有行取最高卡片的高度：描述按实际行数排版不留空白，
 * 多出的高度由卡片内 `mt-auto` 吸收到入口上方，整页卡片等高、入口对齐。
 */
export const systemCardContainer = '@container';
export const systemCardGrid =
  'grid grid-cols-1 auto-rows-fr @[600px]:grid-cols-2 @[900px]:grid-cols-3 @[1240px]:grid-cols-4 gap-5';

/** 12 可被 3、4 列整除，常见宽度下末行不留空位。 */
export const systemPageSizes = [12, 24, 48];

/** 风险等级仅作展示标记；A 为最高重要性。 */
export function riskLevelLabel(value: string | undefined) {
  return value ? `重要性 ${value}` : '重要性未配置';
}

/** 信号格数：A→4、B→3、C→2、D 及以后→1；未配置或非字母等级为 0，只影响视觉强度。 */
export const riskLevelMax = 4;
export function riskLevelRank(value: string | undefined) {
  const letter = value?.trim().charAt(0).toUpperCase();
  if (!letter || letter < 'A' || letter > 'Z') return 0;
  return Math.max(1, riskLevelMax - (letter.charCodeAt(0) - 65));
}

/**
 * 标签色只用 Ant Design 预设色，深浅主题由组件算法自动适配；
 * 颜色仅辅助辨识，文字仍完整表达角色与等级，不参与授权判断。
 */
export const systemRoleTags: Record<SystemRole, { color: string; icon: string }> = {
  R: { color: 'gold', icon: 'i-lucide-crown' },
  D: { color: 'blue', icon: 'i-lucide-code-xml' },
  V: { color: 'cyan', icon: 'i-lucide-eye' },
};

/** A 最高重要性用最醒目的红色，逐级减弱；D 及以后、未配置回到中性色。 */
export function riskLevelColor(value: string | undefined) {
  const rank = riskLevelRank(value);
  if (rank >= 4) return 'red';
  if (rank === 3) return 'orange';
  if (rank === 2) return 'gold';
  return 'default';
}
