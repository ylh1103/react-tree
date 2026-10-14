/** 完整配置文档独立于布局字段，保证未知字段和编辑器主题不丢失。 */
import { defaultUserSettings, parseUserSettings } from './preferences.ts';
export function parseSettingsDocument(raw: string): Record<string, unknown> {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('用户设置 JSON 无效');
  return value as Record<string, unknown>;
}
export function settingsFromDocument(raw: string) {
  return parseUserSettings({ ...defaultUserSettings, ...parseSettingsDocument(raw) });
}
