/** 系统业务接口，统一封装目录读取、系统检索和写入请求。 */
import { HttpError, requestData } from '@/http/request.ts';
import type {
  AllSystemInfo,
  CreateSystemInput,
  MySystemInfo,
  SystemInfo,
  SystemJoinTarget,
  SystemPage,
  SystemPageParams,
  SubsystemMetadata,
  UpdateSystemInput,
} from '@/types/systems.ts';

/** 标记系统存在性与访问校验失败，避免路由错误页将系统 404 混同为页面 404。 */
export class SystemAccessError extends HttpError {
  /** 仅在已确认系统存在且当前用户未加入时提供申请所需资料。 */
  readonly joinTarget?: SystemJoinTarget;

  constructor(status: 403 | 404, message: string, joinTarget?: SystemJoinTarget) {
    super(status, message);
    this.joinTarget = joinTarget;
  }
}

export const loadSystems = (signal?: AbortSignal) =>
  requestData<AllSystemInfo[]>({ url: '/api/systems', signal });
export const loadMySystems = (signal?: AbortSignal) =>
  requestData<MySystemInfo[]>({ url: '/api/systems/mine', signal });
/** 分页目录与我的系统契约分开，避免首页为分页拉取整份系统清单。 */
export const loadSystemPage = (params: SystemPageParams, signal?: AbortSignal) =>
  requestData<SystemPage>({ url: '/api/systems/page', params, signal });
/** 无独立系统详情接口：关键字分页检索后精确匹配；查完全部候选才判定不存在。 */
export async function loadSystemByName(name: string, signal?: AbortSignal): Promise<AllSystemInfo> {
  let pageNum = 1;
  while (true) {
    const page = await loadSystemPage({ pageNum, pageSize: 999, keyword: name }, signal);
    const match = page.records.find((item) => item.systemName === name);
    // 保留接口返回的加入状态，供上层统一判断当前用户是否可访问。
    if (match) return match;
    if (page.pageNum * page.pageSize >= page.total) throw new SystemAccessError(404, '系统不存在');
    pageNum = page.pageNum + 1;
  }
}

export const createSystem = (data: CreateSystemInput) =>
  requestData<SystemInfo>({ url: '/api/systems', method: 'POST', data });
export const requestSystemJoin = (systemName: string) =>
  requestData<{ status: 'pending' }>({
    url: '/api/systems/join-requests',
    method: 'POST',
    data: { systemName },
  });

/** FTC 产品和架构目录分两步查询；空结果表示目录无匹配项。 */
export const loadFtcSubsystem = (systemName: string, signal?: AbortSignal) =>
  requestData<{ systemArchNo: string } | null>({
    url: '/api/systems/ftc-subsystem',
    params: { systemName },
    signal,
  });

export const loadSubsystemMetadata = (systemArchNo: string, signal?: AbortSignal) =>
  requestData<SubsystemMetadata | null>({
    url: '/api/systems/subsystem-metadata',
    params: { systemArchNo },
    signal,
  });

export const updateSystem = (systemName: string, data: UpdateSystemInput) =>
  requestData<SystemInfo>({ url: '/api/systems', method: 'PATCH', params: { systemName }, data });
