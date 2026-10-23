import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import { bootstrapPlugin } from './build/bootstrap-plugin.mjs';
import { startupBudgetPlugin } from './build/startup-budget-plugin.mjs';

/**
 * 开发与构建共用一个首屏插件，由插件内部统一安排字符集、主题、加载画面和样式交接顺序。
 */
export default defineConfig({
  plugins: [react(), UnoCSS(), bootstrapPlugin(), startupBudgetPlugin()],
  resolve: {
    // 与 TypeScript paths 保持一致，跨模块导入统一从 src 定位。
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'chrome86',
    cssTarget: 'chrome86',
  },
});
