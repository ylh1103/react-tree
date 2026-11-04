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

/** 卡片保留足够宽度展示双参数入口；骨架与正文共用响应式列数，避免加载时跳动。 */
export const systemCardGrid =
  'grid grid-cols-1 min-[720px]:grid-cols-2 desktop:grid-cols-3 wide:grid-cols-4 gap-5';
