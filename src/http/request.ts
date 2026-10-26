/**
 * 统一 Axios 请求入口，业务调用方直接获得响应数据。
 * 统一 adapter 承接 Mock；透传调用方 signal，取消错误原样保留，HTTP 状态供调用方处理。
 */
import axios, { type AxiosRequestConfig } from 'axios';
import { mockAdapter } from '@/mocks/adapter.ts';

/** HTTP 状态保留给请求调用方及路由，不把 403 混同成普通网络失败。 */
export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.status = status;
  }
}
// 全局唯一客户端：业务 API 不选择运行环境或模拟实现。
export const httpClient = axios.create({
  timeout: 15_000,
  // 接入后端时改回 ['xhr', 'http']，API 和页面无需选择 Mock。
  adapter: mockAdapter,
  responseType: 'json',
  transitional: { silentJSONParsing: false },
});

/** 发起请求并返回响应体。204 可返回 undefined；取消请求仍抛 Axios 取消错误，调用方可区分取消与失败。 */
export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await httpClient.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    if (axios.isAxiosError(error)) {
      if (error.response && (error.response.status < 200 || error.response.status >= 300)) {
        const data = error.response.data as { message?: string } | undefined;
        throw new HttpError(
          error.response.status,
          data?.message ?? `请求失败（${error.response.status}）`,
          error,
        );
      }
      if (error.code === 'ERR_NETWORK') throw new Error('网络请求失败', { cause: error });
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('请求超时，请稍后重试', { cause: error });
      }
    }
    throw error;
  }
}
