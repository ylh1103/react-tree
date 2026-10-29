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

`MonacoEditorProps` 保留原库 `EditorProps`：支持 `defaultValue`、`value`、`path`、`defaultPath`、`beforeMount`、`onMount`、`onChange`、`onValidate` 等。默认 JSON、400px 高度、自动布局、2 空格缩进，关闭缩略图和末行后的空白滚动；`options` 可以覆盖用户偏好和默认值；缩略图选项按字段合并。自动换行只改变显示，不改写文档；关闭缩进自动检测并默认插入空格，让用户设置作用于现有模型的后续输入；YAML 服务同步 indentation 与格式化 tabWidth，执行“格式化文档”时使用当前缩进，不因偏好变化自动重排文档。YAML 服务为全局共享，同屏实例若覆盖 options.tabSize 应保持一致；其他格式化选项、Schema 与校验配置保持原值。monaco-yaml 5.5.0 的类型未声明 tabWidth，本地适配已按 Worker 实现补齐，并以安装版格式化器测试验证。`loading` 同时用于代码下载与 Monaco 初始化等待，传 `null` 可隐藏占位内容。

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

两个组件需在项目 Redux Provider 内使用，订阅 `preferences.editor` 和 `preferences.themeMode`。用户配置的“编辑器”分组可设置主题、自动换行、显示或隐藏行号（显示文档的实际行号，旧版相对行号配置读取为显示）、10–24px 字号、缩略图和 2/4/8 空格缩进；普通编辑和差异对比即时生效，保存失败回退并支持重试。默认主题跟随平台实际配色，也可独立选择浅色、深色及高对比度主题。传 `theme` 可指定已注册的主题；自定义主题可在 `beforeMount` 中通过 `monaco.editor.defineTheme` 注册。Monaco 的主题属于共享实例，同屏编辑器应使用一致的主题。

精选主题使用 `monaco-themes@0.4.5`：GitHub Light（`github-light`）、GitHub Dark（`github-dark`）、Dracula（`dracula`）、Night Owl（`night-owl`）、Cobalt2（`cobalt2`）。选择这些在 VS Code 中广泛使用、且包内已有的配色移植版，不保证与最新版 VS Code 插件逐项一致。固定 0.4.5 是因为 0.4.8 的 exports 未开放主题 JSON 子路径。来源：[monaco-themes](https://github.com/brijeshb42/monaco-themes)、[GitHub Theme](https://marketplace.visualstudio.com/items?itemName=GitHub.github-vscode-theme)、[Dracula](https://marketplace.visualstudio.com/items?itemName=dracula-theme.theme-dracula)、[Night Owl](https://marketplace.visualstudio.com/items?itemName=sdras.night-owl)、[Cobalt2](https://marketplace.visualstudio.com/items?itemName=wesbos.theme-cobalt2)。

`themeDefinitions.ts` 只随编辑器运行时懒加载 5 份 JSON，并在 `loader.config` 前同步注册，切换时没有异步请求及旧响应竞争；不导入主题转换器或额外高亮引擎。`themeCatalog.ts` 是轻量目录，设置面板只读取色板预览，不挂载 Monaco。源主题 `base` 经校验后原样保留，不依赖预览目录推导。TextMate scope 与 Monaco token 不完全相同，因此仅补齐 YAML 键名及各类数字、JSON 属性名/字符串/数字/关键字的语言专用规则；源主题已有对应精确颜色时保留。YAML 字符串仅在浅色基础主题的具体规则遮蔽通用颜色，或源主题缺少字符串颜色时补齐；注释和大多数主题的 YAML 关键字直接沿用源规则；Dracula 的 YAML/JSON 布尔值与空值使用 Dracula 青色（`#8be9fd`），与粉色键名、紫色数字及黄色字符串区分，设置预览同步使用该颜色，其他语言关键字保持源主题配色。语言后缀位于 token 最后，`number.yaml` 不匹配 `number.float.yaml`，各数字类型分别映射；JSON 需使用 `string.key.json` 等精确名称，才能覆盖基础主题更具体的规则。其他语言及字符串转义、非法字符串等既有规则保持不变，回归测试使用安装版 Monaco 匹配器核对最终颜色和字体样式。各主题在保留原有色系的基础上区分键名、字符串、数字和布尔/空值四类颜色：GitHub Light/Dark 数字采用源主题紫色，避免与蓝色字符串接近或相同；Cobalt2 键名采用源主题青色，区别绿色字符串；Night Owl 保持原配色。布尔值和空值沿用同一 keyword token，不增加分词器。新增主题时需同步目录、配置 ID、JSON 导入及回归验证。

个性化配置写入独立的 `userSetting.editor`，旧配置缺项时补默认值；显式非法值触发读取错误并禁止保存。组件不修改旧 `userSetting.theme`，不保存编辑内容或请求业务接口。不同业务文档使用不同的 `path`；差异两侧使用不同的 `originalModelPath`、`modifiedModelPath`，避免复用同一模型导致内容串联。模型和编辑器默认由原库在卸载时释放；开启 `keepCurrentModel`、`keepCurrentOriginalModel` 或 `keepCurrentModifiedModel` 后，模型释放由调用方负责。复用同一路径时，还应避免一个组件卸载释放其他组件正在使用的模型。

应用环境参数面板只在首次勾选时创建编辑器，取消勾选（包括全不选）仅隐藏已打开的面板，再次勾选沿用内容、撤销/重做栈与光标；未打开的环境不提前创建 Monaco 实例。切换应用、离开工作区或环境被接口移除时，编辑器正常卸载并释放模型；刷新页面后的持久化历史不在此保留范围。

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
