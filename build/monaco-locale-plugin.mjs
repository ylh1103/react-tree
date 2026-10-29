/** 为 Monaco 0.47 的 ESM 模块接入 npm 包内同版本中文翻译，开发、生产与 Worker 共用。 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const monacoRoot = dirname(require.resolve('monaco-editor/package.json'));
const nlsPath = join(monacoRoot, 'esm/vs/nls.js').replaceAll('\\', '/');
const prefix = '\0monaco-zh-cn:';

/** 只在构建进程读取官方 AMD 数据；浏览器仍使用 ESM，不引入 AMD loader 或网络语言包。 */
function readBundle(suffix) {
  let bundle;
  runInNewContext(
    readFileSync(join(monacoRoot, `dev/vs/editor/editor.main.nls${suffix}.js`), 'utf8'),
    { define: (_name, messages) => (bundle = messages) },
  );
  return bundle;
}

const english = readBundle('');
const chinese = readBundle('.zh-cn');
const translations = new Map();
for (const [scope, messages] of Object.entries(english)) {
  const localized = chinese[scope];
  if (!localized || localized.length !== messages.length) {
    throw new Error(`Monaco 中文语言包与英文消息不匹配：${scope}`);
  }
  const dictionary = new Map();
  messages.forEach((message, index) => {
    // 同一模块的相同原文必须对应相同译文，避免升级后静默使用错误翻译。
    if (dictionary.has(message) && dictionary.get(message) !== localized[index]) {
      throw new Error(`Monaco 中文翻译存在歧义：${scope} / ${message}`);
    }
    dictionary.set(message, localized[index]);
  });
  translations.set(scope, Object.fromEntries(dictionary));
}

/** 按调用模块隔离翻译；保留原版占位符处理、未知文案回退和 localize2.original 语义。 */
export function monacoLocalePlugin() {
  return {
    name: 'monaco-zh-cn',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.endsWith('/nls.js') || !importer) return;
      const modulePath = importer.replaceAll('\\', '/').split('?')[0];
      const marker = '/monaco-editor/esm/';
      const offset = modulePath.lastIndexOf(marker);
      if (offset < 0) return;
      const scope = modulePath.slice(offset + marker.length).replace(/\.js$/, '');
      return prefix + scope;
    },
    load(id) {
      if (!id.startsWith(prefix)) return;
      const dictionary = translations.get(id.slice(prefix.length)) ?? {};
      return `
import * as nls from ${JSON.stringify(nlsPath)};
export * from ${JSON.stringify(nlsPath)};
const messages = ${JSON.stringify(dictionary)};
const translate = (message) => Object.prototype.hasOwnProperty.call(messages, message) ? messages[message] : message;
export function localize(data, message, ...args) {
  return nls.localize(data, translate(message), ...args);
}
export function localize2(data, message, ...args) {
  return {
    value: localize(data, message, ...args),
    original: nls.localize(data, message, ...args),
  };
}
export function getConfiguredDefaultLocale() { return 'zh-cn'; }
`;
    },
  };
}
