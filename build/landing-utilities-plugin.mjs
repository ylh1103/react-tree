/** 为落地页模块按需生成局部 UnoCSS，避免将它们的工具类加入后台首屏样式。 */
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGenerator, presetWind3 } from 'unocss';
import unoConfig from '../uno.config.ts';

export function landingUtilitiesPlugin({
  publicId,
  sourceDirectory,
  selector,
  useProjectConfig = false,
}) {
  const internalId = `\0${publicId}`;
  return {
    name: 'landing-utilities',
    resolveId(id) {
      if (id === publicId) return internalId;
    },
    async load(id) {
      if (id !== internalId) return;
      const files = (await readdir(sourceDirectory, { recursive: true })).filter((file) =>
        /\.[jt]sx?$/.test(file),
      );
      const sources = await Promise.all(
        files.map(async (file) => {
          const path = resolve(sourceDirectory, file);
          this.addWatchFile(path);
          return readFile(path, 'utf8');
        }),
      );
      const wind3 = presetWind3();
      // 平台主题只定义了自有断点，局部样式仍需保留落地页使用的 Wind3 断点。
      const generator = await createGenerator(
        useProjectConfig
          ? {
              ...unoConfig,
              theme: {
                ...unoConfig.theme,
                breakpoints: { ...wind3.theme?.breakpoints, ...unoConfig.theme?.breakpoints },
              },
            }
          : { presets: [wind3] },
      );
      return (await generator.generate(sources.join('\n'), { preflights: false, scope: selector }))
        .css;
    },
    handleHotUpdate({ file, server, modules }) {
      if (!file.startsWith(sourceDirectory)) return;
      const module = server.moduleGraph.getModuleById(internalId);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        return [...modules, module];
      }
    },
  };
}
