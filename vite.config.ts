import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import { themeBootstrapPlugin } from './build/theme-bootstrap-plugin.mjs';

/** 构建与开发共用插件；首屏主题必须随 HTML 返回，不等待外部脚本和样式。 */
export default defineConfig({
  plugins: [react(), UnoCSS(), themeBootstrapPlugin()],
  build: {
    target: 'chrome86',
    cssTarget: 'chrome86',
  },
});
