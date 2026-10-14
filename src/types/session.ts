/** SSO 原始用户信息；字符串编码与服务端保持一致，不从姓名或员工类型推导授权。 */
export interface SessionUser {
  expireTime: string;
  userSetting: string;
  openId: string;
  ystId: string;
  employeeId: string;
  netEnv: '0' | '1' | '2';
  userType: '0' | '1';
  userName: string;
  department: string;
  cmbUserType: string;
}

/** 无效身份不能进入工作区；expireTime 是 Unix 秒。 */
export function parseSession(value: SessionUser): SessionUser {
  if (!value?.ystId || !value.openId || !['0', '1'].includes(value.userType))
    throw new Error('登录用户信息无效');
  if (!Number.isFinite(Number(value.expireTime)) || Number(value.expireTime) * 1000 <= Date.now())
    throw new Error('登录状态已失效');
  return value;
}
