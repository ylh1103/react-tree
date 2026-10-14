export type SystemRole = 'R' | 'D' | 'V';

export interface SystemInfo {
  ystId: string;
  systemName: string;
  systemChineseName: string;
  systemArchNo: string;
  systemDesc: string;
  role: SystemRole | null;
  appCount: number;
  paramTypeCount: number;
  systemCharges: string;
  ownRoom: string;
  ownGroup: string;
  sysRiskLevel: string;
  approverYstId: string;
  approverCharge: string;
}

/** 所有系统只表达成员关系，平台访问权限不伪造成成员角色。 */
export interface AllSystemInfo extends Omit<SystemInfo, 'ystId' | 'role'> {
  userRelation: boolean;
  appGroupInfo: string | null;
  paramDbTypeGroupInfo: string | null;
}

/** 创建者、成员角色及数量由服务端决定。 */
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
