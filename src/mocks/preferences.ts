/** 显示偏好的模拟文档，按登录用户隔离；编辑器 theme 与平台 themeMode 独立保存。 */
import { readMock, writeMock } from './storage.ts';

/** 旧文档缺失的平台字段由接口解析时补默认值。 */
export function readMockSettings(ystId: string): string {
  return readMock(settingsKey(ystId), JSON.stringify({ theme: 'vs', defaultCheckAllEnvTag: true }));
}

/** 调用方完成格式校验后保存，未知字段仍保留在完整文档中。 */
export function saveMockSettings(ystId: string, userSetting: string) {
  writeMock(settingsKey(ystId), userSetting);
  return { userSetting };
}

/** 沿用已有的个人 Mock 存储键，登录后可以直接读取存量配置。 */
function settingsKey(ystId: string) {
  return `display-settings:user:${encodeURIComponent(ystId)}`;
}
