# Monaco 编辑器

项目固定使用 `@monaco-editor/react@4.7.0`、`monaco-editor@0.47.0`、`monaco-yaml@5.5.0`。单值和差异编辑器共享本地运行时，入口分别按需加载；不要在应用入口导入 `monaco.ts` 或直接使用原库组件绕过初始化。

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

两类编辑器默认开启 `fixedOverflowWidgets`，让报错悬浮提示及补全浮层按视口定位，越过环境分栏和编辑区的 `overflow-hidden` 边界，避免首行错误提示上半部分被截断。调用方仍可通过 `options` 覆盖。承载编辑器的祖先应避免设置创建固定定位包含块的 `transform`、`filter` 或 `contain`，否则需另行配置浮层容器。

## 内网与兼容

- 编辑器界面固定使用简体中文，单值和差异编辑器均生效，包括右键菜单、查找替换和命令面板。`build/monaco-locale-plugin.mjs` 按 ESM 模块匹配 `monaco-editor@0.47.0` 包内官方中英文语言数据；不下载语言包、不切换 AMD 加载，也不升级编辑器。开发预打包排除 Monaco，主线程和 Worker 构建共用语言插件，保持开发与生产行为一致。
- 翻译保留占位符及 `localize2.original` 原文，无官方译文时回退英文。语言服务返回的诊断信息（例如 YAML/TypeScript 错误）、Schema 描述和业务文本不属于编辑器界面语言包，可能仍显示英文。升级 Monaco 后需运行语言适配测试及构建，并复查界面。
- `monaco.ts` 通过 `loader.config({ monaco })` 注入 npm 实例，不使用 CDN；编辑器、语言模块、字体和六类 Worker 均由 Vite 输出到部署资源，Worker 按需启动。
- 支持 JSON、JavaScript/TypeScript、CSS/SCSS/Less、HTML 等内置语言服务，其他内置语言按 Monaco 自带能力提供高亮。YAML 通过 `monaco-yaml` 提供语法检查、格式化及基于 Schema 的补全和悬浮提示；Properties 使用 `language="ini"` 提供基础高亮。
- YAML 编辑传 `language="yaml"`，差异编辑器同样适用。默认启用语法检查及 `format: { enable: true }`，格式化需通过右键“格式化文档”等操作触发，不自动改写输入或保存内容。Schema 默认为空，字段类型、必填项等业务校验须另行集中配置内联 Schema，并以模型 `path` 与 `fileMatch` 匹配。
- YAML 的 `enableSchemaRequest: false` 禁止语言服务下载远程 Schema，包括外部引用；语法检查和格式化均在浏览器本地运行，不需要外网或后端服务。`yaml.worker.ts` 是适配 Vite 的独立入口；开发热更新时会释放旧 YAML 服务，避免重复注册。
- JSON 默认 `enableSchemaRequest: false`，不按 `$schema` 或 `$ref` 下载外部 Schema。需要业务校验时，在 `beforeMount` 中保留现有诊断选项并注册内联 `schemas`；该配置同样为全局共享，应集中管理，并用 `fileMatch` 隔离文档。显式开启网络 Schema 时，由调用方确保全部地址和引用均可从内网访问。
- 发布完整 `dist`，子路径部署应设置正确的 Vite `base`；Worker URL 不得回退到 SPA 的 HTML。若配置 CSP，应允许同源 Worker。
- Chrome 86 构建目标沿用项目配置；`core-js/actual/array/at.js` 仅在编辑器加载时补齐 Monaco 0.47 部分列表及粘贴操作需要的 `Array.prototype.at`，不引入完整 polyfill。该补丁不代表已完成全部 Chrome 86 兼容验收，仍需在目标浏览器验证生产构建。
- 内网构建应使用内部 npm 镜像或预备完整缓存，并使用锁文件安装；运行时无需 npm 服务。`pnpm-workspace.yaml` 明确跳过 core-js 只输出支持提示的 postinstall，不影响补丁功能，也避免严格安装模式将未处理脚本判为失败。

本组件没有新增样式文件；只有调用方可变的宽高使用内联尺寸，其余加载布局使用 UnoCSS，加载指示器复用 Ant Design。

## YAML 验证

- 在首行输入 `spring: bad: value`，将光标移到错误处并用 `Ctrl/⌘+K`、`Ctrl/⌘+I` 打开悬浮提示，完整错误正文和“查看问题”操作均应可见；检查靠近右侧的环境面板、窄分栏及滚动后的定位。该裁剪问题依赖浏览器真实布局，现有 Node 测试无法判定可见区域，需在浏览器中回归。
- 在 `language="yaml"` 的可编辑实例中输入 `ports: [8080, 8081`，应出现语法错误标记；补齐 `]` 后标记应消失。
- 输入 `port:    8080`，执行右键“格式化文档”，应整理为 `port: 8080`。`port: abc` 本身是合法 YAML，没有业务 Schema 时不应因类型而报错。
- 发布生产构建后，在只允许访问内网部署地址的浏览器中重复上述操作；检查 Network，确认 YAML Worker 资源返回 JavaScript 且无公网 Schema 请求，并检查 Console 没有 Worker 加载错误。当前封装保留默认 JSON 语言，业务调用方须显式指定 YAML。
