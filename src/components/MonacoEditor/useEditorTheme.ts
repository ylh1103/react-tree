/** 编辑器优先使用调用方主题，其次用户偏好；platform 跟随平台实际配色，不改写历史 theme。 */
import { useAppSelector } from '@/store/hooks';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { platformEditorThemes } from './themeCatalog';

export function useEditorTheme(theme?: string) {
  const preference = useAppSelector((state) => state.preferences.editor.theme);
  const mode = useAppSelector((state) => state.preferences.themeMode);
  const resolvedTheme = useResolvedTheme(mode);
  // Monaco 的主题是共享实例的全局状态，同屏编辑器应传入一致的主题。
  return theme ?? (preference === 'platform' ? platformEditorThemes[resolvedTheme] : preference);
}
