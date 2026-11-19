/** 系统业务契约，列表、创建及授权都通过统一 HTTP 层调用。 */
import { requestData } from '@/http/request.ts';
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
export const loadSystems = (signal?: AbortSignal) =>
  requestData<AllSystemInfo[]>({ url: '/api/systems', signal });
export const loadMySystems = (signal?: AbortSignal) =>
  requestData<MySystemInfo[]>({ url: '/api/systems/mine', signal });
/** 分页目录与我的系统契约分开，避免首页为分页拉取整份系统清单。 */
export const loadSystemPage = (params: SystemPageParams, signal?: AbortSignal) =>
  requestData<SystemPage>({ url: '/api/systems/page', params, signal });
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
