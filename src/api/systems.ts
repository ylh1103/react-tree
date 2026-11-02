/** 系统业务契约，列表、创建及授权都通过统一 HTTP 层调用。 */
import { requestData } from '@/http/request.ts';
import type {
  AllSystemInfo,
  CreateSystemInput,
  MySystemInfo,
  SystemInfo,
  SystemPage,
  SystemPageParams,
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
