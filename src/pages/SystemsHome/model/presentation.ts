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

/** 组织契约为编号/名称；只移除首个编号段，兼容名称本身包含斜线。 */
export function organizationName(value: string | undefined) {
  if (!value) return '暂未配置';
  const separator = value.indexOf('/');
  return (separator < 0 ? value : value.slice(separator + 1)).trim() || '暂未配置';
}

/**
 * 页面最小宽度为 1024px，视口媒体查询无法反映真实内容宽度，因此列数按容器宽度计算；
 * 骨架与正文共用同一容器与网格，避免加载时跳动。
 */
export const systemCardContainer = '@container';
export const systemCardGrid =
  'grid grid-cols-1 @[600px]:grid-cols-2 @[900px]:grid-cols-3 @[1240px]:grid-cols-4 gap-5';

/** 12 可被 3、4 列整除，常见宽度下末行不留空位。 */
export const systemPageSizes = [12, 24, 48];

/** 风险等级仅作展示标记；A 为最高重要性。 */
export function riskLevelLabel(value: string | undefined) {
  return value ? `重要性 ${value}` : '重要性未配置';
}
