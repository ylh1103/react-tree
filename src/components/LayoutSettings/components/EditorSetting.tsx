/** 编辑器偏好面板：主题选项和选中值共用缩略图，交互沿用抽屉的串行保存、失败回退和重试。 */
import { Button, Select, Switch } from 'antd';
import { useId, type CSSProperties } from 'react';
import { themeVariablesByMode } from '@/styles/theme';
import { customEditorThemes, type CustomEditorTheme } from '@/components/MonacoEditor/themeCatalog';
import { SettingsDefaultBadge } from './SettingsOptionCard';
import { useAppSelector } from '@/store/hooks';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import type { UserSettings } from '@/types/preferences';
import {
  defaultEditorPreferences,
  editorFontSizeRange,
  type EditorPreferences,
} from '@/types/editorPreferences';

/** 预览复用注册主题的色板，不挂载 Monaco，避免改变同屏编辑器的共享主题或提前加载运行时。 */
function EditorThemePreview({
  dark,
  contrast = false,
  palette,
}: {
  dark: boolean;
  contrast?: boolean;
  palette?: CustomEditorTheme;
}) {
  const variables = {
    ...themeVariablesByMode[dark ? 'dark' : 'light'],
    ...(palette && {
      '--color-surface': palette.background,
      '--color-sidebar': palette.background,
      '--color-text': palette.foreground,
      '--color-text-muted': palette.comment,
      '--color-accent-text': palette.key,
      '--color-success': palette.string,
      '--editor-preview-number': palette.number,
      '--editor-preview-keyword': palette.keyword,
    }),
  } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      style={variables}
      className={`flex h-80px w-full overflow-hidden rounded-control border border-solid bg-surface text-left font-mono text-10px leading-16px ${contrast ? 'border-text' : 'border-border'}`}
    >
      <span className="flex w-6 shrink-0 flex-col items-center border-r border-r-solid border-divider bg-sidebar py-2 text-text-muted">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col overflow-hidden px-2 py-2 whitespace-nowrap">
        <span className={contrast ? 'font-600 text-text' : 'text-accent-text'}>application:</span>
        <span className="pl-2 text-accent-text">
          name: <span className={contrast ? 'font-600 text-text' : 'text-success'}>demo</span>
        </span>
        <span className="pl-2 text-accent-text">
          port: <span className="[color:var(--editor-preview-number,var(--color-text))]">8080</span>
        </span>
        <span className="pl-2 text-accent-text">
          enabled:{' '}
          <span className="[color:var(--editor-preview-keyword,var(--color-text))]">true</span>
        </span>
      </span>
      {contrast && <span className="my-2 mr-1 w-1 shrink-0 bg-text" />}
    </span>
  );
}

/** 轻量主题目录驱动选项与预览，新增精选主题直接追加到列表，不增加面板高度。 */
const editorThemes = [
  { value: 'platform', label: '跟随平台', dark: false },
  { value: 'vs', label: '浅色', dark: false },
  { value: 'vs-dark', label: '深色', dark: true },
  { value: 'hc-light', label: '高对比度浅色', dark: false },
  { value: 'hc-black', label: '高对比度深色', dark: true },
  ...customEditorThemes,
] as const;

// label 保持纯文本以供搜索和无障碍命名，缩略图通过 Select 的渲染接口统一展示。
const editorThemeOptions = editorThemes.map(({ value, label }) => ({ value, label }));

/** 下拉选项与选中值使用相同布局；跟随平台的预览同步实际配色。 */
function EditorThemeOption({
  theme,
  platformDark,
}: {
  theme: (typeof editorThemes)[number];
  platformDark: boolean;
}) {
  const followsPlatform = theme.value === 'platform';
  const dark = followsPlatform ? platformDark : theme.dark;
  return (
    <span className="flex w-full min-w-0 items-center gap-3 py-1">
      <span className="w-136px shrink-0">
        <EditorThemePreview
          dark={dark}
          contrast={theme.value === 'hc-light' || theme.value === 'hc-black'}
          palette={customEditorThemes.find((palette) => palette.value === theme.value)}
        />
      </span>
      <span className="flex min-w-0 flex-col gap-1 whitespace-normal">
        <span className="flex flex-wrap items-center gap-1.5 text-13px font-500 leading-5">
          {theme.label}
          {followsPlatform && <SettingsDefaultBadge />}
        </span>
      </span>
    </span>
  );
}

export function EditorSetting({
  disabled,
  onSave,
}: {
  disabled: boolean;
  onSave: (changes: Partial<UserSettings>) => void;
}) {
  const editor = useAppSelector((state) => state.preferences.editor);
  const themeMode = useAppSelector((state) => state.preferences.themeMode);
  const platformTheme = useResolvedTheme(themeMode);
  const id = useId();
  const save = (changes: Partial<EditorPreferences>) =>
    onSave({ editor: { ...editor, ...changes } });
  return (
    <section className="flex flex-col gap-3 pb-4" aria-labelledby={`${id}-theme`}>
      <h3 id={`${id}-theme`} className="m-0 text-14px font-600 leading-5 text-text">
        编辑器主题
      </h3>
      <Select<EditorPreferences['theme']>
        id={`${id}-theme-select`}
        aria-labelledby={`${id}-theme`}
        value={editor.theme}
        disabled={disabled}
        className="w-full py-1!"
        size="large"
        showSearch={{ optionFilterProp: 'label' }}
        options={editorThemeOptions}
        listHeight={360}
        listItemHeight={98}
        labelRender={({ value, label }) => {
          const theme = editorThemes.find((item) => item.value === value);
          return theme ? (
            <EditorThemeOption theme={theme} platformDark={platformTheme === 'dark'} />
          ) : (
            label
          );
        }}
        optionRender={(option) => {
          const theme = editorThemes.find((item) => item.value === option.value);
          return theme ? (
            <EditorThemeOption theme={theme} platformDark={platformTheme === 'dark'} />
          ) : (
            option.label
          );
        }}
        notFoundContent="未找到匹配的主题"
        onChange={(theme) => save({ theme })}
      />
      <h3 className="m-0 mt-3! text-14px font-600 leading-5 text-text">阅读与显示</h3>
      <div className="rounded-ui bg-sidebar px-3 [&>div+div]:border-t [&>div+div]:border-t-solid [&>div+div]:border-divider">
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <label htmlFor={`${id}-wrap`} className="text-14px text-text">
              自动换行
            </label>
            <p id={`${id}-wrap-help`} className="m-0 mt-1 text-12px leading-5 text-text-muted">
              长行按编辑区宽度折行，不修改文件内容。
            </p>
          </div>
          <Switch
            id={`${id}-wrap`}
            aria-describedby={`${id}-wrap-help`}
            checked={editor.wordWrap === 'on'}
            disabled={disabled}
            onChange={(checked) => save({ wordWrap: checked ? 'on' : 'off' })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <label htmlFor={`${id}-lines`} className="text-14px text-text">
            显示行号
          </label>
          <Switch
            id={`${id}-lines`}
            checked={editor.lineNumbers === 'on'}
            disabled={disabled}
            onChange={(checked) => save({ lineNumbers: checked ? 'on' : 'off' })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <label htmlFor={`${id}-minimap`} className="text-14px text-text">
            显示代码缩略图
          </label>
          <Switch
            id={`${id}-minimap`}
            checked={editor.minimap}
            disabled={disabled}
            onChange={(minimap) => save({ minimap })}
          />
        </div>
      </div>
      <h3 className="m-0 mt-3! text-14px font-600 leading-5 text-text">字体与缩进</h3>
      <div className="rounded-ui bg-sidebar px-3 [&>div+div]:border-t [&>div+div]:border-t-solid [&>div+div]:border-divider">
        <div className="flex items-center justify-between gap-3 py-3">
          <label htmlFor={`${id}-font`} className="text-14px text-text">
            字体大小
          </label>
          <Select<number>
            id={`${id}-font`}
            className="w-150px"
            value={editor.fontSize}
            disabled={disabled}
            onChange={(fontSize) => save({ fontSize })}
            options={Array.from(
              { length: editorFontSizeRange.max - editorFontSizeRange.min + 1 },
              (_, index) => {
                const value = editorFontSizeRange.min + index;
                return {
                  value,
                  label: `${value} px${value === defaultEditorPreferences.fontSize ? '（默认）' : ''}`,
                };
              },
            )}
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <label htmlFor={`${id}-tab`} className="text-14px text-text">
            缩进大小
          </label>
          <Select<number>
            id={`${id}-tab`}
            className="w-150px shrink-0"
            value={editor.tabSize}
            disabled={disabled}
            onChange={(tabSize) => save({ tabSize })}
            options={[2, 4, 8].map((value) => ({
              value,
              label: `${value} 空格${value === 2 ? '（默认）' : ''}`,
            }))}
          />
        </div>
      </div>
      <Button
        type="text"
        className="mt-1 h-auto! self-start px-0! text-text-secondary! hover:text-accent-text!"
        disabled={disabled}
        onClick={() => onSave({ editor: defaultEditorPreferences })}
      >
        <span aria-hidden="true" className="i-lucide-rotate-ccw text-14px" />
        恢复编辑器默认设置
      </Button>
    </section>
  );
}
