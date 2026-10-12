import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import mockUserSettings from './scripts/mockUserSettings.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), UnoCSS(), mockUserSettings()],
  build: {
    target: 'chrome86',
    cssTarget: 'chrome86',
  },
});
