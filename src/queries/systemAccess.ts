/** 工作区按需加载的本地演示授权；系统存在性与加入状态来自同一次系统检索，失败直接传播。 */
import { loadSystemAccess } from '@/api/systemAccess.ts';
import { HttpError } from '@/http/request.ts';
import { SystemAccessError } from '@/api/systemAccessError.ts';
import type { SystemAccessInfo } from '@/types/systems.ts';
import type { SystemAccessIdentity } from '@/types/user.ts';

/** 统一检索所有系统；平台人员无须加入，普通用户以接口 userRelation 为准。真实后端仍须逐请求鉴权。 */
export async function resolveSystemAccess(
  systemName: string,
  user: SystemAccessIdentity | null,
  signal: AbortSignal,
): Promise<SystemAccessInfo> {
  signal.throwIfAborted();
  if (!user) throw new HttpError(401, '请先登录');
  if (user.userType !== '0' && user.userType !== '1')
    throw new SystemAccessError(403, '无系统访问权限');
  const system = await loadSystemAccess(systemName, signal);
  signal.throwIfAborted();
  // 只信任本次查询返回的明确加入状态，不再为鉴权读取我的系统或使用其旧缓存。
  if (user.userType === '0' || system.userRelation === true) return system;
  throw new SystemAccessError(403, '尚未加入该系统');
}
