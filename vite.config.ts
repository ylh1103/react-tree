import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import { bootstrapPlugin } from './build/bootstrap-plugin.mjs';
import { startupBudgetPlugin } from './build/startup-budget-plugin.mjs';
import { monacoLocalePlugin } from './build/monaco-locale-plugin.mjs';
import {
  reactBitsScopedCss,
  reactBitsUtilitiesPlugin,
} from './build/reactbits-template-plugin.mjs';

/**
 * 开发与构建共用一个首屏插件，由插件内部统一安排字符集、主题、加载画面和样式交接顺序。
 */
export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    bootstrapPlugin(),
    startupBudgetPlugin(),
    monacoLocalePlugin(),
    reactBitsUtilitiesPlugin(),
    // 只在落地页加载核心功能样式，同时复用平台主题和图标定义。
    reactBitsUtilitiesPlugin({
      publicId: 'virtual:landing-core-features-utilities.css',
      sourceDirectory: fileURLToPath(
        new URL('./src/pages/Landing/components/LandingCoreFeatures/', import.meta.url),
      ),
      selector: '#core-features',
      useProjectConfig: true,
    }),
    reactBitsUtilitiesPlugin({
      publicId: 'virtual:features-13-utilities.css',
      sourceDirectory: fileURLToPath(
        new URL('./src/pages/Landing/components/LandingRiskFeatures/', import.meta.url),
      ),
      selector: '#features',
    }),
    reactBitsUtilitiesPlugin({
      publicId: 'virtual:how-it-works-9-utilities.css',
      sourceDirectory: fileURLToPath(
        new URL('./src/pages/Landing/components/LandingReleaseFlow/', import.meta.url),
      ),
      selector: '#how-it-works',
    }),
    reactBitsUtilitiesPlugin({
      publicId: 'virtual:stats-4-utilities.css',
      sourceDirectory: fileURLToPath(
        new URL('./src/pages/Landing/components/LandingAdoptionStats/', import.meta.url),
      ),
      selector: '#landing-adoption',
    }),
    reactBitsUtilitiesPlugin({
      publicId: 'virtual:faq-6-utilities.css',
      sourceDirectory: fileURLToPath(
        new URL('./src/pages/Landing/components/LandingFaq/', import.meta.url),
      ),
      selector: '#faq',
    }),
  ],
  // 预打包会绕过模块级语言适配；保留 ESM 图，让开发模式与生产构建使用相同翻译。
  // 官方站是独立应用，主项目只扫描自己的 HTML 入口，避免遍历 vendor 中的整站文档。
  optimizeDeps: { entries: ['index.html'], exclude: ['monaco-editor'] },
  server: { watch: { ignored: ['**/vendor/react-bits/**'] } },
  css: { postcss: { plugins: reactBitsScopedCss() } },
  worker: { plugins: () => [monacoLocalePlugin()] },
  resolve: {
    // 与 TypeScript paths 保持一致，跨模块导入统一从 src 定位。
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'chrome86',
    cssTarget: 'chrome86',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              // 保持原本同包的 React 与 JSX 运行时，避免新增动态页面造成共享运行时碎片。
              name: 'react-runtime',
              test: /node_modules[\\/]react[\\/]/,
            },
          ],
        },
      },
    },
  },
});
