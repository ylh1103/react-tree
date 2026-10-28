/** 双侧差异视图：默认只读、并排且不忽略空白差异，支持调用方覆盖原生选项。 */
import '@/components/MonacoEditor/monaco';
import { DiffEditor } from '@monaco-editor/react';
import { useMemo } from 'react';
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
  // 只在调用方的选项变化时更新 Monaco，避免内容变化重复触发布局配置。
  const editorOptions = useMemo(
    () => ({
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: 2,
      readOnly: true,
      originalEditable: false,
      renderSideBySide: true,
      ignoreTrimWhitespace: false,
      ...options,
      minimap: { enabled: false, ...options?.minimap },
    }),
    [options],
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
