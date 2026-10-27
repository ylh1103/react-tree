/** 系统业务资料，不包含当前访问者的用户信息或个人角色。 */
export interface SystemInfo {
  systemName: string;
  systemChineseName: string;
  systemArchNo: string;
  systemDesc: string;
  appCount: number;
  paramTypeCount: number;
  systemCharges: string;
  ownRoom: string;
  ownGroup: string;
  sysRiskLevel: string;
  approverYstId: string;
  approverCharge: string;
}

/** 系统关系由接口明确返回，只用于目录展示，不替代工作区访问校验。 */
export type SystemRole = 'V' | 'D' | 'R';

/** 我的系统包含本系统的关系资料；不据此构造登录身份或全局权限。 */
export interface MySystemInfo extends SystemInfo {
  ystId: string;
  role: SystemRole;
}

/** 全部系统的加入状态独立于角色，不从负责人或组织信息推导。 */
export interface AllSystemInfo extends SystemInfo {
  userRelation: boolean;
}

/** 所有系统的服务端分页条件；页码从 1 开始，筛选发生在服务端分页之前。 */
export interface SystemPageParams {
  pageNum: number;
  pageSize: number;
  keyword: string;
  userRelation?: boolean;
}

/** total 为筛选后的全量数量，records 仅包含当前页，页面不可再次切片或过滤。 */
export interface SystemPage {
  records: AllSystemInfo[];
  total: number;
  pageNum: number;
  pageSize: number;
}

/** 创建系统只提交业务字段，不从前端用户资料填充负责人。 */
export interface CreateSystemInput {
  systemName: string;
  systemChineseName: string;
  systemArchNo: string;
  systemDesc?: string;
  ownRoom?: string;
  ownGroup?: string;
  sysRiskLevel?: 'A' | 'B' | 'C' | 'D';
  approverCharge?: string;
}

export interface ParameterType {
  paramTypeName: string;
  displayName: string;
  description: string;
}
