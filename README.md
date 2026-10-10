# React + TypeScript + Vite

## 开发

全局配色维护于 `src/styles/theme.ts`，直接使用 Ant Design 默认算法和蓝色色阶，不覆盖颜色 token。入口将 `theme.getDesignToken(appTheme)` 的配色写入 CSS 变量，UnoCSS 与 Ant Design 共用同一套默认颜色；深色导航和品牌 Logo 保留各自的色彩。调整主题时统一修改该文件。

```sh
pnpm install
pnpm dev
pnpm build
```

## 系统入口与平台路由

- `/` 展示我的系统，支持系统英文名、中文名、架构编号搜索、角色筛选和分页，默认每页 8 条。
- `/systems/:systemName` 跳转至该系统的 `overview`。应用参数页面为 `overview`、`application/:appName?`、`params`、`search`、`inspect`、`exception`、`compare`、`apps-comparison`、`setting`。
- 数据库参数使用 `/systems/:systemName/db/:paramTypeName?`，设置使用 `/systems/:systemName/db/setting`。`setting` 是保留类型名称。
- 平台切换进入目标默认页；系统切换保留平台、进入目标默认页。系统、平台、菜单和列表选中项均由 URL 驱动。
- `src/routeManifest.ts` 是可测试的路由结构，`src/router.tsx` 绑定页面；系统共享框架提供工作上下文，应用与数据库平台复用现有导航与 `SplitPane`。
- 未实现业务页面显示工作区框架；环境锁定、系统新增、成员管理不在本次范围。

### 数据接入

系统清单接口尚未提供，默认使用 `src/features/systems/mock.ts`。配置 `VITE_SYSTEMS_API_URL` 后通过已有 `requestData` 发起 GET，请返回用户给定结构的 `SystemInfo[]`。该接口应只返回当前用户可访问的系统，未知角色仅显示“未知角色”，不推导操作权限。

应用和数据库参数类型清单复用 `VITE_LIST_API_BASE_URL` 下已有的 `/applications`、`/parameters` GET 接口，系统工作区额外传递 `systemName` 查询参数；后端需支持按系统过滤。未配置时复用现有清单 Mock。React Query 查询键包含系统维度，避免跨系统缓存复用。应用侧边栏支持分组保存，参数内容工作区仍为待接入框架；数据库类型清单只读。

部署时需将页面路由回退到 `index.html`，以支持刷新和直接访问。系统清单返回 403 时展示无权访问；名称不在清单内时显示系统不存在，不自动进入其他系统。

## 既有业务列表组件

- `ApplicationListPage`：既有分组应用列表，叶子 key / title 使用 `appName`，描述使用 `appDesc`。
- `ParameterListPage`：既有分组参数列表，叶子 key / title 使用 `paramTypeName`，描述使用 `paramTypeDesc`。
- 应用路由的侧边栏已接入 `ApplicationListPage`，保留分组编辑、搜索、类型筛选、选中定位、虚拟滚动和拖拽。选中应用同步到 URL，右侧展示应用信息与参数内容框架；数据库工作区仍采用只读类型清单。
- 系统应用列表的查询与写入键为 `['grouped-list', 'applications:<systemName>']` 和 `['grouped-list-write', 'applications:<systemName>']`；侧边栏与右侧共用查询结果。真实清单和分组接口的 GET / PUT 均携带 `systemName` 查询参数。模拟分组按系统独立存储，不修改原全局分组记录。
- 路由只负责页面匹配；共用列表容器通过 React Query 缓存清单与分组的合并结果。首次挂载或缓存过期时并行查询两者；手动刷新立即使对应缓存失效。最后一个列表订阅卸载时取消未完成的查询，加载失败通过列表内的错误提示重试。
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

### 跨组件刷新与请求缓存

应用入口的 `QueryClientProvider` 使用 `src/lib/queryClient.ts` 中的唯一客户端。列表使用 `queries.ts` 统一管理查询键：应用为 `['grouped-list', 'applications']`，参数为 `['grouped-list', 'parameters']`。`listId` 与 `service` 必须对应；未来增加租户或项目维度时也应将其纳入查询键。

其他组件先通过 `useQueryClient()` 取得客户端，在业务接口成功后调用：

```ts
await refreshGroupedList(queryClient, 'parameters');
```

`refreshGroupedList` 从 `src/features/grouped-list/queries.ts` 导入。React 外的调用方可导入 `src/lib/queryClient.ts` 的共享客户端。不要新建另一个 QueryClient，也无需取得列表 ref。右侧 `GroupedListRefreshButton` 就是一个独立调用示例。

- 缓存 30 秒内视为新鲜，切换页面优先复用；窗口聚焦不自动刷新。手动刷新不受这 30 秒限制。
- 已挂载的列表在后台刷新；未挂载的列表只标记过期，下次进入再请求。此函数返回不代表未挂载列表已完成请求。
- 保存和节点操作共用每种列表的 mutation key。写入期间暂停自动查询，外部刷新只标记过期；写入结束重新启用查询，合并刷新请求。
- 编辑草稿与查询缓存分离。编辑中允许外部刷新缓存，草稿保持不变；取消编辑接收最新缓存，保存继续执行最新服务端快照的冲突合并。
- 首次加载和刷新均显示列表 loading 遮罩，保留当前内容与草稿，并暂时阻止列表交互。外部按钮独立订阅请求计数，避免请求状态变化让整个布局重新渲染。
- 使用稳定 `select: toTreeData` 和默认结构共享；相同数据刷新后维持树引用，避免重建索引。查询错误在列表内展示，写入失败保留草稿。

### 节点操作的业务接入

两个页面使用同一个业务列表入口，分别传入自己的接口与操作：

```tsx
<GroupedListPage
  listId="parameters"
  config={config}
  service={parameterService}
  onSettings={handleParameterSettings}
  menuItems={[{ key: 'delete', label: '删除参数', danger: true, onClick: handleParameterDelete }]}
/>
```

- `service.load(signal)` 和 `service.save(nodes)` 对接清单/分组的获取与保存；应用和参数保留各自的响应转换和保存字段。
- `onSettings` / 菜单项 `onClick` 接收业务节点 `ListNode`，类型为 `ListNodeAction`。业务页面负责弹窗、确认、校验和实际接口，请返回等待整个操作结束的 Promise；取消时 resolve `false`，成功时 resolve `undefined`，失败时 reject。
- 列表在操作期间统一防重复点击，成功后重新查询清单和分组，取消不刷新，失败展示错误并保留当前数据。业务节点删除不调用分组删除或分组保存逻辑。
- 分组编辑期间禁用叶子设置快捷按钮和自定义菜单项，以保护尚未保存的草稿；分组重命名、移动和删除仍走共用逻辑。
- 参数页面已通过自定义菜单接入删除确认和删除接口，节点设置尚未实现；未传入 `onSettings` 时设置快捷按钮禁用，未配置 `menuItems` 时叶子菜单仅显示快速移动。

### 自定义更多操作菜单

`GroupedListPage` 的 `menuItems` 仅针对叶子节点，可传菜单数组，或按叶子 `ListNode` 返回菜单的函数。分组始终保留快速移动、重命名和删除，且不会调用菜单生成函数。叶子始终保留快速移动；其他操作全部由自定义项提供，不再内置设置、删除菜单项。不传、函数返回 `undefined` 或返回 `[]` 时均仅保留快速移动。

```tsx
<GroupedListPage
  listId="parameters"
  config={config}
  service={parameterService}
  menuItems={(node) => [
    {
      key: 'details',
      label: '查看详情',
      onClick: (current) => {
        showDetails(current);
        return false; // 只查看，不刷新列表
      },
    },
    {
      key: 'publish',
      label: '发布参数',
      disabled: node.maintType === '0',
      onClick: async (current) => {
        await publishParameter(current.key);
      },
    },
  ]}
/>
```

每项支持 `key`、`label`、`icon`、`disabled`、`danger` 和 `onClick`，key 在同一菜单中必须唯一。`onClick` 支持同步或异步，返回 `false` 不刷新，其他成功结果自动刷新，抛出错误时展示错误提示。操作期间统一防重复执行；编辑分组期间禁用自定义菜单项，避免刷新覆盖草稿。叶子左侧的设置快捷按钮仍由 `onSettings` 控制。

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

### 参数删除

参数叶子的更多菜单包含“快速移动”和“删除参数”。删除需要确认；取消不请求接口，失败显示错误，成功重新加载清单和分组。分组编辑期间禁用删除。

默认 Mock 使用 `DELETE /mock-api/parameters`，请求体为 `{ "key": "参数名称" }`，删除记录持久化到 `react-tree:mock:paramDbTypeGroupInfo:deletedItems`，刷新页面后仍生效；清除此存储项可恢复示例参数。分组存储不修改，列表合并时自动剔除已删除的叶子并保留分组。

配置 `VITE_LIST_API_BASE_URL` 后使用 `DELETE <baseUrl>/parameters`，请求体相同；后端需实现此接口，支持成功返回 204，非 2xx 响应作为失败处理。

### Axios 请求入口

真实接口和 Mock 接口统一通过 `src/lib/http.ts` 发起 Axios 请求，业务层直接获取响应数据。浏览器使用 XHR 适配器兼容 Mock.js；GET 查询继续传递 `AbortSignal`，PUT 和 DELETE 自动序列化 JSON，支持 204 响应。非 2xx 响应保留状态码错误提示，取消请求保持 Axios 取消错误，Mock 响应体中的业务错误仍会抛出。

### 列表性能与模拟数据

模拟接口与数据在第一次列表请求时动态加载；配置 `VITE_LIST_API_BASE_URL` 后不初始化 Mock.js 或生成模拟清单。默认应用列表仅包含 7 条示例。

压力测试可在 `.env.local` 中设置 `VITE_MOCK_APPLICATION_COUNT=50000`，重启开发服务器后生效。该配置仅影响模拟接口，不影响真实接口。

搜索使用延迟结果和按不可变叶子对象缓存的搜索文本；高亮、计数和展开状态使用同一搜索值。拖拽目标及可见子树边界随可见行重建索引，拖拽时直接查询。加载失败会保留已有列表并显示内联重试入口。
