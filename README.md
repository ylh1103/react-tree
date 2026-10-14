# 灵动参数管家

参数管理平台，目标是实现应用参数与数据库参数发布的自动化、可视化和版本管理。当前版本先实现登录身份、系统入口、创建系统、访问控制及工作区模板，为后续参数发布业务提供清晰基础。

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

## 业务范围与角色

本期实现我的系统、所有系统、创建系统、系统访问校验、应用分组列表和数据库类型清单。应用参数、搜索、检查、异常项、比对等入口保留；发布、审批、版本管理、加入申请和成员管理暂不实现。

开发环境的“参数项”页面保留原有 Loading 效果图库，包括页面数据加载、3D 和平面方案；生产环境仍显示参数项占位工作区。演示代码与组件专用动画保留在原有目录中。

| 信息                    | 编码                                   | 行为                                             |
| ----------------------- | -------------------------------------- | ------------------------------------------------ |
| 平台角色 userType       | `0` 平台人员；`1` 普通用户             | 平台人员可进入所有系统；普通用户只能进入成员系统 |
| 系统角色 role           | `V` 观察者；`D` 开发者；`R` 系统负责人 | 本期展示身份，不区分系统内操作权限               |
| 员工类型 cmbUserType    | `1`、`2` 正式员工；其他外包            | 仅展示，不影响创建或访问                         |
| 网络 netEnv             | `0` 办公网；`1` 互联网；`2` 业务网     | 仅展示，不附加访问限制                           |
| 系统重要性 sysRiskLevel | `A`、`B`、`C`、`D`                     | 可选，未配置不默认归为 D                         |

| 操作                           | 平台人员 | 普通用户                 |
| ------------------------------ | -------- | ------------------------ |
| 查看我的系统、所有系统公开资料 | 可以     | 可以                     |
| 创建系统                       | 可以     | 可以                     |
| 进入成员系统                   | 可以     | 可以                     |
| 进入非成员系统                 | 可以     | 不可以                   |
| 使用已接入的应用分组操作       | 可以     | 成员可以，暂不区分 V/D/R |

“我的系统”始终表示真实成员关系。平台人员访问非成员系统时成员角色为空，显示平台身份，不伪造 R。负责人、审批人字符串不参与权限推导。真实后端必须执行同样的授权检查；前端拦截只负责导航和交互。

## 登录与用户设置

### 会话流程

启动及深链接访问都先调用 `GET /api/session`，模拟 SSO 已完成。返回值保留以下字符串字段：

```ts
interface SessionUser {
  expireTime: string; // Unix 秒，Mock 根据当前时间生成
  userSetting: string; // 完整 JSON 字符串
  openId: string;
  ystId: string;
  employeeId: string;
  netEnv: '0' | '1' | '2';
  userType: '0' | '1';
  userName: string;
  department: string;
  cmbUserType: string;
}
```

身份存放 Redux session Slice，不从 localStorage 恢复授权。并发 loader 共用登录初始化 Promise，Promise 和取消控制器只保存在协调层。刷新重新获取用户，成功后用登录响应初始化偏好，不额外重复读取设置。

会话到期或 HTTP 401 时移除工作区，取消在途请求、清理 Query 缓存及旧偏好。退出登录同样清理本地会话；“重新获取会话”重新调用模拟 API，真实 SSO 跳转、登出协议及认证回调由后续接入完成。

### 完整配置保存

`userSetting.theme` 是后续参数编辑器主题，原样保存，不影响平台主题。`themeMode` 驱动平台浅色、暗色和跟随系统，缺失时使用现有默认值。`defaultCheckAllEnvTag` 和未知字段均保留。

首次使用登录返回配置；`GET /api/user-settings` 用于后台同步，`PUT` 保存完整 JSON。保存前读取当前完整文档，再合并布局字段，避免覆盖未使用的配置。保存响应同步更新会话中的原始文档。

设置保持即时预览、乐观更新、串行保存、失败回退和显式重试。无效 JSON 展示警告、使用默认界面设置，并禁止覆盖保存；重新读取有效文档后恢复编辑。跨页签同步按用户隔离，只广播变更通知；接收方重新读取，不广播个人信息。

## 系统列表与创建

首页 `/` 默认“我的系统”，可切到“所有系统”，保留英文名、中文名、架构编码搜索，卡片/列表、分页、刷新。角色筛选只出现在我的系统。

系统显示名称、描述、架构编码、重要性、负责人、应用数与参数类型数。`systemDesc` 虽为 HTML 字符串，只提取文本展示，不直接注入页面。`systemCharges`、`approverCharge` 沿用 `姓名/编号` 逗号分隔，`ownRoom`、`ownGroup` 沿用 `编号/名称`。

我的系统返回公共字段及 `ystId`、`role`；所有系统返回公共字段、`userRelation`、`appGroupInfo`、`paramDbTypeGroupInfo`，不要求提供成员角色。`userRelation` 是成员关系，不等于平台人员能否进入。

普通用户未加入的系统仍可浏览资料，工作区按钮禁用并说明原因，展示负责人。本期不提供加入申请。新用户空状态提供新增系统和查看所有系统；筛选无结果与加载失败分别处理。

新增系统使用 Modal + Form，英文名、中文名、架构编码必填；描述、科室、室组、重要性和审批人可选。负责人是当前用户，不允许表单指定角色、创建者或数量。组织用编号/名称输入，审批人用姓名/编号输入行，提交转换为现有字符串格式。

英文名、中文名和架构编码去除首尾空格；模拟服务校验英文名或架构编码重复，返回 409。成功后创建者成为 R，加入我的系统，应用及类型数量为 0，刷新两类列表并切回我的系统。失败保留输入，提交中防止重复提交。

## 架构与路由

```text
src/
  api/          业务接口地址、请求参数、HTTP 调用
  http/         Axios、Mock 接入点、取消、HTTP 错误
  queries/      查询键、缓存、失效和列表服务组装
  mocks/        场景、模拟数据、接口响应、版本化存储
  store/        Redux 装配、会话协调、偏好同步
    slices/     session 与 preferences Slice
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

父子 loader 会并行运行，不能认为父路由已完成校验。`requireSession` 和 `requireSystemAccess` 是共享入口，系统父 loader 和应用/数据库业务 loader 均先等待校验，再预取业务。

授权用 `fetchQuery` 传播错误，不能用会吞掉失败的普通预取结果放行。同次导航共用在途授权请求，每次新导航获取新鲜授权；窗口恢复焦点也重新校验当前系统。

不存在返回 404，无资格返回 403，未认证返回 401，网络错误提供重试。403 优先于旧缓存，立即移除 Outlet，取消并清除对应系统清单。列表按钮禁用和直接路由访问使用同一业务规则。

### 状态与性能

Redux 管会话、偏好和抽屉；Query 管两类系统列表、授权、应用与数据库类型；筛选、分页和创建表单留在页面。系统数据不复制到 Redux。

查询键使用用户与系统维度，loader、页面和侧栏共用唯一 QueryClient 与 query options。业务列表默认短时缓存，授权不使用过期缓存放行。查询 signal 传递给 Axios 与 Mock，写入后准确失效相关清单。

React 渲染纯净，不用 Effect 同步重复状态；外部订阅正确清理，selector 只订阅所需字段，不机械添加 memo。保留既有页面懒加载、分组虚拟滚动及列表写入锁，避免无依据重写树模型。

## HTTP 与 Mock 契约

所有 API 使用正常 Axios 请求，没有 `VITE_*` 控制真实/模拟调用。HTTP 层的 mockAdapter 是唯一接入点，按类别动态加载模拟模块，返回正常数据和 HTTP 状态。显式绝对 URL 走原生适配器，供真实 HTTP 契约测试使用。

| 方法与地址                                    | 请求/响应                                    |
| --------------------------------------------- | -------------------------------------------- |
| `GET /api/session`                            | SessionUser                                  |
| `GET /api/user-settings`                      | `{ userSetting: string }`                    |
| `PUT /api/user-settings`                      | 请求与响应均为完整 `{ userSetting: string }` |
| `GET /api/systems/mine`                       | 我的系统数组                                 |
| `GET /api/systems`                            | 所有系统数组                                 |
| `POST /api/systems`                           | 创建字段；响应创建后的成员系统               |
| `GET /api/systems/:systemName/access`         | 已授权系统，role 可为空                      |
| `GET /api/applications?systemName=...`        | 应用数组                                     |
| `GET /api/applications/groups?systemName=...` | `{ appGroupInfo: string                      | null }` |
| `PUT /api/applications/groups?systemName=...` | `{ appGroupInfo: string }`；204              |
| `GET /api/parameters?systemName=...`          | 数据库类型数组                               |

Mock 场景在 `src/mocks/config.ts` 设置：platform 为默认平台用户，member 为普通成员，new-user 没有初始系统，contractor 为外包成员，expired 返回失效会话。延迟和应用数量使用显式配置；压力测试直接传数量给生成函数。

模拟成员角色包含 D、R、V。创建系统、成员关系、分组和设置使用 `react-tree:mock:v2:` 前缀的版本化 localStorage，设置按用户、分组按系统隔离；禁止存储身份作为授权来源。禁用存储时回退内存。新系统返回空清单，系统统计与实际 Mock 数据一致。

`X-Mock-Error: load/save` 可模拟设置读取或保存失败；重复创建返回 409，受保护接口也模拟 401/403/404。尚未接入的删除仍明确失败，不展示成功假象。

接真实后端时，在 `src/http/request.ts` 将 adapter 改回 `['xhr', 'http']`，在 api 中调整实际地址和响应包装，再接入真实 SSO。无需修改页面或给各业务 API 增加环境变量分支。

## 应用列表维护

GroupedList 的 UI、Hooks 和树模型在 `src/components/GroupedList`，页面私有 ApplicationList 绑定系统服务和业务配置。API 只维护清单/分组契约，queries 组装服务与缓存；不要让接口层依赖树 UI。

应用侧栏保留搜索、类型筛选、分组编辑、拖拽、选中定位和虚拟滚动，叶子使用 appName；右侧读取相同合并清单，分组不作为应用。数据库只读类型清单，不接旧参数分组或删除。

分组读写与刷新按用户和系统共享身份。写入期间暂停清单刷新，保存完成统一失效；显式刷新调用 queries/groupedList.ts 的 refreshGroupedList，而不是另建 QueryClient。清单失败有重试，最后订阅卸载时取消读取。

## 样式、注释与验收

布局与控件优先 UnoCSS 和 Ant Design。全局主题只保留跨模块颜色、间距、圆角等语义；单个页面/组件的组合直接写工具类或私有常量。同一局部多次使用不等于全局复用。

品牌动画的专用关键帧在所属组件 model/animations.ts，就近内嵌最小 `<style>`；原因是 @keyframes 无法通过普通工具类定义。动画属性和减少动态效果仍使用 UnoCSS，不新增 CSS 文件。现有 GroupedList.css 保留其现有复杂交互职责。

所有新增/实质重构模块添加中文职责说明；公共接口、关键类型、权限边界、缓存、并发与兼容行为解释原因，注释随实现更新。

回归重点：权限矩阵与深链接、授权前无业务请求、会话与权限失效不恢复旧缓存、新用户创建、重复校验、设置字段保留与串行保存、导航一致、生产图标、分组拖拽/虚拟化/分栏/主题。运行测试、构建、Lint、格式检查，并通过浏览器验证首页、创建、空状态、403 和两类工作区。
