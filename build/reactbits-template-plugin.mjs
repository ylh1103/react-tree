/**
 * 保留官方模板 CSS，仅在构建时限制选择器和关键帧作用域；原始工具类由局部 UnoCSS 生成。
 * CSS @scope 不覆盖项目的 Chrome 86 目标；Shadow DOM 会改变原组件的弹层和主题行为。
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createGenerator, presetWind3 } from 'unocss';
import prefixSelector from 'postcss-prefix-selector';

const directory = fileURLToPath(new URL('../src/pages/ReactBits/', import.meta.url));
const sourcePattern = /[\\/]pages[\\/]ReactBits[\\/]template[\\/]/;
const scope = '[data-reactbits-template]';

export function reactBitsScopedCss() {
  return [
    prefixSelector({
      prefix: scope,
      includeFiles: [sourcePattern],
      transform(prefix, selector, prefixed) {
        if (/^(?:html|body|:root|#root)(?=[\s.#[:]|$)/.test(selector)) {
          return selector.replace(/^(?:html\s+body|:root\s+body|html|body|:root|#root)/, prefix);
        }
        return prefixed;
      },
    }),
    {
      postcssPlugin: 'reactbits-template-keyframes',
      Once(root) {
        if (!sourcePattern.test(root.source?.input.file || '')) return;
        const names = new Map();
        root.walkAtRules(/keyframes$/, (rule) => {
          const original = rule.params;
          names.set(original, `rb-template-${original}`);
          rule.params = names.get(original);
        });
        root.walkDecls(/^(?:-webkit-)?animation(?:-name)?$/, (declaration) => {
          declaration.value = declaration.value.replace(
            /[\w-]+/g,
            (token) => names.get(token) || token,
          );
        });
      },
    },
  ];
}

export function reactBitsUtilitiesPlugin() {
  const publicId = 'virtual:reactbits-utilities.css';
  const internalId = `\0${publicId}`;
  return {
    name: 'reactbits-template-utilities',
    resolveId(id) {
      if (id === publicId) return internalId;
    },
    async load(id) {
      if (id !== internalId) return;
      const files = (await readdir(directory, { recursive: true })).filter((file) =>
        /\.[jt]sx?$/.test(file),
      );
      const sources = await Promise.all(
        files.map(async (file) => {
          const path = resolve(directory, file);
          this.addWatchFile(path);
          return readFile(path, 'utf8');
        }),
      );
      const generator = await createGenerator({ presets: [presetWind3()] });
      return (await generator.generate(sources.join('\n'), { preflights: false, scope })).css;
    },
    handleHotUpdate({ file, server, modules }) {
      if (!file.startsWith(directory)) return;
      const module = server.moduleGraph.getModuleById(internalId);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        return [...modules, module];
      }
    },
  };
}
