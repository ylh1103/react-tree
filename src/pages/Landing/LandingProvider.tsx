/** 落地页继承用户主题，提供页面根节点和导航所需透明色，不覆盖全局语义变量。 */
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Alert, theme as antdTheme } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { saveThemeMode } from '@/store/slices/preferencesSlice';
import type { ResolvedThemeMode } from '@/types/preferences';
import { useLandingScrollRestoration } from './hooks/useLandingScrollRestoration';
import { LandingContext } from './model/landingContext';
import { withAlpha } from './model/themeColors';

const darkPreviewFrameChannel = 0x16;
// 首屏原有的圆点是 10% 白色叠在预览栏上。合成实色后，轮播换背景也能显示同样的灰色。
const darkPreviewDotChannel = Math.round(
  darkPreviewFrameChannel + (255 - darkPreviewFrameChannel) * 0.1,
);

export default function LandingProvider({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useLandingScrollRestoration();
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
    void dispatch(saveThemeMode(next));
  }
  const variables = {
    '--landing-background': light ? '#fff' : 'var(--color-surface)',
    '--landing-hero-background': light ? '#fff' : 'var(--color-canvas)',
    '--landing-preview-frame': light
      ? 'var(--color-canvas)'
      : `rgb(${darkPreviewFrameChannel} ${darkPreviewFrameChannel} ${darkPreviewFrameChannel})`,
    '--landing-preview-content': light ? '#fff' : '#080808',
    '--landing-preview-dot': light
      ? 'var(--color-border)'
      : `rgb(${darkPreviewDotChannel} ${darkPreviewDotChannel} ${darkPreviewDotChannel})`,
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
        className="relative min-h-svh overflow-x-clip bg-[var(--landing-background)] text-text [&_a]:no-underline [font-family:Inter,'PingFang_SC','Microsoft_YaHei',sans-serif]"
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
