# 项目目录约定

- 保持传统 Vite + React 顶层目录，不使用 `features` 按业务统一收纳所有文件。
- 路由页面使用 `src/pages/大驼峰页面名/index.tsx`，组件函数保留明确名称；路由直接按页面目录懒加载。
- 页面私有组件、Hooks 和工具放在对应页面目录内；`src/components` 只放当前项目内复用的组件，允许包含业务语义。
- 复用组件使用大驼峰目录和 `index.tsx` 入口；大型组件的内部实现按 `components`、`hooks`、`model` 等职责组织，专用类型和工具就近存放。
- Axios 实例及通用请求、响应和错误处理放 `src/http`；业务接口地址、参数和请求调用放 `src/api`，API 不依赖 React 组件或查询缓存。
- 查询键、缓存配置、刷新和列表服务组装放 `src/queries`；模拟接口与数据放 `src/mocks`，保留按需加载。
- Redux Slice 放 `src/store/slices`；全局 Hooks、Context、共享数据类型分别放 `src/hooks`、`src/contexts`、`src/types`。
- 页面外壳和导航放 `src/layouts`，全局 Provider 放 `src/providers`；静态路由骨架放 `src/router/skeletons.tsx`，不要并入懒加载页面。
- 小模块保持简单，不为目录对称创建空目录，也不要增加汇总所有页面或组件的 barrel 文件。

# 项目样式约定

- 优先使用 UnoCSS 实现样式，包括布局、间距、颜色、交互状态、伪元素和响应式规则。
- 能用 UnoCSS 工具类、变体或 shortcuts 实现的样式，不额外定义 CSS，也不要新增 CSS 文件。
- 使用设计、UI 或其他 skill 调整界面时，同样遵守以上规则；不要因 skill 的默认示例而生成新的样式表。
- 重复的工具类组合可提取到现有 `uno.config.ts` 的 shortcuts；沿用现有主题变量。
- 优先复用 Ant Design 组件；按钮等已有对应组件的控件使用 `Button` 等组件及其属性，不自行用原生元素重写外观和交互。布局与必要的尺寸调整使用 UnoCSS。
- 只有 UnoCSS 无法合理表达的样式才考虑最小范围的 CSS，并说明原因。

# React、Query、Router 和 Redux 强制约束

- 新增代码与本次涉及的存量重构都必须遵循 React、TanStack Query、React Router 和 Redux Toolkit 最佳实践，不只约束新文件。
- React 渲染保持纯净；不要在渲染期间发请求、写存储或修改外部状态。派生状态直接计算，不用 Effect 维护重复状态；用户操作逻辑放事件处理函数。
- Effect 仅用于外部系统同步，依赖完整，并清理监听、计时器及在途请求；保持稳定 key，不在父组件函数内定义组件。
- 缩小 Redux selector 的订阅范围；不机械添加 memo/useMemo/useCallback，只在昂贵计算或实例稳定性有明确需求时使用。
- 页面懒加载、模拟数据按需加载；长列表保留虚拟化和既有树模型。避免请求瀑布、重复遍历和无必要的全局订阅，以请求次数、渲染行为、测试及构建验证性能。
- 服务端系统、授权和业务清单归 TanStack Query；登录会话、用户偏好和全局交互状态归 Redux；页面临时状态留在页面内。
- Query 查询键包含决定结果的用户及系统维度；loader 与组件共享 query options 和唯一 QueryClient，signal 贯穿 HTTP 请求。
- 写入使用 mutation 或现有设置 thunk，正确失效相关查询；保留列表写入锁、串行保存及失败回退。身份变化或授权撤销时取消请求并清理缓存，旧响应不得恢复数据。
- Redux 使用 Slice、类型化 Hooks 和字段级 selector；reducer 保持纯粹，状态可序列化，不保存 Promise、AbortController、React 元素或 Query 缓存，不重复存储可推导权限。
- URL 是系统、平台及清单选择的唯一来源。业务路由、菜单和图标在 src/router/config.ts 维护，布局只消费派生导航。
- React Router 父子 loader 并行执行；每个受保护业务 loader 必须先等待 requireSystemAccess，不能认为父 loader 已经授权。
- 权限校验传播失败，不能使用吞掉错误的 prefetchQuery 结果授权；区分 401、403、404、取消和网络失败。
- 平台角色与服务端成员关系决定访问，不从负责人字符串、姓名、员工类型或网络环境推导权限。V/D/R 本期不区分系统内操作。

# API、Mock 和注释约束

- src/api 只维护地址、参数、响应和正常 HTTP 调用，不导入 Mock、React、Redux 或查询缓存，不根据环境变量切换模拟接口。
- Mock 由 src/http 的单一 adapter 接入，模拟数据和处理在 src/mocks 按需加载；真实后端也必须执行授权校验。
- userSetting 保留编辑器 theme、defaultCheckAllEnvTag 和未知字段，平台主题使用 themeMode；无效 JSON 不得被默认配置覆盖保存。
- 所有新增与实质重构模块必须有中文职责说明；公共接口、关键类型、授权边界、缓存、并发、兼容行为和复杂交互必须说明用途及原因。
- 注释与实现同步维护，不逐行复述代码，不保留过时环境变量和 Mock 行为说明。
- 单个页面或组件专用样式在使用处或私有常量维护；同一局部重复使用不等于全局复用，只有具有跨模块共享价值的组合/主题语义才进入 uno.config.ts。
- 审查存量 theme/shortcuts，局部配置迁回使用处。专用 @keyframes 无法用普通 UnoCSS 工具类定义时，可以在所属组件内嵌最小 CSS，需在文档说明原因，不新增样式文件。
- 修改完成运行相关测试、构建、Lint、格式检查；不要用删除失败断言或无依据重写稳定模型替代修复。
