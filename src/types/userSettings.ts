/** 完整配置文档独立于布局字段，保证未知字段和编辑器主题不丢失。 */
import { defaultUserSettings, parseUserSettings } from './preferences.ts';
/** 仅接受 JSON 对象；保留全部字段，损坏数据及数组必须抛错，交给调用方展示读取错误。 */
export function parseSettingsDocument(raw: string): Record<string, unknown> {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('用户设置 JSON 无效');
  return value as Record<string, unknown>;
}
/**
 * 从完整文档提取平台配置：旧用户可能只有编辑器字段，先补默认项再校验。
 * 服务端已提供的值优先；非法值仍报错。返回的是显示配置，不可用它替代完整文档。
 */
export function settingsFromDocument(raw: string) {
  return parseUserSettings({ ...defaultUserSettings, ...parseSettingsDocument(raw) });
}
