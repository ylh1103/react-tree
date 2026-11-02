/** 工作区按需加载的本地演示授权；系统存在性与成员关系均读取接口，失败直接传播。 */
import { loadMySystems } from '@/api/systems.ts';
import { loadSystemAccess } from '@/api/systemAccess.ts';
import { HttpError } from '@/http/request.ts';
import type { LoginUser } from '@/types/user.ts';

/** 平台人员无须加入；普通用户每次校验最新关系，V/D/R 本期均允许进入。真实后端仍须逐请求鉴权。 */
export async function resolveSystemAccess(
  systemName: string,
  user: LoginUser | null,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  if (!user) throw new HttpError(401, '请先登录');
  const system = await loadSystemAccess(systemName, signal);
  if (user.userType === '0') return system;
  if (user.userType !== '1') throw new HttpError(403, '无系统访问权限');
  // 不用目录旧缓存放行；父子 loader 共享外层授权查询去重，取消信号贯穿请求。
  const mine = await loadMySystems(signal);
  if (!mine.some((item) => item.systemName === systemName))
    throw new HttpError(403, '尚未加入该系统');
  return system;
}
