/** 落地页继承用户主题，只提供滚动容器和导航所需透明色，不覆盖全局语义变量。 */
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Alert, theme as antdTheme } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { saveUserSettings } from '@/store/slices/preferencesSlice';
import type { ResolvedThemeMode } from '@/types/preferences';
import { LandingContext } from './model/landingContext';
import { withAlpha } from './model/themeColors';

export default function LandingProvider({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const mode = useAppSelector((state) => state.preferences.themeMode);
  const status = useAppSelector((state) => state.preferences.status);
  const saveError = useAppSelector((state) =>
    state.preferences.status === 'save-error' ? state.preferences.error : null,
  );
  const resolvedTheme = useResolvedTheme(mode);
  const dispatch = useAppDispatch();
  const { token } = antdTheme.useToken();
  const light = resolvedTheme === 'light';
  const canChangeTheme = ['ready', 'saving', 'save-error'].includes(status);
  function setTheme(next: ResolvedThemeMode) {
    // 仅用户点击时提交，复用现有并发、未知字段保留及失败回退逻辑。
    void dispatch(saveUserSettings({ themeMode: next }));
  }
  const variables = {
    '--landing-background': light ? '#fff' : 'var(--color-surface)',
    '--landing-hero-background': light ? '#fff' : 'var(--color-canvas)',
    '--landing-risk-preview-bg': light ? 'var(--color-canvas)' : withAlpha(token.colorText, 0.035),
    '--landing-accent': 'var(--color-accent)',
    '--landing-ghost': 'var(--color-surface)',
    '--landing-ghost-hover': 'var(--color-hover)',
    '--landing-glass-border': withAlpha(token.colorText, light ? 0.09 : 0.04),
    '--landing-glass': withAlpha(token.colorBgContainer, light ? 0.76 : 0.45),
    '--landing-menu': withAlpha(token.colorBgElevated, light ? 0.94 : 0.85),
    '--landing-shadow': light ? 'none' : token.boxShadowSecondary,
    '--landing-menu-shadow': token.boxShadowSecondary,
  } as CSSProperties;
  return (
    <LandingContext
      value={{
        theme: resolvedTheme,
        setTheme,
        canChangeTheme,
        root,
        particleColors: { base: token.colorBgLayout, accent: token.colorPrimary },
      }}
    >
      <div
        id="landing-top"
        data-landing
        data-theme={resolvedTheme}
        ref={root}
        style={variables}
        lang="zh-CN"
        className="relative h-full overflow-x-hidden overflow-y-auto bg-[var(--landing-background)] text-text [&_a]:no-underline [font-family:Inter,'PingFang_SC','Microsoft_YaHei',sans-serif]"
      >
        <a
          href="#landing-main"
          className="absolute -top-100px left-6 z-2000 rounded-2 bg-surface p-3 text-text layout-focus focus:top-4"
        >
          跳转到主要内容
        </a>
        {saveError && (
          <Alert
            type="error"
            showIcon
            title={saveError}
            className="fixed bottom-4 left-1/2 z-2000 w-max max-w-[calc(100%-32px)] -translate-x-1/2"
          />
        )}
        {children}
      </div>
    </LandingContext>
  );
}
