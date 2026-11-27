/** 模拟系统目录与关系响应；目录关系用于前端演示授权；业务模拟接口仍保留错误注入，真实后端须独立鉴权。 */
import type {
  AllSystemInfo,
  CreateSystemInput,
  MySystemInfo,
  SystemInfo,
  SystemPage,
  SystemPageParams,
  SubsystemMetadata,
  UpdateSystemInput,
} from '@/types/systems.ts';
import { mockSystems, mockSystemRelations } from './systems.ts';
import { createMockParameters } from './parameters.ts';
import { mockConfig } from './config.ts';
import type { LoginUser } from '@/types/user.ts';
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
    ...(item.isFtc !== undefined ? { isFtc: item.isFtc } : {}),
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

/** 申请按发起账号保存；重复提交返回同一待审批状态，不写入成员关系。 */
export function requestSystemJoin(name: string, key: string, fail: Fail) {
  accessSystem(name, fail);
  if (Object.hasOwn(relations(), name)) return fail(409, '你已加入该系统');
  const pending = readMock<string[]>(key, []);
  if (!pending.includes(name)) writeMock(key, [...pending, name]);
  return { status: 'pending' } as const;
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
/** 按系统查找业务资料；403/503 直接模拟接口结果，真实后端必须独立校验登录与授权，不能依赖前端入口。 */
export function accessSystem(name: string, fail: Fail): SystemInfo {
  const system = records().find((item) => item.systemName === name);
  if (!system) return fail(404, '系统不存在');
  if (mockConfig.systemAccessError)
    return fail(mockConfig.systemAccessError, '系统服务拒绝本次请求');
  return system;
}
/** 独立架构目录示例包含尚未接入平台的子系统，创建系统不会改变目录结果。 */
const architectureDirectory = [
  ...mockSystems,
  {
    ...mockSystems[0],
    systemArchNo: 'LL57.PAY',
    systemChineseName: '金融交易云支付',
    systemDesc: '处理金融交易云的支付交易',
  },
  {
    ...mockSystems[0],
    systemArchNo: 'LL57.RSK',
    systemChineseName: '金融交易云风控',
    systemDesc: '处理金融交易云的风险识别与控制',
  },
  {
    ...mockSystems[0],
    systemArchNo: 'LL57.OPS',
    systemChineseName: '应用运维服务',
    systemDesc: '管理应用运行监控与运维任务',
  },
];
const emptyMetadata: SubsystemMetadata = {
  systemDesc: '',
  systemChineseName: '',
  sysRiskLevel: '',
  ownRoom: '',
  ownGroup: '',
};

export function ftcSubsystem(name: string) {
  const product = ['CAC', 'PAY', 'RSK'].find((item) => item === name.toUpperCase());
  return product ? { systemArchNo: `LL57.${product}` } : null;
}

export function subsystemMetadata(code: string): SubsystemMetadata | null {
  const entry = architectureDirectory.find((item) => item.systemArchNo === code);
  if (!entry) return null;
  const { systemChineseName, sysRiskLevel, ownRoom, ownGroup, systemDesc } = entry;
  return { systemChineseName, sysRiskLevel, ownRoom, ownGroup, systemDesc };
}

function requireMetadata(code: string, fail: Fail) {
  return code ? (subsystemMetadata(code) ?? fail(400, '未找到该子系统编码')) : emptyMetadata;
}

export function createSystem(
  input: CreateSystemInput,
  fail: Fail,
  user?: LoginUser | null,
): SystemInfo {
  const list = records();
  const name = typeof input?.systemName === 'string' ? input.systemName.trim() : '';
  const submittedCode = typeof input?.systemArchNo === 'string' ? input.systemArchNo.trim() : '';
  const legacy = input?.isFtc === undefined;
  const arch = input?.isFtc ? (ftcSubsystem(name)?.systemArchNo ?? '') : submittedCode;
  if (!name) return fail(400, '请填写系统英文名');
  if (legacy && (!arch || !input.systemChineseName?.trim()))
    return fail(400, '请填写系统英文名、中文名和架构编码');
  if (!legacy && !(input.isFtc ? /^[a-z0-9]{3}$/i : /^[a-z0-9_-]{1,10}$/i).test(name))
    return fail(400, '系统名称格式无效');
  if (input.isFtc && !arch) return fail(400, '未找到该 FTC 产品');
  if (list.some((item) => item.systemName === name || (arch && item.systemArchNo === arch)))
    return fail(409, '系统英文名或架构编码已存在');
  const metadata = legacy
    ? {
        systemChineseName: input.systemChineseName.trim(),
        systemDesc: '',
        ownRoom: input.ownRoom ?? '',
        ownGroup: input.ownGroup ?? '',
        sysRiskLevel: input.sysRiskLevel ?? '',
      }
    : requireMetadata(arch, fail);
  const approverCharge = legacy ? (input.approverCharge ?? '') : '';
  const owner = !legacy && user ? [user.userName, user.employeeId].filter(Boolean).join('/') : '';
  const system: SystemInfo = {
    ...metadata,
    ...(!legacy && { isFtc: input.isFtc }),
    systemName: name,
    systemArchNo: arch,
    systemDesc: input.systemDesc ?? metadata.systemDesc,
    approverCharge,
    approverYstId: approverCharge
      .split(',')
      .map((item) => item.split('/')[1])
      .filter(Boolean)
      .join(','),
    systemCharges: owner,
    appCount: 0,
    paramTypeCount: 0,
  };
  writeMock('systems', [system, ...list]);
  // 模拟创建接口将新系统关联到我的目录；没有真实身份时不填造员工编号。
  writeMock('system-relations', { ...relations(), [name]: { ystId: '', role: 'R' } });
  return system;
}

/** 更新只接收描述和编码，FTC 编码及人员字段保留原值。 */
export function updateSystem(
  name: string,
  input: UpdateSystemInput,
  user: LoginUser | null,
  fail: Fail,
) {
  if (!user) return fail(401, '请先登录');
  const system = accessSystem(name, fail);
  // 模拟写入端也校验当前关系角色，避免只依赖菜单可见性。
  if (user.userType !== '0' && relations()[name]?.role !== 'R') return fail(403, '无系统管理权限');
  if (typeof input?.systemArchNo !== 'string' || typeof input?.systemDesc !== 'string')
    return fail(400, '系统管理参数无效');
  const list = records();
  const code = input.systemArchNo.trim();
  if (system.isFtc && code !== system.systemArchNo) return fail(400, 'FTC 子系统编码不可修改');
  if (code && list.some((item) => item.systemName !== name && item.systemArchNo === code))
    return fail(409, '架构编码已存在');
  const updated = {
    ...system,
    ...(code !== system.systemArchNo && requireMetadata(code, fail)),
    systemArchNo: code,
    systemDesc: input.systemDesc,
  };
  writeMock(
    'systems',
    list.map((item) => (item.systemName === name ? updated : item)),
  );
  return updated;
}
