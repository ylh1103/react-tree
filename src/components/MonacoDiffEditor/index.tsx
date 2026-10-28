/** 差异编辑器的轻量入口：与单值编辑器共享运行时，但分别按需加载展示实现。 */
import { lazy, Suspense } from 'react';
import type { DiffEditorProps } from '@monaco-editor/react';
import { EditorLoading } from '@/components/MonacoEditor/Loading';

/** 保留原库双侧内容、模型路径和生命周期契约；默认只读对比，options 可覆盖。 */
export type MonacoDiffEditorProps = DiffEditorProps;

const LazyDiffEditor = lazy(() => import('./Editor'));

export function MonacoDiffEditor(props: MonacoDiffEditorProps) {
  return (
    <Suspense
      fallback={
        <EditorLoading width={props.width} height={props.height}>
          {props.loading}
        </EditorLoading>
      }
    >
      <LazyDiffEditor {...props} />
    </Suspense>
  );
}
