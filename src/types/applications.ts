export interface ApplicationItem {
  appName: string;
  appDesc: string;
  appType: '0' | '1';
}

/** 管理表单的可写字段；旧清单仍只要求名称、描述和类型。 */
export interface ApplicationDetails extends ApplicationItem {
  releaseUnit: string;
  envTags: string[];
  sharedModules: string[];
}

export const applicationEnvironmentTags = [
  'dev',
  'st',
  'uat',
  'prd',
  'stb',
  'uam',
  'uatb',
  'yzc',
  'i01',
  'local',
  'stp',
];

export const defaultApplicationEnvironmentTags = ['dev', 'st', 'uat', 'stp', 'prd'];
