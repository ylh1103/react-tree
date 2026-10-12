import { requestData } from '../../lib/http.ts';
import { parseUserSettings, type UserSettingsApi } from './types.ts';

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
