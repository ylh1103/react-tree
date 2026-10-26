# 目录与模块边界

- 保持传统 Vite + React 顶层目录，不用 `features` 统一收纳业务文件；小模块保持简单，不为目录对称创建空目录，不增加页面或组件总 barrel。
- 页面使用 `src/pages/大驼峰页面名/index.tsx`，组件函数明确命名，业务页面按目录直接懒加载；页面私有组件、Hooks、类型和工具就近存放。
- `src/components` 只放项目内复用组件，允许业务语义；使用大驼峰目录和 `index.tsx` 入口，大型组件内部按 `components`、`hooks`、`model` 等职责组织，专用类型和工具就近存放。
- Axios 实例及通用请求、响应、错误处理放 `src/http`；业务地址、参数、响应和 HTTP 调用放 `src/api`。API 不依赖 Mock、React、Redux 或查询缓存，不按环境变量切换模拟接口。
- 查询键、缓存配置、刷新和列表服务组装放 `src/queries`；Mock 数据与处理放 `src/mocks`，由 `src/http` 的单一 adapter 按需加载接入。
- Redux Slice、全局 Hooks、Context、共享类型分别放 `src/store/slices`、`src/hooks`、`src/contexts`、`src/types`。
- 外壳和导航放 `src/layouts`，全局 Provider 放 `src/providers`；轻量路由骨架放 `src/components/RouteSkeleton`，`src/router/skeletons.tsx` 负责首次等待的外壳组装和启动交接，不依赖懒加载页面。

# UI 与样式

- 优先用 UnoCSS 工具类、变体和 shortcuts 表达布局、间距、颜色、状态、伪元素及响应式；能表达的样式不另写 CSS。使用设计/UI 等 skill 时同样适用，不新增样式文件。
- 沿用现有主题变量；页面、组件专用样式及局部重复组合就近维护，只有跨模块共享的组合或主题语义才进入 `uno.config.ts`。修改涉及的存量 theme/shortcuts 时，将局部配置迁回使用处。
- UnoCSS 无法合理表达时才使用最小范围的 CSS，并说明原因；专用 `@keyframes` 可内嵌在所属组件中，需在文档说明。
- 优先复用 Ant Design 控件及其属性（如 `Button`），不以原生元素重写已有控件的外观和交互；布局和必要尺寸调整用 UnoCSS。

# React、状态与请求

新增代码及本次涉及的存量重构须遵循 React、TanStack Query、React Router 和 Redux Toolkit 最佳实践及以下约束。

- 使用第三方 API 前核对实际安装版本及本地类型；有疑问查对应版本官方文档，不凭记忆或旧示例编码。不得新增 `@deprecated` API；替换时验证行为兼容性并运行项目现有 Lint，废弃标记仍须单独核对本地类型。
- 渲染保持纯净，不发请求、写存储或修改外部状态；派生状态直接计算，不用 Effect 维护副本，用户操作放事件处理函数。
- Effect 仅同步外部系统，依赖完整，清理监听、计时器和在途请求；使用稳定 key，不在父组件函数内定义组件。
- 仅在昂贵计算或实例稳定性有明确需求时使用 memo/useMemo/useCallback；保留长列表虚拟化和既有树模型，避免请求瀑布、重复遍历及无必要的全局订阅，以请求次数、渲染行为、测试和构建验证性能。
- 服务端系统、访问结果和业务清单归 TanStack Query；用户偏好和全局交互状态归 Redux；页面临时状态留在页面内。
- 查询键包含决定结果的系统、清单等维度；loader 与组件共享 query options 和唯一 QueryClient，signal 贯穿 HTTP 请求。
- 写入使用 mutation 或现有设置 thunk，正确失效相关查询；保留列表写入锁、设置串行保存、失败回退及取消后的旧响应保护。
- Redux 使用 Slice、类型化 Hooks 和字段级 selector，缩小订阅范围；reducer 纯净、状态可序列化，不存 Promise、AbortController、React 元素、Query 缓存或可推导权限。

# 路由与授权

- URL 是系统、平台和清单选择的唯一来源；应用、数据库路由及菜单图标分别在 `src/router/application.ts`、`src/router/database.ts` 维护，`routes.tsx` 统一装配，布局消费对应平台配置。
- 父子 loader 并行执行，每个受保护业务 loader 都须先等待 `requireSystemAccess`，不能依赖父 loader 授权。
- 系统访问校验使用 `queryClient.query` 传播失败，普通页面预取可消费错误并保留查询错误状态供页面重试；403 优先于旧数据并移除工作区 Outlet，404、取消和网络失败分别处理。HTTP 层只传播错误，不通过全局监听批量取消请求或清理业务缓存。
- 当前未接入登录与用户资料，不构造临时身份或恢复旧角色模型；访问以系统接口结果为准，不从负责人、姓名、员工类型或网络环境推导。接入真实后端时仍须由服务端校验授权。

# 兼容、注释与验证

- `userSetting` 保留编辑器 `theme`、`defaultCheckAllEnvTag` 及未知字段，平台主题用 `themeMode`；无效 JSON 不得被默认配置覆盖保存。
- 新增及实质重构模块须有中文职责说明；公共接口、关键类型、授权边界、缓存、并发、兼容行为和复杂交互说明用途与原因。注释随实现更新，不逐行复述或保留过时环境变量、Mock 说明。
- 代码修改完成运行相关测试、构建、Lint 和格式检查；纯文档修改检查内容与格式。不得通过删除失败断言或无依据重写稳定模型替代修复。
