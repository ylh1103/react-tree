/** 显示偏好的模拟文档，不绑定身份；编辑器 theme 与平台 themeMode 独立保存。 */
import { readMock, writeMock } from './storage.ts';

/** 旧文档缺失的平台字段由接口解析时补默认值。 */
export function readMockSettings(): string {
  return readMock('display-settings', JSON.stringify({ theme: 'vs', defaultCheckAllEnvTag: true }));
}

/** 调用方完成格式校验后保存，未知字段仍保留在完整文档中。 */
export function saveMockSettings(userSetting: string) {
  writeMock('display-settings', userSetting);
  return { userSetting };
}
