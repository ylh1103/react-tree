# 产品落地页

公开路由 `/landing`，入口只负责组合 Provider、导航和各内容模块。当前实现导航与首屏，后续产品能力、流程、FAQ 等模块分别新增独立组件，再按顺序接入入口；不提前创建空组件。代码和许可均在本目录维护，不依赖 `ReactBits`。

## 模块边界

- `LandingProvider.tsx`：读取全局用户 `themeMode`，通过已有 `useResolvedTheme` 支持跟随系统；继承全局语义色与 Ant Design token，不维护另一套调色板。主题按钮走现有 `saveUserSettings`，保留串行保存与失败回退；设置读取失败时禁用写入，并展示保存错误。
- `components/LandingNavigation`：产品导航，负责滑动高亮、滚动收拢、明暗切换和手机菜单。使用 Ant Design Button，保留 Escape 关闭与焦点恢复；切回桌面时关闭手机菜单并释放滚动锁。
- `components/LandingHero`：首屏文案、行动入口与背景组合，不维护导航状态。文字区域沿用参考页网格：桌面左标题/按钮、右描述，1100px 以下纵向排列，768px 以下标题自动折行、按钮上下铺满；标题字号、字重、行高、容器宽度和间距按参考页对齐，保留产品文案。
- `components/HeroParticles`：背景层组合；`DotFrame` 负责超宽屏边缘网格，`GhostReveal` 负责闲置光斑，`useParticleVisibility` 合并离屏与后台状态。常量、颜色公式和遮罩取值就近维护。
- `components/DotGrid`：类型化参数和画布入口；`useDotGrid` 维护 WebGL 生命周期与帧循环，`shaders.ts` 保留官方着色器。参数仅在提交后交给帧循环，物理数组不进入 React 状态；编译/链接失败和卸载路径释放 GPU 资源。

全部组件使用 TS/TSX 实现，无 JSX 源码、声明包装、CSS 文件、整段样式字符串或内联 style 标签。布局、断点、遮罩、渐变和过渡均使用 UnoCSS；主题与遮罩参数通过局部 CSS 变量传入。仅鼠标坐标、网格对齐和逐帧位移通过 DOM style 更新，避免每帧触发 React 渲染。未新增关键帧、全局 shortcuts 或依赖。页面通过 `LazyMotion` 异步加载 `domAnimation`，区块使用轻量 `m.header`，`useLandingEntrance` 只提供动画参数和动态效果偏好：首屏按参考页以 1.1 秒从 16px 上移、8px 虚化淡入；导航外层保持静态，不施加 opacity/filter 入场动画，避免形成新的 backdrop root 而影响玻璃背景采样。仅挂载时播放，不在主题切换或菜单交互时重播；尊重减少动态效果设置，动画生命周期由 Motion 管理，卸载时自动清理。

## 效果与兼容

保留参考页的 2.6px 点径、22px 间距、360px 影响半径及运动公式。静止时显现游动的局部光斑，鼠标移动后转为局部扰动，停止约 2.6 秒后恢复；2160px 起显示边缘网格。粒子容器覆盖完整首屏，底点使用当前主题的 `colorBgLayout`，显现色从 `colorPrimary` 派生，与背景保持一致并避免全屏常亮。导航玻璃层继续保留原透明度，色值取用户主题的容器、文字和边框 token；按钮直接继承 Ant Design 主题。保留减少动态效果、WebGL2 不可用时的可读内容、静止休眠及离屏/后台暂停。

控制台指向 `/`，首屏接入指南指向产品文档中的应用参数文档。产品能力导航指向本页 #features，使用流程导航指向本页 #how-it-works，常见问题导航指向本页 #faq，接入指南仍指向参考页区块；这些链接不构成源码依赖。

## 来源与许可

基于 React Bits 官方提交 `4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4` 的本地源码适配，当前已转换为 TypeScript 与 UnoCSS。遵循 MIT + Commons Clause，完整版权和条款见本目录 `LICENSE.md`。Pro 素材来源与许可见下方对应接入记录。

使用项目原有构建、Lint、格式和完整测试脚本验证，并检查桌面/手机、明暗主题、菜单键盘操作、粒子交互与闲置交接、超宽屏边缘网格及路由重复挂载。

## Hero 33 光带接入

落地页使用 Hero 33 的光带渲染器，沿用蓝青配色和拖拽交互。Three.js 随组件延迟加载。光带画布和粒子层覆盖同一个 Hero 区域，画布按光带的实际轮廓遮挡粒子，空隙保持透明。

- 来源：授权 registry 的 pro/hero-33.json，TypeScript 变体，获取日期 2026-11-08。响应未提供上游版本。
- 原始响应副本的 SHA-256：77AEF6C3800B09E0502C21FEDD0E2854DA7C553A7790940FA5D12CFA9E280F38。
- 许可：React Bits Pro 商业许可。直接依赖 three 0.187.0，类型依赖 @types/three 0.187.0。

## Features 13 参数风险演示

「产品能力」区块基于授权注册表的 Features 13，沿用原有布局、断点和交互，展示漏配、公共参数依赖与格式校验三个静态示例。局部 UnoCSS 样式随落地页加载，提供 640、768、1024px 断点，配色继承落地页与应用的主题变量，告警背景取 Ant Design 主题 token。原版依赖 Tailwind Preflight，容器内以低优先级补齐边框、标题段落与按钮默认样式，避免影响其他区块。

- 来源为 [授权注册表的 features-13](https://registry.collectui.pro/api/r/reactbits/pro/features-13.json)，TypeScript 源码获取于 2026-11-09。响应未提供上游版本。
- 原始 TypeScript 源码 SHA-256 为 `fc0f7d6209f4938d547a4621a0bd54228a628d170c6954894b4e988ada58d0ee`。
- 按 React Bits Pro 商业许可使用。复用现有 motion 12.23.21 与 lucide-react 0.542.0。

## How It Works 9 参数发布流程

沿用 How It Works 9 的步骤切换、键盘导航和发布详情面板，用静态示例演示保存参数、生成快照、发布快照及核对运行时参数。局部 UnoCSS 提供原版断点，配色继承落地页主题。

- 来源为 [授权注册表的 how-it-works-9](https://registry.collectui.pro/api/r/reactbits/pro/how-it-works-9.json)，获取于 2026-11-09，响应未提供上游版本。
- 原始 TSX 的 SHA-256 为 `58613c5755bd3faeccb8063f1a7ae6aa5eaaff7e78be087c378d3fc1c1b944dc`，按 React Bits Pro 商业许可使用。动效复用已有 Motion。

## Stats 4 行内使用情况

从 Stats 4 原始 TSX 迁移双栏布局、点阵卡片、阴影和末项高亮，填入截至 2025 年 3 月 3 日的统计数据。保留原版窄屏单列及平板起两列的指标布局。局部 UnoCSS 跟随落地页明暗模式。

- 来源为 [授权注册表的 stats-4](https://registry.collectui.pro/api/r/reactbits/pro/stats-4.json)，TSX 获取于 2026-11-09。
- 原始 TSX 的 SHA-256 为 `b1d09d935c1dc7828e3cf389b8bef50383b108e4b66dcf9b6230f6da5ef48d45`，按 React Bits Pro 商业许可使用。

## FAQ 6 常见问题

保留 FAQ 6 左侧链接卡，右侧按 /reactbits 的圆角卡片、加号及单项展开方式展示九条参数管理问答。链接使用产品文档提供的应用参数与 DB 参数接入指南。

- 来源为 [授权注册表的 faq-6](https://registry.collectui.pro/api/r/reactbits/pro/faq-6.json)，获取于 2026-11-09。
- 原始 TSX 的 SHA-256 为 `f90862519f45d2668696f42ba3314b8abd465f4c40914585161badd0c9a115fc`，按 React Bits Pro 商业许可使用。复用已有 Motion 和 Lucide。

## 底部 CTA 与页脚

直接复用 /reactbits 的 CTA、Footer、GradientWaves 和 FooterWaves。作用域与主题通过模板容器接入，整个组合随落地页异步加载。页脚品牌返回本页顶部，CTA 的接入指南指向应用参数文档。沿用模板三列链接、署名和许可入口。
