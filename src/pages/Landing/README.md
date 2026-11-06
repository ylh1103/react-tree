# 灵动参数管家产品落地页

实现入口：`/landing`，启动：`npm run dev:landing`。开发依据为根 `AGENTS.md`、`production.md`、`docs/landing-design.md` 的 v0.8 开发基线及 `docs/react-bits.md`。本次仅本地开发与验证，没有部署或提交代码；其他未提交文件保留。

## 页面与行为

- 首屏、历史规模、风险防控、四步解释器、核心能力、三模块架构、五步接入、文档、FAQ、最终行动和页脚完整呈现。
- 所有内容容器最大 1280px，包含内边距。原生语义元素与 UnoCSS；页面及私有组件不使用 Ant Design。
- 预览统一标注“交互示意 · 非真实运行数据”，使用 `demo-service`、v12/v13 和 3000/5000；70000 端口是独立规则示例。示意不执行配置写入、发布或回退。
- 历史规模保留 2025-03-03 日期；基准环境漏配提醒标为“开发中”。未提供的截图以 HTML 示意替代，未提供的支持群入口省略。
- 控制台链接为 `/`，沿用现有登录与授权；文档链接仅补全资料中的 HTTPS 地址，带新标签页与行内权限说明。
- 唯一内部滚动容器驱动 50px 收拢阈值、活动导航、锚点和历史定位。导航高度 56px、顶部 20px、收拢上限 1120px 为产品适配；共享高亮响应悬停与键盘焦点。
- 浅色、深色、跟随系统使用唯一 Redux 偏好与原 `saveThemeMode` / `saveUserSettings` 管线，保持串行保存、失败回退、重试和匿名/登录用户隔离；不修改编辑器主题与未知字段。
- 风险行仅选择说明；流程采用纵向手动激活标签页，支持上下方向键、Home/End、Enter/Space。窄屏直接展开全部内容。FAQ 原生多项展开，宽屏分两列独立列表，阅读与键盘顺序一致。
- 首屏独立 Canvas 点阵流体使用粗网格速度场、半拉格朗日平流与衰减，鼠标注入局部动量。触摸不注入拖尾；支持手动暂停、离屏与后台暂停、约 30fps、DPR 上限和慢帧静态降级。Canvas 初始化失败保留 CSS 静态点阵。
- 页面设置与恢复 title、description、lang；主题切换不重建页面、画布或流程状态。

## 免费组件来源、依赖与许可

2026-11-05 先通过 shadcn MCP 搜索并查看以下 `@react-bits` 注册项，再通过官方 GitHub raw 下载、读取 TypeScript 源码与许可。MCP 单项详情只返回概要，不将其算作完整源码获取。

| 组件                | 实际来源                                                                                                                   | 适配                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MagicBento TS-TW    | [官方源文件](https://github.com/DavidHDev/react-bits/blob/main/src/ts-tailwind/Components/MagicBento/MagicBento.tsx)       | 裁剪网格、内容槽与边框高光机制；保留产品所需的一大两小、等宽及文档组合。删除演示画面、图标依赖、倾斜、粒子、磁吸、点击爆发和入场动画。并非完整上游 API。 |
| SpotlightCard TS-TW | [官方源文件](https://github.com/DavidHDev/react-bits/blob/main/src/ts-tailwind/Components/SpotlightCard/SpotlightCard.tsx) | 保留聚光跟随，表面与边界使用局部主题；默认关闭 ambient/flare/proximity，低强度高光。将渲染期 ref 写入移至 Effect，补后台暂停。                           |
| StarBorder TS-TW    | [官方源文件](https://github.com/DavidHDev/react-bits/blob/main/src/ts-tailwind/Animations/StarBorder/StarBorder.tsx)       | 真实 a 链接；hover=reveal，关闭 sparkle/clickPulse；解析平台颜色变量后用于 Canvas。ref 在 Effect 同步，补后台暂停。                                      |

官方源码下载自 `main`。GitHub commit API 返回速率限制，**未取得可核验的 commit，不把 main 当固定版本**。本次实际原始下载内容的 SHA-256：

```text
MagicBento.tsx    c9a47239fe201556e7bacbefaee5ceca3448e5f25bd0b3ba931d701e0c1c1b73
SpotlightCard.tsx f7b64189ce3c018e5f54103bdf16b3e5f0c97f4a0dba9f6cd62d8793580b8c72
StarBorder.tsx    da329da9b8a423a74bae98f5bcb1ba4aa93024b6c8571c4ddc70c1dd0d431d3a
LICENSE.md       4bdd1fa59a6b7d5954bc3b213dbc34e455c635a94bbcecf9293553797d0fad02
```

上游许可为 MIT + Commons Clause，版权归 David Haz；完整必要通知保存在 [REACT-BITS-LICENSE.md](REACT-BITS-LICENSE.md)。用于本产品应用，不单独销售或分发组件库。

MagicBento 上游声明 `@hugeicons/react@^1.1.10` 和 `@hugeicons/core-free-icons@^4.3.3`；实际引用用于删除的演示画面，因此不安装。其余两个源文件仅依赖 React。本次**无新增运行依赖、无锁文件变更**，复用现有 React、UnoCSS 与 Lucide 图标。核对本地已安装版本、类型及相关废弃标记，没有引入废弃 API。

三个组件中上游自带的系统减少动效分支按本项目既有策略关闭，没有改写全局动效设置；持续动效仅保留首屏流体，边框效果回应 hover/focus。

## 官网与公开布局参考

头部只直接参考 [reactbits.dev 官网首页](https://reactbits.dev/)，已实际浏览并截取展开、滚动收拢与移动端参考。

以下仅参考公开预览构图并独立编写 React + UnoCSS，未购买、获取或安装 Pro 源码，也没有复制打包代码：

- [How It Works 9](https://pro.reactbits.dev/docs/blocks/how-it-works/how-it-works-9)：步骤选择与详情双区域，替换为参数流程；标题和摘要常驻，删除计时、提交与人物。
- [Stats 4](https://pro.reactbits.dev/docs/blocks/stats/stats-4)：说明与 2×2 历史统计，不使用计数动效或趋势。
- [FAQ 9](https://pro.reactbits.dev/docs/blocks/faq/faq-9)：吸顶帮助面板与独立问答列，支持信息改为已知接入文档。

点阵流体为页面私有独立实现，不标为官方 FluidDotField。

## 样式与构建

沿用 UnoCSS 66.5.12、Vite 8.3.0 和项目主题。落地页局部中性色来自设计基线，主按钮继承平台 accent，浅色按钮使用高对比深色文字，文本链接使用平台色的局部深色混合值。正文、辅助文字、差异色及主按钮的静态配色计算对比度均大于 4.5:1（主按钮浅色约 5.52:1、深色约 7.96:1）；不据此宣称全站符合 WCAG。

全局 UnoCSS 原本会把所有懒加载页面的工具类加入后台首屏 CSS，首版实现使 20KB 门禁超限。使用与项目 HTML 启动层相同的 `createGenerator` 生成方式，新增页面专用 [构建插件](../../../build/landing-styles-plugin.mjs)：

1. 全局 pipeline 仅排除 `src/pages/Landing`。
2. 从页面 TS/TSX 提取工具类，沿用同一 `uno.config.ts`，不重复 preflight。
3. 用 `[data-landing-theme]` 局部作用域，防止加载顺序影响后台或复刻页。
4. 经 `virtual:landing.css` 随路由加载，并支持源文件 HMR。

没有新增手写样式文件或全局 shortcuts。唯一专用关键帧 `landing-detail` 就近内嵌在入口，解释器切换仅做 180ms 透明度过渡；这是 UnoCSS 任意动画工具类引用的局部关键帧定义。

生产构建门禁保持原值。最终实测体积见 `dist/startup-report.json`；本轮约：首屏静态 JS 304.44KB gzip、CSS 19.81KB、HTML 11.63KB。落地页独立 JS 约 20.8KB gzip、CSS 约 6.6KB，不加载 Monaco、复刻页资源或图形库。后续如果 UnoCSS 提供可靠的原生路由分层方案，可重新评估这段页面专用生成代码。

## 验证记录

2026-11-05，本机 Chrome 156.0.8078.80，开发服务及生产构建预览均实际验证：

| 项目                                    | 结果                                                                                                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                              | 343 通过，0 失败。含本地 HTTP 的测试在允许本机端口的环境运行；沙箱首次 EPERM 未计为通过。                                                                                                         |
| `npm run build`                         | 类型检查、Vite 构建及原有启动预算通过。仍有既有 Monaco 大 chunk 提示，不是构建失败。                                                                                                              |
| `npm run lint` / `npm run format:check` | 通过。                                                                                                                                                                                            |
| 浏览器多尺寸                            | 360、390、768、1100、1280、1440px 无页面横向溢出；生产产物复验 360、390、768、1280、1440px。                                                                                                      |
| 主题                                    | 三模式、system 响应系统变化、固定模式不受系统覆盖、匿名保存/刷新、登录隔离、控制台往返、连续选择、失败回退/可见提示/重试通过。                                                                    |
| 损坏配置                                | 无效设置 JSON 禁用保存，提供读取重试，原始文档未覆盖。                                                                                                                                            |
| 导航与键盘                              | 共享底板跨项移动、1120px 收拢、活动项、直接锚点、重复定位、移动菜单、Escape 返回焦点、流程方向键、Home/End 与 Enter/Space、FAQ Space 与多项展开、展开指示、重复锚点不追加历史、触摸模拟菜单通过。 |
| 背景与清理                              | 鼠标扰动、暂停/继续、离屏暂停、模拟 document.hidden 后恢复、Canvas 不可用时静态降级通过；StrictMode 三次挂载卸载后帧循环与观察器数量均回到既有页面基线。                                          |
| 放大重排                                | 720 CSS px + DPR 2 检查 1440px 屏幕下 200% 等效重排，无横向溢出；不是实际浏览器 UI 缩放或实机屏幕阅读器测试。                                                                                     |
| 兼容与控制台                            | 控制台入口进入既有登录；开发与生产验证未出现运行时/浏览器 console error。                                                                                                                         |
| 实验室性能                              | 单次本机生产预览 LCP 约 1.20s、CLS 0、1 个 long task；不能代替真实访问 P75，也没有据此断言 INP 达标。                                                                                             |

截图与机器结果保存在被 Git 忽略的 [output/landing](../../../output/landing)，包括生产明暗首屏、手机、各区块和官网参考；`qa-results.json`、`production-results.json`、`reference-results.json` 保存对应结果。

工具限制：agent-browser CLI 未安装，内置浏览器连接超时，改用环境已有 Playwright Core 与本机 Chrome。官方源码通过配置代理成功获取；commit API 限流如上记录。内网文档权限与可达性、真实设备/最低浏览器矩阵、真实后台能力及客户端版本范围、真实访问 P75/INP、真实系统级后台切换和完整辅助技术审计，未在本轮确认。没有把这些项报告为通过，也不因此阻断已明确范围的本地首版。
