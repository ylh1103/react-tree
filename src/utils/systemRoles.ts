import type { SystemRole } from '@/types/systems';

/** 系统目录的角色文案。 */
export const systemRoleLabels: Record<SystemRole, string> = {
  V: '观察者',
  D: '开发者',
  R: '系统负责人',
};

/** 申请流程将 R 展示为系统管理员，链接仍使用原角色编码。 */
export const systemJoinRoleLabels: Record<SystemRole, string> = {
  ...systemRoleLabels,
  R: '系统管理员',
};
