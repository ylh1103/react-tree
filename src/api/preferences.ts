/**
 * 用户设置 HTTP 边界：GET/PUT 交换完整 userSetting JSON 字符串，向状态机返回解析后的显示配置。
 * API 不决定 Mock 或 Redux 行为；请求 signal 贯穿保存前读取和实际 PUT，支持整体取消。
 */
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
      return settingsFromDocument(userSetting);
    },
    save: async (settings, signal) => {
      // 保存前重新读取完整文档，再覆盖本项目负责的字段，保留编辑器 theme、defaultCheckAllEnvTag
      // 和未知字段。解析失败直接终止，绝不能用默认配置覆盖损坏的服务端 JSON。
      // 这是读后合并，并非跨页签原子更新；本页签的请求顺序由 Slice 的保存队列保证。
      const current = await requestData<{ userSetting: string }>({
        url,
        signal,
      });
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
      // 以服务端实际返回值作为确认基线，只将平台字段交给状态机。
      return settingsFromDocument(saved);
    },
  };
}
export const userSettingsApi = createUserSettingsApi('/api/user-settings');
