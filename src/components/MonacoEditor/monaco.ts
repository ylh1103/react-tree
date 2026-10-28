/**
 * 两类编辑器共享的内网运行时：只使用 npm 本地资源，初始化早于封装库的 loader.init。
 * Worker 由 Vite 独立输出，按语言启动；不使用 CDN、AMD loader 或全局编辑器实例。
 */
import 'core-js/actual/array/at.js';
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TypeScriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Monaco 0.47 的列表及粘贴交互使用 Array.at；Chrome 86 需要定向补丁，语法降级不能替代它。
// 该补丁只在编辑器首次加载时执行，Worker 内不依赖这些主线程交互。
self.MonacoEnvironment = {
  getWorker(_workerId, label) {
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'css':
      case 'scss':
      case 'less':
        return new CssWorker();
      case 'html':
      case 'handlebars':
      case 'razor':
        return new HtmlWorker();
      case 'typescript':
      case 'javascript':
        return new TypeScriptWorker();
      default:
        return new EditorWorker();
    }
  },
};

// JSON 仍保留语法与 schema 校验；schema 由调用方内联注册，默认不按 $ref 发起网络请求。
monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  ...monaco.languages.json.jsonDefaults.diagnosticsOptions,
  enableSchemaRequest: false,
});

loader.config({ monaco });
