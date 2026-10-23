/** 唯一模拟接入点：业务 API 保持正常 Axios 契约，模块按请求类别加载。 */
import axios, { AxiosError, CanceledError, type AxiosAdapter, type AxiosResponse } from 'axios';
import { mockConfig } from './config.ts';

export const mockAdapter: AxiosAdapter = async (config) => {
  // 显式绝对 URL 用于真实 HTTP 契约测试；模拟 API 只承接本项目相对地址。
  if (/^https?:\/\//.test(config.url!)) return axios.getAdapter(['xhr', 'http'])(config);
  await new Promise<void>((resolve, reject) => {
    if (config.signal?.aborted) {
      reject(new CanceledError());
      return;
    }
    const cleanup = () => {
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
      config.signal?.removeEventListener?.('abort', abort);
    };
    const abort = () => {
      cleanup();
      reject(new CanceledError());
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, mockConfig.delayMs);
    const timeoutTimer = config.timeout
      ? setTimeout(() => {
          cleanup();
          reject(new AxiosError('模拟请求超时', 'ECONNABORTED', config));
        }, config.timeout)
      : undefined;
    config.signal?.addEventListener?.('abort', abort, { once: true });
  });
  const url = new URL(config.url!, 'http://mock.local');
  const method = config.method?.toUpperCase() ?? 'GET';
  const response = (data: unknown, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  });
  const fail = (status: number, message: string): never => {
    throw new AxiosError(
      message,
      'ERR_BAD_RESPONSE',
      config,
      undefined,
      response({ message }, status),
    );
  };
  let body: Record<string, string> | undefined;
  try {
    body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  } catch {
    return fail(400, '请求 JSON 无效');
  }
  if (config.signal?.aborted) throw new CanceledError();
  if (url.pathname === '/api/user-settings') {
    const { readMockSettings, saveMockSettings } = await import('./preferences.ts');
    const failure = config.headers.get('X-Mock-Error');
    if ((method === 'GET' && failure === 'load') || (method === 'PUT' && failure === 'save'))
      fail(503, '模拟设置服务暂时不可用');
    if (method === 'GET') return response({ userSetting: readMockSettings() });
    if (method === 'PUT') {
      const { settingsFromDocument } = await import('@/types/userSettings.ts');
      if (config.signal?.aborted) throw new CanceledError();
      try {
        settingsFromDocument(body?.userSetting ?? '');
        return response(saveMockSettings(body?.userSetting ?? ''));
      } catch {
        return fail(400, '用户设置格式错误');
      }
    }
    return fail(405, '不支持的请求方法');
  }
  const { allSystems, createSystem, accessSystem } = await import('./systemService.ts');
  if (config.signal?.aborted) throw new CanceledError();
  if (url.pathname === '/api/systems') {
    if (method === 'GET') return response(allSystems());
    if (method === 'POST')
      return response(
        createSystem(body as unknown as import('@/types/systems').CreateSystemInput, fail),
        201,
      );
  }
  const access = /^\/api\/systems\/(.+)\/access$/.exec(url.pathname);
  if (access && method === 'GET')
    return response(accessSystem(decodeURIComponent(access[1]), fail));
  const systemName = config.params?.systemName ?? url.searchParams.get('systemName');
  if (
    systemName &&
    ['/api/applications', '/api/applications/groups', '/api/parameters'].includes(url.pathname)
  ) {
    const system = accessSystem(systemName, fail);
    if (url.pathname === '/api/parameters' && method === 'GET') {
      const { createMockParameters } = await import('./parameters.ts');
      return response(
        system.paramTypeCount ? createMockParameters().slice(0, system.paramTypeCount) : [],
      );
    }
    if (url.pathname === '/api/applications' && method === 'GET') {
      const { createMockApplications } = await import('./applications.ts');
      return response(createMockApplications(system.appCount));
    }
    if (url.pathname === '/api/applications/groups') {
      const { readMock, writeMock } = await import('./storage.ts');
      if (config.signal?.aborted) throw new CanceledError();
      if (method === 'GET')
        return response({ appGroupInfo: readMock(`groups:${systemName}`, null) });
      if (method === 'PUT') {
        writeMock(`groups:${systemName}`, body?.appGroupInfo ?? null);
        return response(undefined, 204);
      }
    }
    if (method === 'DELETE') fail(501, '应用删除接口尚未接入');
  }
  return fail(404, '模拟接口不存在');
};
