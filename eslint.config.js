import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'dist-ssr', 'coverage', 'output', '.pnpm-store', 'vendor/react-bits']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: { globals: globals.browser },
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite(),
    ],
    settings: { react: { version: 'detect' } },
  },
  {
    // 插件由 Node 加载，但其中的启动函数会序列化到 HTML 并在浏览器执行，因此允许使用浏览器全局对象。
    files: ['build/bootstrap-plugin.mjs'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['build/reactbits-template-plugin.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // 官方提供的首页是 JavaScript 源码；不为模板额外引入运行时 PropTypes。
    files: ['src/pages/ReactBits/template/**/*.jsx'],
    rules: { 'react/prop-types': 'off' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    // TypeScript handles props validation for TypeScript components.
    rules: { 'react/prop-types': 'off' },
  },
  {
    files: ['*.config.{js,mjs,cjs,ts,mts,cts}', 'scripts/**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.node },
  },
  // Keep last: disable formatting rules that conflict with Prettier.
  prettier,
]);
