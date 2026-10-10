export type SystemRole = 'R' | 'D' | 'V';

export interface SystemInfo {
  ystId: string;
  systemName: string;
  systemChineseName: string;
  systemArchNo: string;
  systemDesc: string;
  role: SystemRole;
  appCount: number;
  paramTypeCount: number;
  systemCharges: string;
  ownRoom: string;
  ownGroup: string;
  sysRiskLevel: string;
  approverYstId: string;
  approverCharge: string;
}

export interface ParameterType {
  paramTypeName: string;
  displayName: string;
  description: string;
}
