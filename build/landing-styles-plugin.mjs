/**
 * Landing 的 UnoCSS 按路由生成：沿用项目配置，隔离选择器并由 Vite 随页面加载。
 * 全局模式会把页面 CSS 加入后台启动包；多个 per-module 样式表会改变共享工具类的级联顺序。
 * 此处只处理这个页面，不修改其他页面提取与启动预算，也不维护手写样式表。
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { createGenerator } from 'unocss';
import unoConfig from '../uno.config.ts';
const directory = fileURLToPath(new URL('../src/pages/Landing/', import.meta.url));
const publicId = 'virtual:landing.css';
const internalId = `\0${publicId}`;
export function landingStylesPlugin() {
  return {
    name: 'landing-uno-styles',
    resolveId(id) {
      if (id === publicId) return internalId;
    },
    async load(id) {
      if (id !== internalId) return;
      const files = (await readdir(directory, { recursive: true }))
        .filter((file) => /\.tsx?$/.test(file))
        .sort();
      const sources = await Promise.all(
        files.map(async (file) => {
          const path = resolve(directory, file);
          this.addWatchFile(path);
          return readFile(path, 'utf8');
        }),
      );
      const generator = await createGenerator(unoConfig);
      return (
        await generator.generate(sources.join('\n'), {
          preflights: false,
          scope: '[data-landing-theme]',
        })
      ).css;
    },
    handleHotUpdate({ file, server, modules }) {
      if (!file.startsWith(directory) && !file.endsWith('/uno.config.ts')) return;
      const module = server.moduleGraph.getModuleById(internalId);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        return [...modules, module];
      }
    },
  };
}
