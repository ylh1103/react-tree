import { defineConfig, presetWind3, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons({
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then((i) => i.default),
      },
      extraProperties: {
        display: 'inline-block',
      },
    }),
  ],
});
