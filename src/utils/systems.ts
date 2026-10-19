/**
 * 系统列表搜索、描述文本提取及接口拒绝访问的错误判断。
 * 描述只提取离线 HTML 文本；错误沿 cause 链识别 403，不依赖用户资料。
 */
import type { SystemInfo } from '../types/systems.ts';

/** 搜索仅依赖系统业务资料，不再包含当前访问者的个人角色筛选。 */
export function filterSystems<T extends SystemInfo>(systems: T[], search: string) {
  const keyword = search.trim().toLocaleLowerCase();
  return systems.filter((system) =>
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
    ('status' in candidate && candidate.status === 403) ||
    (candidate.cause !== undefined && isAccessDenied(candidate.cause))
  );
}
