/** 单值编辑器实现：原生属性透传，只补参数编辑默认值；生命周期及模型释放由原库负责。 */
import './monaco';
import Editor from '@monaco-editor/react';
import { useMemo } from 'react';
import { useYamlIndentation } from '@/components/MonacoEditor/useYamlIndentation';
import { useAppSelector } from '@/store/hooks';
import type { MonacoEditorProps } from './index';
import { EditorLoading } from './Loading';
import { useEditorTheme } from './useEditorTheme';

export default function MonacoEditorView({
  height = 400,
  defaultLanguage,
  theme,
  options,
  loading,
  ...props
}: MonacoEditorProps) {
  const editorTheme = useEditorTheme(theme);
  const preferences = useAppSelector((state) => state.preferences.editor);
  useYamlIndentation(options?.tabSize ?? preferences.tabSize);
  // 保持选项引用稳定，避免仅尺寸或受控值变化时重复调用 Monaco.updateOptions。
  const editorOptions = useMemo(
    () => ({
      automaticLayout: true,
      // 报错悬浮、补全等浮层按视口定位，避免被分栏及编辑区的 overflow-hidden 裁剪。
      fixedOverflowWidgets: true,
      scrollBeyondLastLine: false,
      // 用户偏好只更新显示与后续输入；调用方原生 options 保留覆盖能力。
      wordWrap: preferences.wordWrap,
      lineNumbers: preferences.lineNumbers,
      fontSize: preferences.fontSize,
      tabSize: preferences.tabSize,
      detectIndentation: false,
      insertSpaces: true,
      ...options,
      minimap: { enabled: preferences.minimap, ...options?.minimap },
    }),
    [options, preferences],
  );

  return (
    <Editor
      {...props}
      height={height}
      defaultLanguage={defaultLanguage ?? props.language ?? 'json'}
      theme={editorTheme}
      options={editorOptions}
      loading={loading === undefined ? <EditorLoading height="100%" /> : loading}
    />
  );
}
