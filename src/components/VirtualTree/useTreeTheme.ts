import type { CSSProperties } from 'react';
import { theme } from 'antd';

// Share Ant Design's resolved palette with custom tree styles.
export function useTreeTheme(): CSSProperties {
  const { token } = theme.useToken();
  return {
    '--accent': token.colorPrimary,
    '--accent-hover': token.colorPrimaryHover,
    '--accent-border': token.colorPrimaryBorder,
    '--accent-bg': token.colorPrimaryBg,
    '--accent-bg-hover': token.colorPrimaryBgHover,
    '--accent-text': token.colorPrimaryText,
  } as CSSProperties;
}
