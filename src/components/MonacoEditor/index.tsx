/** 参数编辑器的轻量入口：首次展示时才加载 Monaco、语言服务与本地 Worker。 */
import { lazy, Suspense } from 'react';
import type { EditorProps } from '@monaco-editor/react';
import { EditorLoading } from './Loading';

/** 保留原库的值、模型路径、生命周期和校验契约；默认 JSON、400px 高度及平台主题。 */
export type MonacoEditorProps = EditorProps;

const LazyEditor = lazy(() => import('./Editor'));

export function MonacoEditor(props: MonacoEditorProps) {
  return (
    <Suspense
      fallback={
        <EditorLoading width={props.width} height={props.height}>
          {props.loading}
        </EditorLoading>
      }
    >
      <LazyEditor {...props} />
    </Suspense>
  );
}
