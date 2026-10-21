# 灵动参数管家

参数管理平台，目标是实现应用参数与数据库参数发布的自动化、可视化和版本管理。当前版本先实现系统入口、创建系统、接口错误处理及工作区模板，为后续参数发布业务提供清晰基础。

## 启动与验证

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm lint
pnpm format:check
```

使用 Vite、React 19、TypeScript、Ant Design、UnoCSS、React Router、TanStack Query 和 Redux Toolkit。版本以 package.json 和 pnpm-lock.yaml 为准，本次不升级主要依赖。

## 业务范围

本期保留系统列表、创建系统、应用分组列表和数据库类型清单。应用参数、搜索、检查、异常项、比对等入口保留；发布、审批及版本管理暂不实现。

原有登录与用户资料代码已删除，等待后续重新设计。应用不读取会话、Cookie、个人角色或员工信息，也不构造临时用户。系统接口仍传播 403、404 和网络错误，页面不以负责人等业务资料推导访问资格。

开发环境的“参数项”页面保留原有 Loading 效果图库，保留的页面数据加载和平面方案在同一网格中完整展示，不按 Tab 或分段控件筛选；生产环境仍显示参数项占位工作区。演示代码与组件专用动画保留在原有目录中。

## 显示偏好

主题、布局、圆角和图标显示等偏好独立保留，通过页头的“显示设置”按钮打开；Store 只注册 preferences Slice。启动时读取一次配置，失败后使用回退显示并提供独立重试，不需要登录前置步骤。

### 完整配置保存

`userSetting.theme` 是后续参数编辑器主题，原样保存，不影响平台主题。`themeMode` 驱动平台浅色、暗色和跟随系统，缺失时使用现有默认值。`defaultCheckAllEnvTag` 和未知字段均保留。

首屏配色在 HTML 头部同步执行，先于外部 JS/CSS 加载，避免慢网络下出现默认白色画布。Vite 插件从现有主题生成背景与文字颜色，并与 Store 共用缓存键及校验规则；这里只直接设置最小根节点样式，因为 UnoCSS 此时尚未下载，不新增样式文件。React 接管后仍通过原有主题变量更新页面。

React 阶段由 `AppThemeProvider` 在首次提交时补齐完整主题变量，随后响应配置、圆角预览及系统外观变化；`main.tsx` 只安装缓存和同步订阅，不再额外应用一次完整主题。HTML 与 Store 各读一次相同缓存：前者决定提前显示的颜色，后者保留用户的 `system` 等原始选择，不能用 HTML 中已解析的浅色/暗色替代它。

构建插件源码位于 `build/`，现有测试位于 `scripts/`。生产部署仅发布 `pnpm build` 生成的 `dist/`；插件在构建时将最小主题脚本写入 HTML，不将构建工具或测试文件复制到产物。

主题脚本通过 Vite 的 HTML 标签注入接口自动放入头部，不依赖模板里的注释标记。UTF-8 声明由插件统一放在脚本之前，删除或调整原有声明也不会破坏首屏注入；配色执行失败时由正式应用主题接管。

`parameter-management:bootstrap-theme:v1` 保存当前浏览器最近一次确认的主题，设置接口读取成功后校准。乐观值、配置损坏和读取失败不覆盖缓存，`system` 原样保存。

首次初始化、重试和后台同步使用 `GET /api/user-settings`，保存使用 `PUT`，不传递个人身份参数。保存前读取完整 `userSetting` 文档，再合并平台字段，保留编辑器设置及未知字段；非法 JSON 禁止覆盖。

设置保留即时预览、乐观更新、串行保存、失败回退和显式重试。跨页签只广播显示设置变更通知，接收方重新读取接口，不广播配置正文。取消在途请求时也会拦截尚未发送的排队写入。

用户设置抽屉按「外观」和「布局」分组：外观包含主题、导航配色和数据加载图标，布局包含布局模式、间距与圆角、菜单显示。标签内容独立滚动，标签栏和保存反馈保持可见；无遮罩抽屉使用非模态语义，允许键盘返回背景。滑块只在完成交互后保存，数值输入在失焦或按回车后提交，紧凑布局说明会保留并展示标准布局已保存的间距。所有布局样式沿用 UnoCSS，没有新增样式表。

## 系统列表与创建

首页 `/` 展示系统列表，保留英文名、中文名、架构编码搜索、卡片/列表切换、分页和刷新。已移除“我的系统”、个人角色筛选、用户头像和退出菜单。

系统显示名称、描述、架构编码、重要性、负责人、应用数与参数类型数。`systemDesc` 虽为 HTML 字符串，只提取文本展示。`systemCharges`、`approverCharge`、`ownRoom` 和 `ownGroup` 保留为系统业务资料，不再与当前访问者关联。

新增系统使用 Modal + Form，英文名、中文名、架构编码必填；描述、科室、室组、重要性和审批人可选。不从用户资料自动填写负责人，也不生成成员关系或角色。

模拟服务保留去除首尾空格、必填及重复校验，重复英文名或架构编码返回 409。成功后刷新系统列表，新系统的应用及参数类型数量为 0。失败保留输入，提交中防止重复提交。

## 架构与路由

```text
src/
  api/          业务接口地址、请求参数、HTTP 调用
  http/         Axios、Mock 接入点、取消、HTTP 错误
  queries/      查询键、缓存、失效和列表服务组装
  mocks/        场景、模拟数据、接口响应、版本化存储
  store/        Redux 装配、显示偏好同步
    slices/     preferences Slice
  pages/        大驼峰页面目录及私有组件
  components/   项目内复用组件，复杂组件内部按职责拆分
  layouts/      页面外壳、导航和用户设置抽屉
  providers/    全局 Provider
  router/       路由配置、loader、懒加载、静态骨架
  hooks/        全局 Hooks
  contexts/     已校验的系统工作区上下文
  types/        共享业务类型
```

不创建 features 总目录或页面/组件汇总 barrel。详见 AGENTS.md。

### 单一配置

`src/router/config.ts` 是系统业务路由与菜单的唯一配置，定义路径、菜单地址、标题、图标、平台、设置动作、懒加载页面及需要的 loader。导航从该配置派生，UnoCSS safelist 同步读取图标。配置不静态导入页面或 Store。

`routes.tsx` 装配根、站点和系统布局；`workspace.ts` 将定义转换为原生 RouteObject，保留静态骨架和错误边界。设置菜单显式声明打开抽屉，不根据字符串后缀判断行为；对应设置页面路径仍可直接访问。

| 路径                                                           | 用途                 |
| -------------------------------------------------------------- | -------------------- |
| `/`                                                            | 系统列表             |
| `/systems/:systemName`                                         | 默认跳转总览         |
| `/systems/:systemName/overview`                                | 应用平台总览         |
| `/systems/:systemName/application/:appName?`                   | 应用清单与选中应用   |
| `/systems/:systemName/db/:paramTypeName?`                      | 数据库类型与选中类型 |
| `/systems/:systemName/setting`、`db/setting`                   | 设置页面             |
| 系统下 params/search/inspect/exception/compare/apps-comparison | 后续业务占位         |

系统、应用和类型动态段统一 encodeURIComponent。`setting` 是数据库保留名称。切换系统或平台进入目标平台默认页，不带旧选中项。URL 是选择状态的唯一来源。部署服务需回退至 index.html 以支持刷新深链接。

### 授权先于业务请求

父子 loader 会并行运行，不能认为父路由已完成校验。`requireSystemAccess` 是共享入口，系统父 loader 和应用/数据库业务 loader 均先等待校验，再预取业务。

授权用 `fetchQuery` 传播错误，不能用会吞掉失败的普通预取结果放行。同次导航共用在途授权请求，每次新导航获取新鲜授权；窗口恢复焦点也重新校验当前系统。

接口返回 404 或 403 时展示对应状态，其他错误提供重试。403 优先于旧缓存，立即移除 Outlet，取消并清除对应系统清单。不再在前端根据用户信息推导资格。

### 状态与性能

Redux 管偏好和抽屉；Query 管系统列表、系统访问结果、应用与数据库类型；筛选、分页和创建表单留在页面。系统数据不复制到 Redux。

查询键使用系统和清单维度，loader、页面和侧栏共用唯一 QueryClient 与 query options。业务列表默认短时缓存，授权不使用过期缓存放行。查询 signal 传递给 Axios 与 Mock，写入后准确失效相关清单。

React 渲染纯净，不用 Effect 同步重复状态；外部订阅正确清理，selector 只订阅所需字段，不机械添加 memo。保留既有页面懒加载、分组虚拟滚动及列表写入锁，避免无依据重写树模型。

### Slice 与 thunk 接入

`src/store/index.ts` 负责注册 Slice 和创建 Store，沿用 Redux Toolkit 默认中间件，不配置 `extraArgument`。thunk 直接从 `src/api` 导入业务接口；请求地址、参数和 HTTP 调用留在 API 层，请求去重、取消及保存时序由 thunk 协调。

新增带 thunk 的 Slice 时，在 Store 注册 reducer，并使用 `src/store/createAppAsyncThunk.ts` 导出的 `createAppAsyncThunk`。它统一提供自动推导的 `RootState` 和 `AppDispatch`，支持 thunk 内派发其他 thunk；业务特有的 `rejectValue` 等类型在单个 thunk 上声明。该入口只配置类型，不封装业务流程。

创建 Store 仅接受启动显示选项，例如指定接口读取前的主题：

```ts
const store = createAppStore({
  themeMode: 'dark',
});
```

状态流程测试使用 Node 原生方法 mock 替换设置 API，并在测试结束后自动恢复；生产 Store 不提供测试服务注入参数。测试中的多个 Store 共用 API 实现，与多个页签访问同一个后端一致。偏好的保存队列与在途请求仍按 Store 隔离，取消一个 Store 不影响另一个。HTTP 与完整配置文档的契约测试继续调用实际接口实现。

默认的不可变与可序列化检查保持开启。启动主题只设置初始显示，不触发请求或保存。新增服务端业务清单继续由 TanStack Query 管理，不因支持 thunk 就复制到 Redux。

### ahooks 使用边界

局部交互使用 ahooks：`useEventListener` 管理拖拽、分栏快捷键及设置抽屉外部点击的监听生命周期，处理器读取最新状态，避免因闭包变化反复绑定；`useDebounceFn` 管理分栏悬停、列表定位高亮、拖拽悬停展开和保存提示的延迟任务，目标变化、关闭或卸载时取消；`useSize` 观察分栏容器，`useRafState` 合并横向滚动范围的同帧更新。保留拖拽末帧提交、焦点恢复与既有虚拟树模型。

主题外部订阅、工具栏多元素首帧测量、路由骨架按导航标识重计时，以及 HTTP 层的非组件监听继续保留原生实现。列表锁在重复提交时需要明确报错，不能直接替换成会静默跳过的 `useLockFn`；多列滚动范围仍需观察子元素，不能只用容器 `useSize` 推导。

统一从 `ahooks` 公共入口命名导入，兼容现有 Node/Vite SSR 测试环境；生产构建按需移除未使用导出。服务端请求、授权和缓存继续使用 TanStack Query，偏好保存继续使用现有 Redux 串行保存流程。

## HTTP 与 Mock 契约

所有 API 使用正常 Axios 请求，没有 `VITE_*` 控制真实/模拟调用。HTTP 层的 mockAdapter 是唯一接入点，按类别动态加载模拟模块，返回正常数据和 HTTP 状态。显式绝对 URL 走原生适配器，供真实 HTTP 契约测试使用。

| 方法与地址                                    | 请求/响应                                    |
| --------------------------------------------- | -------------------------------------------- |
| `GET /api/user-settings`                      | `{ userSetting: string }`                    |
| `PUT /api/user-settings`                      | 请求与响应均为完整 `{ userSetting: string }` |
| `GET /api/systems`                            | 系统数组                                     |
| `POST /api/systems`                           | 创建字段；响应创建后的系统                   |
| `GET /api/systems/:systemName/access`         | 系统信息或接口错误                           |
| `GET /api/applications?systemName=...`        | 应用数组                                     |
| `GET /api/applications/groups?systemName=...` | `{ appGroupInfo: string                      | null }` |
| `PUT /api/applications/groups?systemName=...` | `{ appGroupInfo: string }`；204              |
| `GET /api/parameters?systemName=...`          | 数据库类型数组                               |

Mock 配置位于 `src/mocks/config.ts`，只包含请求延迟、应用数量和系统访问接口错误，不包含用户场景或成员关系。`systemAccessError` 可设为 403、503 或 null，用于验证接口错误处理。

系统、分组和显示设置使用版本化 localStorage，分组按系统隔离，显示偏好保存到独立文档；禁用存储时回退内存。新系统返回空清单，系统统计与实际 Mock 数据一致。

`X-Mock-Error: load/save` 可模拟设置读取或保存失败；重复创建返回 409，不存在返回 404，尚未接入的删除明确返回失败。

接真实后端时，在 `src/http/request.ts` 将 adapter 改回 `['xhr', 'http']`，在 api 中调整实际地址和响应包装。登录业务由后续方案重新接入，不复用已删除的身份模型。

## 应用列表维护

GroupedList 的 UI、Hooks 和树模型在 `src/components/GroupedList`，页面私有 ApplicationList 绑定系统服务和业务配置。API 只维护清单/分组契约，queries 组装服务与缓存；不要让接口层依赖树 UI。

应用侧栏保留搜索、类型筛选、分组编辑、拖拽、选中定位和虚拟滚动，叶子使用 appName；右侧读取相同合并清单，分组不作为应用。数据库只读类型清单，不接旧参数分组或删除。

分组读写与刷新按系统和清单共用查询键及写入锁。写入期间暂停清单刷新，保存完成统一失效；显式刷新调用 queries/groupedList.ts 的 refreshGroupedList，而不是另建 QueryClient。清单失败有重试，最后订阅卸载时取消读取。

## 样式、注释与验收

布局与控件优先 UnoCSS 和 Ant Design。全局主题只保留跨模块颜色、间距、圆角等语义；单个页面/组件的组合直接写工具类或私有常量。同一局部多次使用不等于全局复用。

品牌动画的专用关键帧在所属组件 model/animations.ts，就近内嵌最小 `<style>`；原因是 @keyframes 无法通过普通工具类定义。动画属性和减少动态效果仍使用 UnoCSS，不新增 CSS 文件。现有 GroupedList.css 保留其现有复杂交互职责。

参数项图库保留 5 款加载方案，默认预览「品牌描边」（`trace`），按当前展示顺序连续编号；所有方案共用暂停、全局主题与 24/32/48/64px 尺寸预览。

用户设置的「外观 → 数据加载图标」与图库共用 `src/components/LoadingIndicator/model/styles.ts` 清单，可选择品牌描边、数据脉冲、点阵汇聚、彗尾流转和分合回弹。`loadingStyle` 使用稳定标识持久化，旧配置缺失时默认使用品牌描边（`data-trace`）；选择立即应用到全局 Ant Design Spin，并沿用设置串行保存、失败回退、重试、跨页签同步与恢复默认流程。图库预览保持独立，不修改用户偏好。

所有新增/实质重构模块添加中文职责说明；公共接口、关键类型、权限边界、缓存、并发与兼容行为解释原因，注释随实现更新。

回归重点：无用户信息依赖的启动与深链接、接口错误处理、创建与重复校验、设置字段保留及串行保存、取消后旧响应不恢复缓存、导航一致、生产图标、分组拖拽/虚拟化/分栏/主题。运行测试、构建、Lint、格式检查，并通过浏览器验证首页、创建、空状态、403 和两类工作区。
