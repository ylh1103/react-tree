import axios, { type AxiosRequestConfig } from 'axios';

// 浏览器使用 XHR，兼容 Mock.js；Node 测试使用 HTTP 适配器。
const client = axios.create({
  adapter: ['xhr', 'http'],
  responseType: 'json',
  transitional: { silentJSONParsing: false },
});

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
    }
    throw error;
  }
}
