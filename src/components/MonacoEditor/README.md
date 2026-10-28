# Monaco 编辑器

项目固定使用 `@monaco-editor/react@4.7.0`、`monaco-editor@0.47.0`。单值和差异编辑器共享本地运行时，入口分别按需加载；不要在应用入口导入 `monaco.ts` 或直接使用原库组件绕过初始化。

## 单值编辑

```tsx
import { useState } from 'react';
import { MonacoEditor } from '@/components/MonacoEditor';

export function ParameterEditor() {
  const [value, setValue] = useState('{"enabled":true}');

  return (
    <MonacoEditor
      height={400}
      language="json"
      value={value}
      onChange={(nextValue) => setValue(nextValue ?? '')}
    />
  );
}
```

`MonacoEditorProps` 保留原库 `EditorProps`：支持 `defaultValue`、`value`、`path`、`defaultPath`、`beforeMount`、`onMount`、`onChange`、`onValidate` 等。默认 JSON、400px 高度、自动布局、2 空格缩进，关闭缩略图和末行后的空白滚动；`options` 可以覆盖默认值。`loading` 同时用于代码下载与 Monaco 初始化等待，传 `null` 可隐藏占位内容。

## 差异对比

```tsx
import { MonacoDiffEditor } from '@/components/MonacoDiffEditor';

export function ParameterDiff() {
  return (
    <MonacoDiffEditor
      height={400}
      language="json"
      original={'{"enabled":false}'}
      modified={'{"enabled":true}'}
    />
  );
}
```

`MonacoDiffEditorProps` 保留原库 `DiffEditorProps`。默认 JSON、400px 高度、只读、并排且不忽略空白差异；窄容器保留 Monaco 自带的自动内联展示。传 `options={{ readOnly: false }}` 可编辑右侧，`originalEditable: true` 可开启左侧编辑。

原库的 DiffEditor 没有 `onChange` 属性。如需保存编辑结果，通过 `onMount` 获取差异编辑器，用 `getModifiedEditor().getValue()` 读取右侧内容；如自行注册 `onDidChangeModelContent`，须在所属 Effect 清理阶段释放返回的订阅。

## 主题与模型

两个组件需在项目 Redux Provider 内使用，默认仅订阅 `preferences.themeMode`，并跟随系统外观。传 `theme` 可指定已注册的主题；自定义主题可在 `beforeMount` 中通过 `monaco.editor.defineTheme` 注册。Monaco 的主题属于共享实例，同屏编辑器应使用一致的主题。

组件不修改旧 `userSetting.theme`，不保存编辑内容或请求业务接口。不同业务文档使用不同的 `path`；差异两侧使用不同的 `originalModelPath`、`modifiedModelPath`，避免复用同一模型导致内容串联。模型和编辑器默认由原库在卸载时释放；开启 `keepCurrentModel`、`keepCurrentOriginalModel` 或 `keepCurrentModifiedModel` 后，模型释放由调用方负责。复用同一路径时，还应避免一个组件卸载释放其他组件正在使用的模型。

## 内网与兼容

- `monaco.ts` 通过 `loader.config({ monaco })` 注入 npm 实例，不使用 CDN；编辑器、语言模块、字体和五类 Worker 均由 Vite 输出到部署资源。
- 支持 JSON、JavaScript/TypeScript、CSS/SCSS/Less、HTML 等内置语言服务，其他内置语言按 Monaco 自带能力提供高亮；YAML 等额外校验不在此封装范围。
- JSON 默认 `enableSchemaRequest: false`，不按 `$schema` 或 `$ref` 下载外部 Schema。需要业务校验时，在 `beforeMount` 中保留现有诊断选项并注册内联 `schemas`；该配置同样为全局共享，应集中管理，并用 `fileMatch` 隔离文档。显式开启网络 Schema 时，由调用方确保全部地址和引用均可从内网访问。
- 发布完整 `dist`，子路径部署应设置正确的 Vite `base`；Worker URL 不得回退到 SPA 的 HTML。若配置 CSP，应允许同源 Worker。
- Chrome 86 构建目标沿用项目配置；`core-js/actual/array/at.js` 仅在编辑器加载时补齐 Monaco 0.47 部分列表及粘贴操作需要的 `Array.prototype.at`，不引入完整 polyfill。该补丁不代表已完成全部 Chrome 86 兼容验收，仍需在目标浏览器验证生产构建。
- 内网构建应使用内部 npm 镜像或预备完整缓存，并使用锁文件安装；运行时无需 npm 服务。`pnpm-workspace.yaml` 明确跳过 core-js 只输出支持提示的 postinstall，不影响补丁功能，也避免严格安装模式将未处理脚本判为失败。

本组件没有新增样式文件；只有调用方可变的宽高使用内联尺寸，其余加载布局使用 UnoCSS，加载指示器复用 Ant Design。
