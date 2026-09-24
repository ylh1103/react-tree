# React + TypeScript + Vite

## 开发

```sh
pnpm install
pnpm dev
pnpm build
```

## 业务列表与路由

- `/applications`：应用列表，叶子 key / title 使用 `appName`，描述使用 `appDesc`。
- `/parameters`：参数列表，叶子 key / title 使用 `paramTypeName`，描述使用 `paramTypeDesc`。
- `/` 和原 `/tree` 自动跳转到应用列表。
- 路由只负责页面匹配；共用列表容器通过 `useGroupedList` 在挂载时同时查询清单和分组，刷新按钮也会重新查询两者。切换页面会取消未完成的查询，初次加载失败可在页面内重试。
- 生产部署需将页面路由回退到 `index.html`，以支持直接访问或刷新各路由。

### 页面结构与维护入口

树列表是参数/应用专用业务模块，所有实现集中在 `src/features/grouped-list/`，页面仅绑定各自的服务、业务配置和节点操作。原独立树组件目录及导出入口已移除。

| 修改内容                                               | 文件                       |
| ------------------------------------------------------ | -------------------------- |
| 列表整体流程、搜索、选中定位、虚拟滚动、拖拽预览和主题 | `GroupedListPage.tsx`      |
| 节点行、分组/叶子展示、重命名输入、节点菜单和溢出提示  | `GroupedListRow.tsx`       |
| 工具栏、标题统计、类型筛选和编辑按钮                   | `GroupedListToolbar.tsx`   |
| 查询、刷新、保存接口调用及业务节点操作的状态           | `useGroupedList.ts`        |
| 编辑草稿、提交/回退、分组重命名/移动/删除弹窗          | `useGroupEditing.tsx`      |
| 搜索展开、手动折叠、拖拽悬停展开                       | `useTreeExpansion.ts`      |
| 拖拽命中、落点计算和拖拽事件                           | `useDragDrop.ts`           |
| 不依赖 React 的树操作、索引、搜索与统计                | `treeUtils.ts`             |
| 接口数据合并与树格式转换                               | `model.ts`                 |
| 业务配置、节点、服务及回调类型                         | `types.ts`                 |
| HTTP 与 Mock 接口实现                                  | `service.ts`、`mockApi.ts` |
| 列表的复杂交互、主题和 Ant Design 样式覆盖             | `GroupedList.css`          |

基础布局、间距、文字和简单状态使用各组件中的 UnoCSS 类；需要手写的树列表 CSS 统一放在 `GroupedList.css`，由 `GroupedListPage.tsx` 引入，入口 `src/index.css` 仅保留全局基础和应用框架样式。

排查一次操作时，从 `GroupedListPage.tsx` 的事件绑定进入；节点入口看 `GroupedListRow.tsx`，分组编辑看 `useGroupEditing.tsx`，接口请求看 `useGroupedList.ts`。标题、节点内容、预览等只在一处使用的组件保留为对应文件内的私有组件。

### 设置与删除的业务接入

两个页面使用同一个业务列表入口，分别传入自己的接口与操作：

```tsx
<GroupedListPage
  config={config}
  service={parameterService}
  onSettings={handleParameterSettings}
  onDelete={handleParameterDelete}
/>
```

- `service.load(signal)` 和 `service.save(nodes)` 对接清单/分组的获取与保存；应用和参数保留各自的响应转换和保存字段。
- `onSettings` / `onDelete` 接收业务节点 `ListNode`，类型为 `ListNodeAction`。业务页面负责弹窗、确认、校验和实际接口，请返回等待整个操作结束的 Promise；取消时 resolve `false`，成功时 resolve `undefined`，失败时 reject。
- 列表在操作期间统一防重复点击，成功后重新查询清单和分组，取消不刷新，失败展示错误并保留当前数据。业务节点删除不调用分组删除或分组保存逻辑。
- 分组编辑期间禁用叶子设置/删除，以保护尚未保存的草稿；分组重命名、移动和删除仍走共用逻辑。
- 当前示例只提供清单/分组接口，尚未实现真实节点设置和删除；未传入回调的按钮和菜单保持禁用。

### 数据约定与合并

分组节点带 `children`（空数组也是目录），叶子不带 `children`。新增目录使用 `branch-` + UUID 生成唯一 key。目录 key 不应与业务名称重复。

分组初始值是 `null`；编辑保存后变为 JSON 数组字符串。清单是叶子名称与描述的唯一来源，分组记录负责结构和顺序：

1. 清单和分组都为空：展示空列表。
2. 清单为空：递归删除所有叶子，保留分组层级及空目录。
3. 分组为空：按清单顺序展示所有叶子。
4. 两者非空：剔除下线叶子，交集保留分组位置并使用最新描述，新增项按清单顺序追加根节点尾部。

重复叶子仅保留首次出现的位置；无效 JSON、非法节点或重复目录 key 会明确报错，刷新失败保留当前列表。保存成功才退出编辑，失败保留草稿供重试。分组的 `desc` 会保留。

### Mock.js 接口

默认使用 Mock.js 拦截 XMLHttpRequest，模拟 200–500ms 延迟。应用清单和接口位于 `src/features/applications/api.ts`，参数清单和接口位于 `src/features/parameters/api.ts`。

| 方法 | URL                             | 响应或请求体                                   |
| ---- | ------------------------------- | ---------------------------------------------- |
| GET  | `/mock-api/applications`        | `[{ appName, appDesc }]`                       |
| GET  | `/mock-api/applications/groups` | `{ appGroupInfo: null 或 JSON字符串 }`         |
| PUT  | `/mock-api/applications/groups` | `{ appGroupInfo: JSON字符串 }`                 |
| GET  | `/mock-api/parameters`          | `[{ paramTypeName, paramTypeDesc }]`           |
| GET  | `/mock-api/parameters/groups`   | `{ paramDbTypeGroupInfo: null 或 JSON字符串 }` |
| PUT  | `/mock-api/parameters/groups`   | `{ paramDbTypeGroupInfo: JSON字符串 }`         |

Mock 保存使用 localStorage 模拟后端持久化，分别存储于 `react-tree:mock:appGroupInfo` 和 `react-tree:mock:paramDbTypeGroupInfo`。删除对应存储项可恢复初始无分组状态。

设置 `VITE_LIST_API_BASE_URL=/api` 后，业务请求改用真实 HTTP 接口（上表 URL 前缀替换为 `/api`）；根据实际后端在 `api.ts` / `service.ts` 调整地址、方法和响应包装。

### 验证

```sh
pnpm test  # Node 24+，覆盖两类列表的合并规则、异常输入、接口调用和保存数据
pnpm build
pnpm lint
```

## ESLint + Prettier

使用 ESLint 9 Flat Config：JavaScript、TypeScript、React 组件和 JSX 推荐规则，React Hooks 推荐规则，以及 Vite Fast Refresh 检查。浏览器代码与 Node 配置文件分别设置全局变量。

`eslint` 和 `@eslint/js` 使用 `^9` 版本范围，仅更新 9.x，不会升级到 10。`eslint-plugin-react` 启用 `recommended` 和 `jsx-runtime` 预设，支持自动 JSX 转换，并自动检测 React 版本。仅在 TypeScript 文件中关闭 `react/prop-types`，由 TypeScript 检查组件 props。

ESLint 负责代码质量，Prettier 负责格式，`eslint-config-prettier` 放在最后关闭冲突规则。无需 `eslint-plugin-prettier`。

```sh
pnpm lint          # 检查代码
pnpm lint:fix      # 自动修复可修复的问题
pnpm format        # 格式化项目
pnpm format:check  # 检查格式，适合 CI
```

- `eslint.config.js`：检查规则及忽略目录。
- `.prettierrc.json`：2 空格、单引号、分号、尾随逗号、100 字符行宽、LF 换行。
- `.prettierignore`：忽略依赖、构建产物、生成文件和锁文件。
- `.vscode/settings.json`：保存时格式化并执行 ESLint 自动修复。

VS Code 请安装工作区推荐的 ESLint 和 Prettier 扩展。

这套配置不启用需要类型信息的 ESLint 规则；类型检查由 `pnpm build` 中的 `tsc -b` 完成。

参考：[typescript-eslint](https://typescript-eslint.io/getting-started/)、[Prettier 与 Linter 集成](https://prettier.io/docs/integrating-with-linters)。

### 浏览器样式兼容

- 自有 CSS 以 Chrome 86 为最低检查目标；Vite 的 JS/CSS 构建目标均为 `chrome86`。
- 树列表使用显式 `data-*` 状态表达父子交互，不依赖 `:has()`、`:is()` 或 `:where()`；基本样式继续使用 UnoCSS。
- Ant Design 运行时样式通过 `StyleProvider` 开启 `hashPriority="high"`、逻辑属性降级和前缀转换；提升样式优先级后要检查业务覆盖规则。
- `100dvh` 保留 `100vh` 回退；滚动条使用 WebKit 伪元素，并在不支持 `scrollbar-gutter` 时保留滚动空间。
- 构建目标不提供 DOM/JavaScript API 的 polyfill。当前 `inert` 等行为和第三方组件仍需 Chrome 86 实机回归；现代 Chromium 的检查不能代替该验收。
