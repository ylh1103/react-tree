/**
 * 用户设置读取与保存接口；每次响应都校验后才交给 Redux。
 * 请求超时保证首屏等待能结束；接口地址可由环境变量切换，保存传递完整设置。
 */
import { requestData } from '../http/request.ts';
import { parseUserSettings, type UserSettingsApi } from '../types/preferences.ts';

export function createUserSettingsApi(url: string, loadTimeoutMs = 10_000): UserSettingsApi {
  return {
    load: async (signal) =>
      parseUserSettings(await requestData({ url, signal, timeout: loadTimeoutMs })),
    save: async (settings, signal) =>
      parseUserSettings(await requestData({ url, method: 'PUT', data: settings, signal })),
  };
}

export const userSettingsApi = createUserSettingsApi(
  import.meta.env?.VITE_USER_SETTINGS_API_URL || '/mock-api/user-settings',
);
