/** 显示偏好的模拟文档，按登录用户隔离；编辑器 theme 与平台 themeMode 独立保存。 */
import { currentUserStorageKey } from '../utils/userStorage.ts';
import { readMock, writeMock } from './storage.ts';

/** 旧文档缺失的平台字段由接口解析时补默认值。 */
export function readMockSettings(key = currentUserStorageKey('display-settings')): string {
  return readMock(key, JSON.stringify({ theme: 'vs', defaultCheckAllEnvTag: true }));
}

/** 调用方完成格式校验后保存，未知字段仍保留在完整文档中。 */
export function saveMockSettings(
  userSetting: string,
  key = currentUserStorageKey('display-settings'),
) {
  writeMock(key, userSetting);
  return { userSetting };
}
