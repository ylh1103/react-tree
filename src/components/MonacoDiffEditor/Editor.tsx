/** 双侧差异视图：默认只读、并排且不忽略空白差异，支持调用方覆盖原生选项。 */
import '@/components/MonacoEditor/monaco';
import { DiffEditor } from '@monaco-editor/react';
import { useMemo } from 'react';
import { useYamlIndentation } from '@/components/MonacoEditor/useYamlIndentation';
import { useAppSelector } from '@/store/hooks';
import type { MonacoDiffEditorProps } from './index';
import { EditorLoading } from '@/components/MonacoEditor/Loading';
import { useEditorTheme } from '@/components/MonacoEditor/useEditorTheme';

export default function MonacoDiffEditorView({
  height = 400,
  language = 'json',
  theme,
  options,
  loading,
  ...props
}: MonacoDiffEditorProps) {
  const editorTheme = useEditorTheme(theme);
  const preferences = useAppSelector((state) => state.preferences.editor);
  useYamlIndentation(preferences.tabSize);
  // 只在用户偏好或调用方选项变化时更新 Monaco，避免内容变化重复触发布局配置。
  const editorOptions = useMemo(
    () => ({
      automaticLayout: true,
      // 差异两侧的悬浮提示同样需要越过编辑区与分栏的裁剪边界。
      fixedOverflowWidgets: true,
      scrollBeyondLastLine: false,
      // 用户偏好只更新显示与后续输入；调用方原生 options 保留覆盖能力。
      wordWrap: preferences.wordWrap,
      lineNumbers: preferences.lineNumbers,
      fontSize: preferences.fontSize,
      tabSize: preferences.tabSize,
      detectIndentation: false,
      insertSpaces: true,
      diffWordWrap: 'inherit' as const,
      readOnly: true,
      originalEditable: false,
      renderSideBySide: true,
      ignoreTrimWhitespace: false,
      ...options,
      minimap: { enabled: preferences.minimap, ...options?.minimap },
    }),
    [options, preferences],
  );

  return (
    <DiffEditor
      {...props}
      height={height}
      language={language}
      theme={editorTheme}
      options={editorOptions}
      loading={loading === undefined ? <EditorLoading height="100%" /> : loading}
    />
  );
}
