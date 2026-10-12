import { ConfigProvider } from 'antd';
import { useLayoutEffect, type ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';
import { useResolvedTheme } from '../features/preferences/useResolvedTheme';
import { appThemes, applyTheme } from '../styles/theme';

/** 包含路由首屏、配置加载骨架和正式页面的统一主题入口。 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppSelector((state) => state.preferences.themeMode);
  const resolvedTheme = useResolvedTheme(mode);
  useLayoutEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);
  return <ConfigProvider theme={appThemes[resolvedTheme]}>{children}</ConfigProvider>;
}
