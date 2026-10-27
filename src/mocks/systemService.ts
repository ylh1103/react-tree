/** 模拟系统目录与关系响应；访问始终独立走 accessSystem，不从目录关系授予权限。 */
import type {
  AllSystemInfo,
  CreateSystemInput,
  MySystemInfo,
  SystemInfo,
  SystemPage,
  SystemPageParams,
} from '@/types/systems.ts';
import { mockSystems, mockSystemRelations } from './systems.ts';
import { createMockParameters } from './parameters.ts';
import { mockConfig } from './config.ts';
import { readMock, writeMock } from './storage.ts';

type Fail = (status: number, message: string) => never;
/** 只返回业务字段，避免旧版模拟持久化中的访问者资料重新进入接口响应。 */
const records = () =>
  readMock<SystemInfo[]>(
    'systems',
    mockSystems.map((item) => ({
      ...item,
      // 需求示例保留小规模清单；其余既有夹具继续使用全局压力测试规模。
      appCount:
        item.systemName === 'CACTEST1'
          ? item.appCount
          : item.appCount
            ? mockConfig.applicationCount
            : 0,
      paramTypeCount: item.paramTypeCount
        ? Math.min(item.paramTypeCount, createMockParameters().length)
        : 0,
    })),
  ).map((item) => ({
    systemName: item.systemName,
    systemChineseName: item.systemChineseName,
    systemArchNo: item.systemArchNo,
    systemDesc: item.systemDesc,
    appCount: item.appCount,
    paramTypeCount: item.paramTypeCount,
    systemCharges: item.systemCharges,
    ownRoom: item.ownRoom,
    ownGroup: item.ownGroup,
    sysRiskLevel: item.sysRiskLevel,
    approverYstId: item.approverYstId,
    approverCharge: item.approverCharge,
  }));
const relations = () => readMock('system-relations', mockSystemRelations);
/** 全部目录只附加明确的加入标记，不泄露个人编号和角色。 */
export function allSystems(): AllSystemInfo[] {
  const membership = relations();
  return records().map((item) => ({
    ...item,
    userRelation: Object.prototype.hasOwnProperty.call(membership, item.systemName),
  }));
}

/** 模拟后端先查询再分页；返回真实 total 和当前有效页，空结果固定为第一页。 */
export function systemPage(params: SystemPageParams): SystemPage {
  const keyword = params.keyword.trim().toLocaleLowerCase();
  const filtered = allSystems().filter(
    (item) =>
      (params.userRelation === undefined || item.userRelation === params.userRelation) &&
      [
        item.systemName,
        item.systemChineseName,
        item.systemArchNo,
        item.ownRoom,
        item.ownGroup,
        item.systemCharges,
        item.approverCharge,
      ].some((value) => value.toLocaleLowerCase().includes(keyword)),
  );
  const pageNum = Math.min(
    params.pageNum,
    Math.max(1, Math.ceil(filtered.length / params.pageSize)),
  );
  return {
    records: filtered.slice((pageNum - 1) * params.pageSize, pageNum * params.pageSize),
    total: filtered.length,
    pageNum,
    pageSize: params.pageSize,
  };
}
/** 我的目录单独返回接口角色；旧 systems 存储里的遗留身份字段仍被剔除。 */
export function mySystems(): MySystemInfo[] {
  const membership = relations();
  return records().flatMap((item) =>
    Object.prototype.hasOwnProperty.call(membership, item.systemName)
      ? [{ ...item, ...membership[item.systemName] }]
      : [],
  );
}
/** 按系统查找业务资料；403/503 直接模拟接口结果，后续鉴权由新的登录设计接入。 */
export function accessSystem(name: string, fail: Fail): SystemInfo {
  const system = records().find((item) => item.systemName === name);
  if (!system) return fail(404, '系统不存在');
  if (mockConfig.systemAccessError)
    return fail(mockConfig.systemAccessError, '系统服务拒绝本次请求');
  return system;
}
export function createSystem(input: CreateSystemInput, fail: Fail): SystemInfo {
  const list = records();
  const name = typeof input?.systemName === 'string' ? input.systemName.trim() : '';
  const arch = typeof input?.systemArchNo === 'string' ? input.systemArchNo.trim() : '';
  if (
    !name ||
    !arch ||
    typeof input?.systemChineseName !== 'string' ||
    !input.systemChineseName.trim()
  )
    return fail(400, '请填写系统英文名、中文名和架构编码');
  if (list.some((item) => item.systemName === name || item.systemArchNo === arch))
    return fail(409, '系统英文名或架构编码已存在');
  const system: SystemInfo = {
    systemName: name,
    systemChineseName: input.systemChineseName.trim(),
    systemArchNo: arch,
    systemDesc: input.systemDesc ?? '',
    ownRoom: input.ownRoom ?? '',
    ownGroup: input.ownGroup ?? '',
    sysRiskLevel: input.sysRiskLevel ?? '',
    approverCharge: input.approverCharge ?? '',
    approverYstId: (input.approverCharge ?? '')
      .split(',')
      .map((item) => item.split('/')[1])
      .filter(Boolean)
      .join(','),
    systemCharges: '',
    appCount: 0,
    paramTypeCount: 0,
  };
  writeMock('systems', [system, ...list]);
  // 模拟创建接口将新系统关联到我的目录；没有真实身份时不填造员工编号。
  writeMock('system-relations', { ...relations(), [name]: { ystId: '', role: 'R' } });
  return system;
}
