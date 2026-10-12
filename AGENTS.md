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
