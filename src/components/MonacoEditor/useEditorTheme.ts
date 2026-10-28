/** 编辑器默认跟随平台实际配色；显式 theme 只覆盖显示，不读写旧 userSetting.theme。 */
import { useAppSelector } from '@/store/hooks';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';

export function useEditorTheme(theme?: string) {
  const mode = useAppSelector((state) => state.preferences.themeMode);
  const resolvedTheme = useResolvedTheme(mode);
  // Monaco 的主题是共享实例的全局状态，同屏编辑器应传入一致的主题。
  return theme ?? (resolvedTheme === 'dark' ? 'vs-dark' : 'vs');
}
