# React + TypeScript + Vite

## 目录结构与放置约定

采用传统 Vite + React 目录结构，页面和复用组件使用大驼峰目录；页面入口为 `index.tsx`，入口组件仍保留明确的函数名称。路由按页面目录懒加载，不增加汇总所有页面的 barrel 文件。

```text
src/
├── main.tsx / App.tsx         # 启动和应用入口
├── pages/                    # SystemsHome、SystemApplications 等路由页面
│   └── SystemApplications/
│       ├── index.tsx
│       └── components/       # 仅供该页面使用的业务组件
├── components/               # 当前项目内跨页面复用的组件
│   ├── SplitPane/
│   ├── CollectionWorkspace/
│   ├── GroupedList/
│   │   ├── index.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── model/
│   │   └── types.ts
│   └── LayoutSettings/
├── http/                     # Axios 实例及通用请求、响应和错误处理
├── api/                      # 业务接口地址、参数、响应与 HTTP 调用
├── mocks/                    # 浏览器模拟接口和数据，保持按需加载
├── queries/                  # QueryClient、查询配置、刷新与列表服务组装
├── router/                   # 路由、loader、路径工具及静态页面骨架
├── layouts/                  # 页面外壳、导航、头部及设置抽屉
├── providers/                # 全局主题 Provider
├── store/                    # Redux 装配、typed hooks、slices 和配置同步
├── hooks/                    # 跨组件复用的 Hooks
├── contexts/                 # 系统工作区上下文
├── utils/                    # 跨模块复用的纯函数
├── types/                    # 系统、应用、参数与用户设置的数据约定
└── styles/                   # 全局样式与主题
```

- `pages` 只放路由页面及其私有实现；只服务于一个页面的组件和 Hooks 放在该页面目录内。
- `components` 的“通用”指当前项目内复用，允许分组列表等业务组件；组件专用的 Hooks、模型和类型就近放置，不全部提升到顶层目录。
- `http` 不包含业务接口地址；`api` 不依赖 React 组件或管理查询缓存。接口响应类型放 `types`，查询配置放 `queries`。
- 布局附属的设置抽屉放 `layouts`；用户设置页面和抽屉复用 `components/LayoutSettings`。
- 页面骨架放 `router/skeletons.tsx`，保持静态加载；不要将骨架移进对应页面的懒加载模块。
- 新增样式遵守 UnoCSS 和 Ant Design 约定；这次目录迁移只移动已有样式文件。

## 开发

全局配色维护于 `src/styles/theme.ts`，浅色使用 Ant Design 默认算法，暗色使用暗色算法与石墨灰表面 token，背景、内容面板和弹层逐级提亮，导航背景复用同一灰阶，激活态与 Ant Design 主按钮共用主色 token，悬停和按下使用主色深色阶。根据用户配置将对应配色写入根节点 CSS 变量，UnoCSS 与 Ant Design 组件及弹层同步切换主题；深色导航和品牌 Logo 保留各自的色彩。调整主题时统一修改该文件。

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
- `src/router/` 统一管理路由：`application.tsx` 定义应用参数路由，`database.ts` 定义数据参数路由，`routes.tsx` 组装站点与系统布局，`lazy.tsx` 提供页面懒加载，`index.ts` 创建路由实例；两个参数平台复用现有导航与 `SplitPane`。
- 未实现业务页面显示工作区框架；环境锁定、系统新增、成员管理不在本次范围。

### 数据接入

系统清单接口尚未提供，默认使用 `src/mocks/systems.ts`。配置 `VITE_SYSTEMS_API_URL` 后通过已有 `requestData` 发起 GET，请返回用户给定结构的 `SystemInfo[]`。该接口应只返回当前用户可访问的系统，未知角色仅显示“未知角色”，不推导操作权限。

应用和数据库参数类型清单复用 `VITE_LIST_API_BASE_URL` 下已有的 `/applications`、`/parameters` GET 接口，系统工作区额外传递 `systemName` 查询参数；后端需支持按系统过滤。未配置时复用现有清单 Mock。React Query 查询键包含系统维度，避免跨系统缓存复用。应用侧边栏支持分组保存，参数内容工作区仍为待接入框架；数据库类型清单只读。

部署时需将页面路由回退到 `index.html`，以支持刷新和直接访问。系统清单返回 403 时展示无权访问；名称不在清单内时显示系统不存在，不自动进入其他系统。

## 分组列表与数据库清单

- `pages/SystemApplications/components/ApplicationList.tsx`：当前接入的应用分组列表适配器，叶子 key / title 使用 `appName`，描述使用 `appDesc`。
- 应用侧边栏保留分组编辑、搜索、类型筛选、选中定位、虚拟滚动和拖拽。选中应用同步到 URL，右侧展示应用信息与参数内容框架。
- 数据库页面使用只读类型清单，不挂载旧参数分组列表、分组保存或删除入口。未配置真实接口时按需读取 `mocks/parameters.ts` 的示例数据。
- 系统应用列表的查询与写入键为 `['grouped-list', 'applications:<systemName>']` 和 `['grouped-list-write', 'applications:<systemName>']`；侧边栏与右侧共用查询结果。真实清单和分组接口的 GET / PUT 均携带 `systemName` 查询参数。
- 通用模型保留参数字段合并和 HTTP 删除契约的测试覆盖；这些工具的测试用途与实际页面是否接入相互独立。
- 最后一个列表订阅卸载时取消未完成的查询；加载失败通过列表内的错误提示重试。

### 页面结构与维护入口

树列表是参数/应用专用业务模块，UI 与交互模型集中在 `src/components/GroupedList/`，页面私有组件绑定各自的服务、业务配置和节点操作；接口、查询与 Mock 分别放在对应顶层目录。对外入口为 `index.tsx`，内部按组件、Hooks 和数据模型组织。

| 修改内容                                | 文件（相对于 `src/`）                                      |
| --------------------------------------- | ---------------------------------------------------------- |
| 列表整体流程、搜索、选中定位和虚拟滚动  | `components/GroupedList/index.tsx`                         |
| 节点行、分组/叶子展示、重命名和节点菜单 | `components/GroupedList/components/GroupedListRow.tsx`     |
| 工具栏、类型筛选和编辑按钮              | `components/GroupedList/components/GroupedListToolbar.tsx` |
| 查询、刷新和保存操作的状态              | `components/GroupedList/hooks/useGroupedList.ts`           |
| 编辑草稿、提交/回退和分组操作           | `components/GroupedList/hooks/useGroupEditing.tsx`         |
| 搜索展开、手动折叠和拖拽悬停展开        | `components/GroupedList/hooks/useTreeExpansion.ts`         |
| 拖拽命中、落点计算和拖拽事件            | `components/GroupedList/hooks/useDragDrop.ts`              |
| 树操作、索引、搜索与统计                | `components/GroupedList/model/treeUtils.ts`                |
| 数据合并、树格式转换和保存冲突          | `components/GroupedList/model/`                            |
| 组件配置、节点和回调类型                | `components/GroupedList/types.ts`                          |
| HTTP 列表接口、延迟初始化与接口契约     | `api/grouped-list/`                                        |
| 应用和参数列表服务组装                  | `queries/applications.ts`                                  |
| Mock 列表接口实现                       | `mocks/groupedList.ts`                                     |
| 复杂交互和 Ant Design 样式覆盖          | `components/GroupedList/GroupedList.css`                   |

基础布局、间距、文字和简单状态使用各组件中的 UnoCSS 类；需要手写的树列表 CSS 统一放在 `GroupedList.css`，由 `index.tsx` 引入，入口 `src/styles/index.css` 仅保留全局基础和应用框架样式。

排查一次操作时，从 `components/GroupedList/index.tsx` 的事件绑定进入；节点入口看 `GroupedListRow.tsx`，分组编辑看 `useGroupEditing.tsx`，接口请求看 `useGroupedList.ts`。标题、节点内容、预览等只在一处使用的组件保留为对应文件内的私有组件。

### 跨组件刷新与请求缓存

应用入口的 `QueryClientProvider` 使用 `src/queries/client.ts` 中的唯一客户端。列表使用 `src/queries/groupedList.ts` 统一管理查询键：应用为 `['grouped-list', 'applications']`，参数为 `['grouped-list', 'parameters']`。`listId` 与 `service` 必须对应；未来增加租户或项目维度时也应将其纳入查询键。

其他组件先通过 `useQueryClient()` 取得客户端，在业务接口成功后调用：

```ts
await refreshGroupedList(queryClient, 'parameters');
```

`refreshGroupedList` 从 `src/queries/groupedList.ts` 导入。React 外的调用方可导入 `src/queries/client.ts` 的共享客户端。不要新建另一个 QueryClient，也无需取得列表 ref。当前应用页面可用 `applicationListId(systemName)` 获取系统范围的列表标识。

- 缓存 30 秒内视为新鲜，切换页面优先复用；窗口聚焦不自动刷新。手动刷新不受这 30 秒限制。
- 已挂载的列表在后台刷新；未挂载的列表只标记过期，下次进入再请求。此函数返回不代表未挂载列表已完成请求。
- 保存和节点操作共用每种列表的 mutation key。写入期间暂停自动查询，外部刷新只标记过期；写入结束重新启用查询，合并刷新请求。
- 编辑草稿与查询缓存分离。编辑中允许外部刷新缓存，草稿保持不变；取消编辑接收最新缓存，保存继续执行最新服务端快照的冲突合并。
- 首次加载和刷新均显示列表 loading 遮罩，保留当前内容与草稿，并暂时阻止列表交互。外部按钮独立订阅请求计数，避免请求状态变化让整个布局重新渲染。
- 使用稳定 `select: toTreeData` 和默认结构共享；相同数据刷新后维持树引用，避免重建索引。查询错误在列表内展示，写入失败保留草稿。

### 节点操作的业务接入

当前应用列表使用复用的业务列表入口。其他列表后续接入时可按以下示例提供自己的配置、服务与节点操作（示例中的回调需由调用方实现）：

```tsx
<GroupedList
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
- 当前应用列表未接入节点设置和自定义业务菜单；未传入 `onSettings` 时设置快捷按钮禁用，未配置 `menuItems` 时叶子菜单仅显示快速移动。

### 自定义更多操作菜单

`GroupedList` 的 `menuItems` 仅针对叶子节点，可传菜单数组，或按叶子 `ListNode` 返回菜单的函数。分组始终保留快速移动、重命名和删除，且不会调用菜单生成函数。叶子始终保留快速移动；其他操作全部由自定义项提供，不再内置设置、删除菜单项。不传、函数返回 `undefined` 或返回 `[]` 时均仅保留快速移动。

```tsx
<GroupedList
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

应用列表在首次请求时动态加载 Mock.js，拦截 XMLHttpRequest 并模拟 200–500ms 延迟。接口定义位于 `src/api/applications.ts`，数据与初始化入口位于 `src/mocks/applications.ts`。

| 方法 | URL                             | 响应或请求体                           |
| ---- | ------------------------------- | -------------------------------------- |
| GET  | `/mock-api/applications`        | `[{ appName, appDesc, appType }]`      |
| GET  | `/mock-api/applications/groups` | `{ appGroupInfo: null 或 JSON字符串 }` |
| PUT  | `/mock-api/applications/groups` | `{ appGroupInfo: JSON字符串 }`         |

应用分组使用 localStorage 模拟持久化，系统工作区按系统名称隔离存储。数据库类型示例直接按需读取内存数据，不注册旧的参数分组或删除 Mock 接口。

设置 `VITE_LIST_API_BASE_URL=/api` 后使用真实接口：应用调用 `/api/applications` 和 `/api/applications/groups`，数据库类型调用 `/api/parameters`，系统工作区均携带 `systemName` 查询参数。后端地址、方法和响应包装在 `src/api/` 对应文件维护。

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

### Axios 请求入口

真实接口和 Mock 接口统一通过 `src/http/request.ts` 发起 Axios 请求，业务层直接获取响应数据。浏览器使用 XHR 适配器兼容 Mock.js；GET 查询继续传递 `AbortSignal`，PUT 和 DELETE 自动序列化 JSON，支持 204 响应。非 2xx 响应保留状态码错误提示，取消请求保持 Axios 取消错误，Mock 响应体中的业务错误仍会抛出。

### 列表性能与模拟数据

模拟接口与数据在第一次列表请求时动态加载；配置 `VITE_LIST_API_BASE_URL` 后不初始化 Mock.js 或生成模拟清单。默认应用列表仅包含 7 条示例。

压力测试可在 `.env.local` 中设置 `VITE_MOCK_APPLICATION_COUNT=50000`，重启开发服务器后生效。该配置仅影响模拟接口，不影响真实接口。

搜索使用延迟结果和按不可变叶子对象缓存的搜索文本；高亮、计数和展开状态使用同一搜索值。拖拽目标及可见子树边界随可见行重建索引，拖拽时直接查询。加载失败会保留已有列表并显示内联重试入口。

## 用户设置 mock 接口

开发与 preview 服务提供 GET /mock-api/user-settings 和 PUT /mock-api/user-settings，返回或接收 { "layoutMode": "default" | "compact", "themeMode": "light" | "dark" | "system" }。接口模拟 350ms 延迟，配置保存在服务端内存：刷新页面仍保留，重启服务后恢复默认。完整用户配置保存在服务端，抽屉开关只保存在当前页签的 Redux。浏览器仅缓存服务端已确认的主题模式，刷新时先为首屏和路由骨架提供同一配色，配置加载完成后以服务端返回为准；跟随系统模式每次启动按当前系统外观解析。

可用 X-Mock-Error: load 或 X-Mock-Error: save 请求头模拟 503 读取或保存失败。读取失败可重试；修改布局或主题立即生效，保存失败会恢复已保存的配置并允许重试。用户设置抽屉和用户设置页面均可切换浅色／暗色／跟随系统模式；旧接口未返回 themeMode 时兼容为浅色。保存请求始终携带完整布局和主题配置，避免相互覆盖。

同源页签通过 BroadcastChannel 接收保存成功通知并在后台重新读取当前用户配置；不支持时回退到 localStorage 的 storage 事件（此同步键只存通知标记，不存配置）。切回页签或从页面缓存恢复时补读配置。读取和保存期间合并通知，旧读取响应不会覆盖后续的本地保存；后台同步失败保留现有配置，下次通知或切回页签时重试。

后续设置 VITE_USER_SETTINGS_API_URL 即可切换到真实用户设置接口，沿用相同的请求格式。生产静态部署需提供该后端接口或配置真实地址。

页面资源加载骨架通过 `src/router/loading.ts` 的 `pageLoading` 注册，骨架组件放在 `src/router/skeletons.tsx` 或独立的页面骨架模块中，并静态导入：

```tsx
{
  path: 'example',
  ...pageLoading(ExampleSkeleton),
  lazy: lazyPage(() => import('../pages/Example')),
}
```

不传组件时使用通用骨架。首次进入由 `HydrateFallback` 显示骨架；同一布局内导航由 `RouteOutlet` 显示目标页面的骨架。骨架应在页面代码加载之前可用，因此不要放进同一个懒加载模块。页面接口数据加载可复用同一个骨架，由页面自身的查询状态控制。
