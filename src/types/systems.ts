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
