import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import { themeBootstrapPlugin } from './build/theme-bootstrap-plugin.mjs';
import { loadingBootstrapPlugin } from './build/loading-bootstrap-plugin.mjs';

/**
 * 开发与构建共用首屏注入：loading 插件生成画面并处理 Vite 注入的样式链接。
 * theme 插件放在其后执行，再向头部前置配色脚本和 UTF-8 声明，确保字符集声明位于大段内联内容之前。
 */
export default defineConfig({
  plugins: [react(), UnoCSS(), loadingBootstrapPlugin(), themeBootstrapPlugin()],
  resolve: {
    // 与 TypeScript paths 保持一致，跨模块导入统一从 src 定位。
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'chrome86',
    cssTarget: 'chrome86',
  },
});
