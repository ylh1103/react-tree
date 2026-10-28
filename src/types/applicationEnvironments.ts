/** 应用环境参数的服务端契约；版本、审批与发布标记只描述接口结果，不代表用户授权。 */
export interface ApplicationEnvironment {
  systemName: string;
  appName: string;
  envTag: string;
  envOrder: number;
  envDesc: string;
  isPrd: '0' | '1';
  approvalRequiredFlag: 'Y' | 'N';
  configInfo: string;
  saveStatus: 'Y' | 'N';
  unsavedReason: string;
  techCrtTime: string;
  techMntTime: string;
  techVersion: number;
  maintDate: string;
  maintUser: string;
  currentVersion: number;
  latestVersion: number;
  latestShotMessage: string;
  currentShotMessage: string;
  enablePublish: 'Y' | 'N';
  /** 负数为后端状态码，含义未约定，不作为差异数量显示。 */
  runtimeDifferNum: number;
  risk: string;
  gtwDifferFlag: string;
}
