/** 只由编辑器懒加载运行时引入主题 JSON；不引入主题转换器、TextMate 引擎或额外语言服务。 */
import type { editor } from 'monaco-editor';
import githubLight from 'monaco-themes/themes/GitHub Light.json' with { type: 'json' };
import githubDark from 'monaco-themes/themes/GitHub Dark.json' with { type: 'json' };
import dracula from 'monaco-themes/themes/Dracula.json' with { type: 'json' };
import nightOwl from 'monaco-themes/themes/Night Owl.json' with { type: 'json' };
import cobalt2 from 'monaco-themes/themes/Cobalt2.json' with { type: 'json' };
import { customEditorThemes, type CustomEditorTheme } from './themeCatalog.ts';

const sources = {
  'github-light': githubLight,
  'github-dark': githubDark,
  dracula,
  'night-owl': nightOwl,
  cobalt2,
};

/** JSON 导入会将 base 推断为 string；校验后收窄类型，保持源主题的继承方式。 */
function assertThemeBase(source: {
  base: string;
}): asserts source is { base: editor.BuiltinTheme } {
  if (!['vs', 'vs-dark', 'hc-black', 'hc-light'].includes(source.base))
    throw new Error(`不支持的编辑器基础主题：${source.base}`);
}

/** 仅补齐 YAML/JSON 的配色缺口，不覆盖其他语言及源主题已提供的对应规则。 */
export function createEditorTheme(theme: CustomEditorTheme): editor.IStandaloneThemeData {
  const source = sources[theme.value];
  assertThemeBase(source);
  const hasSourceColor = (token: string) =>
    source.rules.some(
      (rule) => rule.foreground && (token === rule.token || token.startsWith(`${rule.token}.`)),
    );
  const colors: Record<string, string> = {
    'type.yaml': theme.key,
    // 语言后缀位于最后，number.yaml 无法匹配 number.float.yaml，需覆盖实际分词类型。
    ...Object.fromEntries(
      [
        'number',
        'number.float',
        'number.octal',
        'number.hex',
        'number.infinity',
        'number.nan',
        'number.date',
      ].map((token) => [`${token}.yaml`, theme.number]),
    ),
    'string.key.json': theme.key,
    'string.value.json': theme.string,
    'number.json': theme.number,
    'keyword.json': theme.keyword,
  };
  // vs 内置 string.yaml 优先于通用 string；深色主题则仅在源主题没有字符串颜色时补齐。
  if (source.base === 'vs' || !hasSourceColor('string.yaml')) colors['string.yaml'] = theme.string;
  // Dracula 的布尔值/null/~ 使用独立青色，与粉色键名、紫色数字及黄色字符串区分。
  // 仅限定 YAML，JS/TS 等语言的关键字仍沿用源主题；JSON 及设置预览共用目录中的常量色。
  if (theme.value === 'dracula') colors['keyword.yaml'] = theme.keyword;
  return {
    ...source,
    rules: [
      ...source.rules,
      ...Object.entries(colors)
        .filter(([token]) => !source.rules.some((rule) => rule.token === token && rule.foreground))
        .map(([token, color]) => ({ token, foreground: color.slice(1) })),
    ],
  };
}

/** 注册早于编辑器创建，切换主题无需异步状态，也不会被迟到的加载结果覆盖。 */
export function registerEditorThemes(defineTheme: typeof editor.defineTheme) {
  for (const theme of customEditorThemes) defineTheme(theme.value, createEditorTheme(theme));
}
