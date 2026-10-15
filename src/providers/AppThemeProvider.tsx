/**
 * 把用户主题选择转换为 Ant Design 主题，并同步根节点 CSS 变量。
 * 跟随系统时订阅外观变化；组件、弹层和 UnoCSS 使用同一份主题值。
 */
import { ConfigProvider } from 'antd';
import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { createAppTheme, applyTheme } from '../styles/theme';
import { BrandLoading } from '../components/BrandLoading';

const spinConfig = { indicator: <BrandLoading /> };

/** 包含路由首屏、配置加载骨架和正式页面的统一主题入口。 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppSelector((state) => state.preferences.themeMode);
  const resolvedTheme = useResolvedTheme(mode);
  // 预览值优先于已提交值，让拖动即时反馈；取消预览后自然恢复当前配置，无需额外 Effect 同步。
  const borderRadius = useAppSelector(
    (state) => state.preferences.previewBorderRadius ?? state.preferences.borderRadius,
  );
  const controlBorderRadius = useAppSelector(
    (state) =>
      state.preferences.previewControlBorderRadius ?? state.preferences.controlBorderRadius,
  );
  const appTheme = useMemo(
    () => createAppTheme(resolvedTheme, controlBorderRadius),
    [resolvedTheme, controlBorderRadius],
  );
  // Ant Design 通过 ConfigProvider 接收 token；UnoCSS 及 body 弹层读取根节点 CSS 变量。
  // 在浏览器绘制前同步变量，避免同一帧出现组件与页面主题不一致。
  useLayoutEffect(() => {
    applyTheme(resolvedTheme, borderRadius, controlBorderRadius);
  }, [resolvedTheme, borderRadius, controlBorderRadius]);
  return (
    <ConfigProvider theme={appTheme} spin={spinConfig}>
      {children}
    </ConfigProvider>
  );
}
