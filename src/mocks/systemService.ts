/** 模拟系统服务：成员关系独立保存，所有受保护接口使用同一授权判断。 */
import type { AllSystemInfo, CreateSystemInput, SystemInfo, SystemRole } from '../types/systems.ts';
import type { SessionUser } from '../types/session.ts';
import { mockSystems } from './systems.ts';
import { createMockParameters } from './parameters.ts';
import { mockConfig } from './config.ts';
import { readMock, writeMock } from './storage.ts';

type Fail = (status: number, message: string) => never;
type Members = Record<string, Record<string, SystemRole>>;
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
  );
const members = () =>
  readMock<Members>('members', {
    '310798': { CAC: 'D', CCCMonitor: 'R', LT11_01: 'V' },
    IT009682: { CAC: 'V' },
  });
/** 字典键可能来自 URL，只接受自己的有效角色，避免继承属性被当作成员。 */
function memberRole(roles: Record<string, SystemRole>, name: string): SystemRole | null {
  if (!Object.hasOwn(roles, name)) return null;
  return ['V', 'D', 'R'].includes(roles[name]) ? roles[name] : null;
}

export function allSystems(user: SessionUser): AllSystemInfo[] {
  const roles = members()[user.ystId] ?? {};
  return records().map((item) => {
    const system = { ...item } as Partial<SystemInfo>;
    delete system.ystId;
    delete system.role;
    return {
      ...system,
      userRelation: Boolean(memberRole(roles, item.systemName)),
      appGroupInfo: null,
      paramDbTypeGroupInfo: null,
    } as AllSystemInfo;
  });
}
export function mySystems(user: SessionUser): SystemInfo[] {
  const roles = members()[user.ystId] ?? {};
  return records()
    .filter((item) => memberRole(roles, item.systemName))
    .map((item) => ({ ...item, ystId: user.ystId, role: memberRole(roles, item.systemName) }));
}
export function accessSystem(user: SessionUser, name: string, fail: Fail): SystemInfo {
  const system = records().find((item) => item.systemName === name);
  if (!system) return fail(404, '系统不存在');
  const role = memberRole(members()[user.ystId] ?? {}, name);
  if (user.userType !== '0' && !role) return fail(403, '未加入此系统，请联系负责人');
  return { ...system, ystId: user.ystId, role };
}
export function createSystem(user: SessionUser, input: CreateSystemInput, fail: Fail): SystemInfo {
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
    systemCharges: `${user.userName}/${user.ystId}`,
    ystId: user.ystId,
    role: 'R',
    appCount: 0,
    paramTypeCount: 0,
  };
  const relations = members();
  relations[user.ystId] = { ...relations[user.ystId], [name]: 'R' };
  writeMock('systems', [...list, system]);
  writeMock('members', relations);
  return system;
}
