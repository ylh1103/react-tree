/** 系统存在性检索契约，按需加载，避免分页检索逻辑进入首页启动包。 */
import { loadSystemPage } from './systems.ts';
import { HttpError } from '@/http/request.ts';
import type { SystemInfo } from '@/types/systems.ts';

/** 无独立系统详情接口：关键字分页检索后精确匹配；查完全部候选才判定不存在。 */
export async function loadSystemAccess(name: string, signal?: AbortSignal): Promise<SystemInfo> {
  let pageNum = 1;
  while (true) {
    const page = await loadSystemPage({ pageNum, pageSize: 999, keyword: name }, signal);
    const match = page.records.find((item) => item.systemName === name);
    if (match) {
      // 加入标记属于目录，不混入系统业务资料或用来替代我的系统成员关系。
      const system: SystemInfo & { userRelation?: boolean } = { ...match };
      delete system.userRelation;
      return system;
    }
    if (page.pageNum * page.pageSize >= page.total) throw new HttpError(404, '系统不存在');
    pageNum = page.pageNum + 1;
  }
}
