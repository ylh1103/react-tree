/** 系统目录与详情共用角色、重要性等级和负责人头像的展示样式。 */
import type { SystemRole } from '@/types/systems';

/** 角色标签使用随主题适配的预设色，图标和文字也能独立区分角色。 */
export const systemRoleTags: Record<SystemRole, { color: string; icon: string }> = {
  R: { color: 'gold', icon: 'i-lucide-user-round-check' },
  D: { color: 'blue', icon: 'i-lucide-code-xml' },
  V: { color: 'cyan', icon: 'i-lucide-eye' },
};

/** 等级标签与详情主卡共用色系，主卡使用深色渐变以保留白字对比度。 */
export const riskLevelAppearance: Partial<Record<string, { color: string; background: string }>> = {
  A: { color: 'red', background: 'bg-[linear-gradient(150deg,#c41d2f,#8f1322)]' },
  B: { color: 'orange', background: 'bg-[linear-gradient(150deg,#b45309,#8a3c05)]' },
  C: { color: 'cyan', background: 'bg-[linear-gradient(150deg,#087680,#07545e)]' },
  D: { color: 'purple', background: 'bg-[linear-gradient(150deg,#722ed1,#43178a)]' },
};

/** 列表负责人浮层与详情名单共用头像样式。 */
export const systemAvatarTone = 'bg-hover! text-accent-text! font-500!';
