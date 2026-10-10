import type { SystemInfo, SystemRole } from './types.ts';

export const roleOptions: { label: string; value: SystemRole }[] = [
  { label: '系统负责人', value: 'R' },
  { label: '开发者', value: 'D' },
  { label: '观察者', value: 'V' },
];

export function roleLabel(role: string) {
  return roleOptions.find((option) => option.value === role)?.label ?? '未知角色';
}

export function filterSystems(systems: SystemInfo[], search: string, role?: SystemRole) {
  const keyword = search.trim().toLocaleLowerCase();
  return systems.filter(
    (system) =>
      (!role || system.role === role) &&
      [system.systemName, system.systemChineseName, system.systemArchNo].some((value) =>
        (value ?? '').toLocaleLowerCase().includes(keyword),
      ),
  );
}

/** 使用离线文档提取文字；描述中的 HTML 不进入可见页面。 */
export function descriptionText(html: string | undefined) {
  if (!html?.trim()) return '暂无系统描述';
  const document = new DOMParser().parseFromString(html, 'text/html');
  document
    .querySelectorAll('script, style, iframe, object, template')
    .forEach((node) => node.remove());
  document.querySelectorAll('p, div, br, li').forEach((node) => node.append(' '));
  return document.body.textContent?.replace(/\s+/g, ' ').trim() || '暂无系统描述';
}

export function isAccessDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { response?: { status?: number }; cause?: unknown };
  return (
    candidate.response?.status === 403 ||
    (candidate.cause !== undefined && isAccessDenied(candidate.cause))
  );
}
