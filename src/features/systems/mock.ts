import type { SystemInfo } from './types';

const cac: SystemInfo = {
  ystId: '310798',
  systemName: 'CAC',
  systemChineseName: '信用卡核心 - 核心账务',
  systemArchNo: 'LL57.CAC',
  systemDesc: '<p>信用卡核心账务处理，包括利息 入账 账单 延滞 管制 等账务业务</p>20261006142517',
  role: 'D',
  appCount: 62,
  paramTypeCount: 24,
  systemCharges:
    '何蓓杰/249546,刘晶瑞/296232,吴义龙/296780,周子鹏/308007,李家旺/320817,吴图威/IT009653',
  ownRoom: '992484/信用卡账务开发一室',
  ownGroup: '991750/账务二组',
  sysRiskLevel: 'A',
  approverYstId: '280480',
  approverCharge: '陈韦达/280480',
};

export const mockSystems: SystemInfo[] = [
  cac,
  ...[
    ['CCCMonitor', '新核心监控系统', 'R', 10, 137, '核心业务运行监控与参数管理'],
    ['LR13_CCP', '信用卡核心 - 支付业务', 'R', 0, 0, ''],
    ['LT11_01', '数据服务子系统', 'V', 0, 0, ''],
    ['LT11_41', '智能审核系统审核子系统', 'R', 0, 0, ''],
    ['ParamPlat', '参数管家 ST', 'R', 86, 177, '统一应用参数与数据库参数管理'],
    ['demo_1', '信用卡核心 - 核心账务', 'D', 8, 4, '核心账务演示系统'],
    ['test_2', '信用卡核心技术工具集', 'V', 8, 0, '信用卡核心技术工具集，包括配置管理与服务治理'],
    ['公共配置', '公共服务配置中心', 'D', 12, 6, '跨系统公共服务与配置管理'],
  ].map(([name, chineseName, role, appCount, paramTypeCount, description], index) => ({
    ...cac,
    ystId: String(310799 + index),
    systemName: String(name),
    systemChineseName: String(chineseName),
    systemArchNo: `LL57.${name}`,
    systemDesc: String(description),
    role: role as SystemInfo['role'],
    appCount: Number(appCount),
    paramTypeCount: Number(paramTypeCount),
    systemCharges: '谢伟业/310798,陈韦达/280480',
  })),
];
