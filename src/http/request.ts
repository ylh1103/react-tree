/**
 * 统一 Axios 请求入口，业务调用方直接获得响应数据。
 * 浏览器优先使用 XHR 以兼容 Mock.js；取消错误原样保留，HTTP、网络和超时错误转换为可展示的信息。
 */
import axios, { type AxiosRequestConfig } from 'axios';

// 浏览器使用 XHR，兼容 Mock.js；Node 测试使用 HTTP 适配器。
const client = axios.create({
  timeout: 15_000,
  adapter: ['xhr', 'http'],
  responseType: 'json',
  transitional: { silentJSONParsing: false },
});

/** 发起请求并返回响应体。204 可返回 undefined；取消请求仍抛 Axios 取消错误，调用方可区分取消与失败。 */
export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await client.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    if (axios.isAxiosError(error)) {
      if (error.response && (error.response.status < 200 || error.response.status >= 300)) {
        throw new Error(`请求失败（${error.response.status}）`, { cause: error });
      }
      if (error.code === 'ERR_NETWORK') throw new Error('网络请求失败', { cause: error });
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('请求超时，请稍后重试', { cause: error });
      }
    }
    throw error;
  }
}
