/** 用户设置使用完整 JSON 契约，读写始终保留非布局字段。 */
import { requestData } from '../http/request.ts';
import type { UserSettingsApi } from '../types/preferences.ts';
import { parseSettingsDocument, settingsFromDocument } from '../types/userSettings.ts';
export function createUserSettingsApi(url: string, loadTimeoutMs = 10_000): UserSettingsApi {
  return {
    load: async (signal) => {
      const { userSetting } = await requestData<{ userSetting: string }>({
        url,
        signal,
        timeout: loadTimeoutMs,
      });
      return { ...settingsFromDocument(userSetting), document: userSetting };
    },
    save: async (settings, signal) => {
      const current = await requestData<{ userSetting: string }>({ url, signal });
      const userSetting = JSON.stringify({
        ...parseSettingsDocument(current.userSetting),
        ...settings,
      });
      const saved = (
        await requestData<{ userSetting: string }>({
          url,
          method: 'PUT',
          data: { userSetting },
          signal,
        })
      ).userSetting;
      return { ...settingsFromDocument(saved), document: saved };
    },
  };
}
export const userSettingsApi = createUserSettingsApi('/api/user-settings');
