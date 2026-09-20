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
- 路由只负责页面匹配；应用和参数页面通过 `useGroupedList` 在挂载时同时查询清单和分组，刷新按钮也会重新查询两者。切换页面会取消未完成的查询，初次加载失败可在页面内重试。
- 生产部署需将页面路由回退到 `index.html`，以支持直接访问或刷新各路由。

### 页面结构

- `src/pages/ApplicationListPage.tsx`、`ParameterListPage.tsx`：绑定各自的服务和业务配置，并调用 `useGroupedList` 管理页面查询生命周期。
- `src/features/grouped-list/GroupedListPage.tsx`：共用列表容器，负责筛选与树组件的业务接入；页面传入的 `useGroupedList.ts` 状态统一管理初始加载、刷新、保存和错误重试。
- `GroupedListToolbar.tsx`：工具栏和编辑操作；`GroupedListHeading.tsx`：列表标题、分类计数和统计提示；`GroupedListContent.tsx`：分组与叶子内容。
- `src/components/VirtualTree/VirtualTree.tsx`：组合树状态、虚拟行渲染和选中定位。
- `useTreeReducer.ts`：编辑草稿与提交基线；`useTreeActions.tsx`：保存、取消以及重命名、移动、删除弹窗。
- `useTreeExpansion.ts`：手动展开、搜索折叠覆盖、路径展开和拖拽悬停展开。
- `useDragDrop.ts`：拖拽命中与移动；`TreeDragPreview.tsx`：拖拽预览；`TreeRow.tsx`：单行交互。
- `utils.ts` 与业务 `model.ts` 保持纯数据处理，供组件与回归测试复用。

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
