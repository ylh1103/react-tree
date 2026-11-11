/** 官方模板 CSS 作用域与局部 UnoCSS。 */
import type { CSSOptions, Plugin } from 'vite';
type InlinePostcss = Exclude<NonNullable<CSSOptions['postcss']>, string>;
export function reactBitsScopedCss(): NonNullable<InlinePostcss['plugins']>;
export function reactBitsUtilitiesPlugin(options?: {
  publicId?: string;
  sourceDirectory?: string;
  selector?: string;
  useProjectConfig?: boolean;
}): Plugin;
