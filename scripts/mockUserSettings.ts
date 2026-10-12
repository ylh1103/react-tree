import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import {
  parseUserSettings,
  defaultUserSettings,
  type UserSettings,
} from '../src/features/preferences/types.ts';

/** 服务端内存模拟当前用户的配置；刷新页面保留，重启服务重置。 */
export function createMockUserSettingsMiddleware(delayMs = 350) {
  let settings: UserSettings = { ...defaultUserSettings };
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (new URL(request.url || '/', 'http://localhost').pathname !== '/mock-api/user-settings') {
      next();
      return;
    }
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    const send = (status: number, body: unknown) => {
      response.statusCode = status;
      response.end(JSON.stringify(body));
    };
    if (request.method !== 'GET' && request.method !== 'PUT') {
      response.setHeader('Allow', 'GET, PUT');
      send(405, { error: '不支持的请求方法' });
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const failure = request.headers['x-mock-error'];
    if (
      (request.method === 'GET' && failure === 'load') ||
      (request.method === 'PUT' && failure === 'save')
    ) {
      send(503, { error: '模拟用户设置服务暂时不可用' });
      return;
    }
    if (request.method === 'GET') {
      send(200, settings);
      return;
    }
    try {
      let body = '';
      for await (const chunk of request) body += chunk;
      const nextSettings = parseUserSettings(JSON.parse(body));
      settings = nextSettings;
      send(200, settings);
    } catch {
      send(400, { error: '用户设置格式错误：布局、主题或图标显示选项无效' });
    }
  };
}

export default function mockUserSettings(): Plugin {
  const middleware = createMockUserSettingsMiddleware();
  return {
    name: 'mock-user-settings',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
