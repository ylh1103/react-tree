/** 系统业务契约，列表、创建及授权都通过统一 HTTP 层调用。 */
import { requestData } from '../http/request.ts';
import type { CreateSystemInput, SystemInfo } from '../types/systems.ts';
export const loadSystems = (signal?: AbortSignal) =>
  requestData<SystemInfo[]>({ url: '/api/systems', signal });
export const loadSystemAccess = (name: string, signal?: AbortSignal) =>
  requestData<SystemInfo>({ url: `/api/systems/${encodeURIComponent(name)}/access`, signal });
export const createSystem = (data: CreateSystemInput) =>
  requestData<SystemInfo>({ url: '/api/systems', method: 'POST', data });
