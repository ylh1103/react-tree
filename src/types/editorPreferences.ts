/** 编辑器个性化配置契约；与历史 theme 及平台 themeMode 独立，旧文档缺字段时补默认值。 */
export const editorThemeIds = [
  'platform',
  'vs',
  'vs-dark',
  'hc-black',
  'hc-light',
  'github-light',
  'github-dark',
  'dracula',
  'night-owl',
  'cobalt2',
] as const;

export interface EditorPreferences {
  /** platform 跟随平台实际配色；稳定 ID 用于内置主题及精选主题的持久化。 */
  theme: (typeof editorThemeIds)[number];
  /** 按视口自动折行，不修改文档中的换行字符。 */
  wordWrap: 'off' | 'on';
  /** 是否显示文档的实际行号；读取时兼容旧版相对行号配置。 */
  lineNumbers: 'off' | 'on';
  /** 编辑区字号（px）。 */
  fontSize: number;
  /** 是否显示代码缩略图。 */
  minimap: boolean;
  /** 新输入和格式化时使用的缩进宽度，不自动改写已有内容。 */
  tabSize: number;
}

export const editorFontSizeRange = { min: 10, max: 24 } as const;
export const defaultEditorPreferences: EditorPreferences = {
  theme: 'platform',
  wordWrap: 'off',
  lineNumbers: 'on',
  fontSize: 13,
  minimap: false,
  tabSize: 2,
};

/** 只提取可支持字段；缺失字段补齐，显式非法值拒绝读取以阻止覆盖保存。 */
export function parseEditorPreferences(value: unknown): EditorPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('编辑器设置格式错误');
  const settings = { ...defaultEditorPreferences, ...value };
  if (
    !editorThemeIds.includes(settings.theme) ||
    !['off', 'on'].includes(settings.wordWrap) ||
    !['off', 'on', 'relative'].includes(settings.lineNumbers) ||
    typeof settings.fontSize !== 'number' ||
    !Number.isInteger(settings.fontSize) ||
    settings.fontSize < editorFontSizeRange.min ||
    settings.fontSize > editorFontSizeRange.max ||
    typeof settings.minimap !== 'boolean' ||
    ![2, 4, 8].includes(settings.tabSize)
  )
    throw new Error('编辑器设置格式错误');
  return {
    theme: settings.theme,
    wordWrap: settings.wordWrap,
    // 旧版 relative 读取为普通行号，不因兼容转换主动保存整份配置。
    lineNumbers: settings.lineNumbers === 'off' ? 'off' : 'on',
    fontSize: settings.fontSize,
    minimap: settings.minimap,
    tabSize: settings.tabSize,
  };
}
