/** 编辑器偏好面板：复用外观主题卡片与局部预览变量，交互沿用抽屉的串行保存、失败回退和重试。 */
import { Button, Radio, Select, Switch } from 'antd';
import { useId, type CSSProperties } from 'react';
import { themeVariablesByMode } from '@/styles/theme';
import { customEditorThemes, type CustomEditorTheme } from '@/components/MonacoEditor/themeCatalog';
import { SettingsOptionCard, SettingsDefaultBadge } from './SettingsOptionCard';
import { useAppSelector } from '@/store/hooks';
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

/** 与外观页一致的两列主题卡片；默认项独占一行，保留清晰的默认标记。 */
const editorThemes = [
  { value: 'vs', label: '浅色', icon: 'i-lucide-sun', dark: false },
  { value: 'vs-dark', label: '深色', icon: 'i-lucide-moon', dark: true },
  { value: 'platform', label: '跟随平台', icon: 'i-lucide-monitor', dark: false },
  { value: 'hc-light', label: '高对比度浅色', icon: 'i-lucide-contrast', dark: false },
  { value: 'hc-black', label: '高对比度深色', icon: 'i-lucide-contrast', dark: true },
  ...customEditorThemes.map((theme) => ({
    ...theme,
    icon: theme.dark ? 'i-lucide-moon' : 'i-lucide-sun',
  })),
] as const;

export function EditorSetting({
  disabled,
  onSave,
}: {
  disabled: boolean;
  onSave: (changes: Partial<UserSettings>) => void;
}) {
  const editor = useAppSelector((state) => state.preferences.editor);
  const id = useId();
  const save = (changes: Partial<EditorPreferences>) =>
    onSave({ editor: { ...editor, ...changes } });
  return (
    <section className="flex flex-col gap-3 pb-4" aria-labelledby={`${id}-theme`}>
      <h3 id={`${id}-theme`} className="m-0 text-14px font-600 leading-5 text-text">
        编辑器主题
      </h3>
      <Radio.Group
        name={`${id}-theme`}
        aria-labelledby={`${id}-theme`}
        value={editor.theme}
        disabled={disabled}
        className="grid! w-full! grid-cols-2 gap-3"
        onChange={(event) => {
          const theme = editorThemes.find((item) => item.value === event.target.value)?.value;
          if (theme) save({ theme });
        }}
      >
        {editorThemes.map(({ value, label, icon, dark }) => (
          <SettingsOptionCard
            key={value}
            value={value}
            aria-label={label}
            className={value === 'platform' ? 'col-span-2 text-left!' : ''}
          >
            {value === 'platform' ? (
              <span className="grid w-full grid-cols-2 items-center gap-32px">
                <span
                  aria-hidden="true"
                  className="relative block h-80px w-full overflow-hidden rounded-control"
                >
                  <EditorThemePreview dark={false} />
                  <span className="absolute inset-0 [clip-path:polygon(58%_0,100%_0,100%_100%,42%_100%)]">
                    <EditorThemePreview dark />
                  </span>
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-1.5 text-14px font-500 leading-5">
                    {label}
                    <SettingsDefaultBadge />
                  </span>
                  <span className="text-12px leading-4 text-text-muted">随平台外观自动切换</span>
                </span>
              </span>
            ) : (
              <span className="flex w-full min-w-0 flex-col gap-2">
                <EditorThemePreview
                  dark={dark}
                  contrast={value === 'hc-light' || value === 'hc-black'}
                  palette={customEditorThemes.find((theme) => theme.value === value)}
                />
                <span className="flex items-center justify-center gap-1.5 text-14px font-500 leading-5">
                  <span aria-hidden="true" className={`${icon} shrink-0 text-16px`} />
                  {label}
                </span>
              </span>
            )}
          </SettingsOptionCard>
        ))}
      </Radio.Group>
      <p className="m-0 text-12px leading-5 text-text-muted">
        主题仅作用于编辑区，适用于参数编辑与差异对比。
      </p>
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
          <div>
            <label htmlFor={`${id}-tab`} className="text-14px text-text">
              缩进大小
            </label>
            <p id={`${id}-tab-help`} className="m-0 mt-1 text-12px leading-5 text-text-muted">
              用于输入和 YAML 格式化
            </p>
          </div>
          <Select<number>
            id={`${id}-tab`}
            aria-describedby={`${id}-tab-help`}
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
