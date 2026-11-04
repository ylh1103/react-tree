/** 系统存在性检索契约，按需加载，避免分页检索逻辑进入首页启动包。 */
import { loadSystemPage } from './systems.ts';
import { SystemAccessError } from './systemAccessError.ts';
import type { AllSystemInfo } from '@/types/systems.ts';

/** 无独立系统详情接口：关键字分页检索后精确匹配；查完全部候选才判定不存在。 */
export async function loadSystemAccess(name: string, signal?: AbortSignal): Promise<AllSystemInfo> {
  let pageNum = 1;
  while (true) {
    const page = await loadSystemPage({ pageNum, pageSize: 999, keyword: name }, signal);
    const match = page.records.find((item) => item.systemName === name);
    // 保留接口返回的加入状态，供上层统一判断当前用户是否可访问。
    if (match) return match;
    if (page.pageNum * page.pageSize >= page.total) throw new SystemAccessError(404, '系统不存在');
    pageNum = page.pageNum + 1;
  }
}
