/** 模拟系统服务：保留系统数据读写和接口错误，不模拟登录身份或成员关系。 */
import type { CreateSystemInput, SystemInfo } from '@/types/systems.ts';
import { mockSystems } from './systems.ts';
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
      appCount: item.appCount ? mockConfig.applicationCount : 0,
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
/** 返回业务系统列表，不附加当前访问者资料。 */
export function allSystems(): SystemInfo[] {
  return records();
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
  writeMock('systems', [...list, system]);
  return system;
}
