/** 平台主题的持久化格式；旧值仍表示平台默认配色，新增配色通过“配色:模式”保存。 */
import { shadcnPalettes, type ShadcnPaletteId } from '../styles/shadcnPalettes.ts';

export type ResolvedThemeMode = 'light' | 'dark';
export type AppearanceMode = ResolvedThemeMode | 'system';
export type ThemePaletteId = 'platform' | ShadcnPaletteId;
export type ThemeMode = AppearanceMode | `${ShadcnPaletteId}:${AppearanceMode}`;

export const shadcnPaletteIds = Object.keys(shadcnPalettes) as ShadcnPaletteId[];

/** HTML 启动脚本复用此校验，显式传入白名单以便函数序列化后独立运行。 */
export function isThemeMode(value: unknown, paletteIds: readonly string[]): value is ThemeMode {
  if (typeof value !== 'string') return false;
  const [first, second, extra] = value.split(':');
  if (extra !== undefined || (second !== undefined && !paletteIds.includes(first))) return false;
  const appearance = second ?? first;
  return appearance === 'light' || appearance === 'dark' || appearance === 'system';
}

export function splitThemeMode(value: ThemeMode): [ThemePaletteId, AppearanceMode] {
  const [palette, appearance] = value.split(':');
  return appearance
    ? [palette as ShadcnPaletteId, appearance as AppearanceMode]
    : ['platform', value as AppearanceMode];
}

export function createThemeMode(palette: ThemePaletteId, appearance: AppearanceMode): ThemeMode {
  return palette === 'platform' ? appearance : `${palette}:${appearance}`;
}
