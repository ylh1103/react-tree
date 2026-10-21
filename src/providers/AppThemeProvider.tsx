/**
 * React 运行期间的主题入口：把 Redux 中的用户选择解析为实际配色，统一驱动 Ant Design 和 CSS 变量。
 * HTML 首屏脚本只提前设置画布与文字颜色；此处在首次提交时补齐完整变量，随后响应配置和系统外观变化。
 * 只负责显示同步，主题保存和失败回退由偏好状态机处理，启动缓存由入口订阅维护。
 */
import { ConfigProvider } from 'antd';
import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { createAppTheme, applyTheme } from '../styles/theme';
import { UserLoadingIndicator } from '../components/LoadingIndicator';

const spinConfig = { indicator: <UserLoadingIndicator /> };
// 全局文字提示默认隐藏箭头；个别 Tooltip 可通过自身 arrow 属性覆盖。
const tooltipConfig = { arrow: false };

/** 包住路由加载骨架与正式页面，使加载等待、导航和设置切换使用同一套主题。 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppSelector((state) => state.preferences.themeMode);
  // system 仅在显示时解析为 light/dark，不能把解析结果写回 Redux，否则会丢失跟随系统的选择。
  const resolvedTheme = useResolvedTheme(mode);
  // 两类圆角独立：面板圆角只影响 CSS 变量，控件圆角还参与 Ant Design token 计算。
  // 优先读取滑块预览值；预览清空后直接回到已提交值，不另建一份派生状态。
  const borderRadius = useAppSelector(
    (state) => state.preferences.previewBorderRadius ?? state.preferences.borderRadius,
  );
  const controlBorderRadius = useAppSelector(
    (state) =>
      state.preferences.previewControlBorderRadius ?? state.preferences.controlBorderRadius,
  );
  // 配置对象保持稳定，避免面板圆角预览等无关更新反复触发 Ant Design 主题计算与样式生成。
  const appTheme = useMemo(
    () => createAppTheme(resolvedTheme, controlBorderRadius),
    [resolvedTheme, controlBorderRadius],
  );
  // 根节点样式属于外部 DOM 同步，放在提交阶段而非渲染期间。
  // useLayoutEffect 在此次提交后的绘制前补齐变量，避免骨架或页面先使用缺失的颜色、圆角。
  // 组件经 ConfigProvider 使用 token，UnoCSS 和挂载到 body 的弹层经根节点变量使用相同配色。
  useLayoutEffect(() => {
    applyTheme(resolvedTheme, borderRadius, controlBorderRadius);
  }, [resolvedTheme, borderRadius, controlBorderRadius]);
  return (
    <ConfigProvider theme={appTheme} spin={spinConfig} tooltip={tooltipConfig}>
      {children}
    </ConfigProvider>
  );
}
