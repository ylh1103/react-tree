/** 临时本地登录凭据；同一条记录保存登录标志与用户资料，避免两份记录不一致。 */
import type { LoginUser } from '@/types/user.ts';

export const loginStorageKey = 'parameter-management:login';

/** 仅检查会话版本与登录标志，用户资料直接恢复；读取失败不覆盖原记录。 */
export function readLoginUser(): LoginUser | null {
  try {
    const raw = localStorage.getItem(loginStorageKey);
    if (!raw) return null;
    const session: unknown = JSON.parse(raw);
    console.log('readLoginUser session:', session);
    if (!session || typeof session !== 'object') return null;
    const record = session as Record<string, unknown>;
    return record.version === 1 && record.loggedIn === true
      ? ((record.user as LoginUser | null | undefined) ?? null)
      : null;
  } catch {
    return null;
  }
}

/** 写入失败交给登录页提示；只有持久化成功后才更新 Redux 和跳转。 */
export function writeLoginUser(user: LoginUser) {
  localStorage.setItem(loginStorageKey, JSON.stringify({ version: 1, loggedIn: true, user }));
}

/** 退出只移除登录记录，保留显示偏好与业务 Mock 数据；失败时交给界面提示重试。 */
export function removeLoginUser() {
  localStorage.removeItem(loginStorageKey);
}
