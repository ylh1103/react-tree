/** 登录用户资料；平台角色、网络环境与员工类型独立保存，不代表系统访问授权。 */
export interface LoginUser {
  openId: string;
  ystId: string;
  employeeId: string;
  /** 登录网络：0 办公网、1 互联网、2 业务网。 */
  netEnv: '0' | '1' | '2';
  /** 平台角色：0 平台人员、1 普通用户。 */
  userType: '0' | '1';
  userName: string;
  department: string;
  /** 1、2 表示正式员工；其他值原样保留，不用于推导平台角色。 */
  cmbUserType: string;
}
