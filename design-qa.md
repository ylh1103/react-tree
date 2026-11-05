# React Bits Landing 设计验证

路由调整说明：以下为复刻页迁移前的验收记录；该页面现位于 `/loading-copy`，实现目录为 `src/pages/LoadingCopy`。历史截图和验收路径保留原记录，`/landing` 现为实际产品页的待开发占位。

- 参考地址：<https://www.reactbits.dev/>
- 实现地址：<http://127.0.0.1:5173/landing>
- 日期：2026-11-05
- source visual truth path：`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/source-dusk-final.png`、`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/source-mobile-final.png`
- implementation screenshot path：`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/final-desktop.png`、`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/final-mobile.png`
- viewport：桌面 1440 × 1000 CSS px；手机 390 × 844 CSS px。
- source / implementation pixel dimensions：分别为 1440 × 1000、390 × 844；截图密度均为 1，未缩放输入图片。
- state：深色首页、Dusk 预设；公告和波浪为独立运行的动画，允许时间相位差。
- 浏览器：内置浏览器连接超时后，使用独立 agent-browser Chrome 会话完成源站与本地验证。

## Findings

最终对比未发现本次首页复刻范围内需要继续修复的 P0/P1/P2 问题。

已接受的实现边界：

- 颜色编辑采用 Ant Design Input 的原生颜色输入与 HEX 输入；数值编辑采用 Ant Design Popover + Slider。保留参数同步与键盘输入，控件面板沿用已安装 Ant Design 6.6.1，布局样式使用 UnoCSS。
- 首屏波浪、3D 轮播、按住确认、菜单、主题、FAQ 与复制在本地运行。特色、工具、Pro 及其余演示中的生成式视觉使用从源站捕获的静态预览，卡片详情链接打开原站。
- 产品文档、付费产品和组件详情保留源站目的地；本次只添加 `/landing` 路由。

## Required Fidelity Surfaces

- 字体：使用原站 Geist、Geist Mono 本地文件；并排检查桌面 41.76px 标题、手机 28.86px 标题、正文与代码字体，换行及主要层级一致。
- 间距和布局：对比桌面双列首屏、三组浮窗、手机单列 CTA 与 4:5 舞台；修复了手机舞台高度与 Pro 图片比例。特色、演示、安装、Pro、工具、赞助商、评价、FAQ、页脚均已检查。
- 颜色和主题：页面作用域主题变量对应深色背景 #120f17、文字 #f6f4f9 及亮色状态；预设颜色与参考参数一致。主题切换不写入应用全局偏好。
- 图片和素材：字体、品牌、赞助商、原站预览、十张轮播照片均保存在本地，无热链图片或字体；浏览器检查未发现已加载图片失败。WebGL 使用原站着色器，轮播使用原站分片几何。
- 文案：保留首页主要标题、说明、卡片和九条 FAQ 文案；核对了组件详情、Pro `/docs/*` 和赞助入口的链接。

## Comparison Evidence

- full-view comparison evidence：`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/compare-desktop.png`、`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/compare-mobile.png`。参考与实现放在同一输入画布中检查，没有以两张分开的截图代替并排比较。
- focused region comparison evidence：`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/compare-focused.png`，核对代码窗口字体、缩进、边框和参数行。
- 补充区块证据：`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/final-features.png`、`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/final-demos.png`、`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/final-products.png`、`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/final-tools.png`、`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/final-faq-region.png`。
- 移动菜单证据：`/Users/ylh/.codex/visualizations/2026/11/05/01a1a9b3-9dce-71e0-ad75-42004c285c69/landing-qa/final-mobile-menu.png`。

## Interactions Tested

- 匿名会话可直接打开 `/landing`；未进入登录页或系统工作区。
- Ocean / Dusk 等预设更新代码值与 Background Studio URL。
- 幅度通过滑块方向键从 1.8 更新到 1.9，导出 URL 同步。
- HEX 输入 #00ff88 并按 Enter，代码和导出 URL 同步。
- 命令复制后显示 Install command copied。
- 深浅色主题切换成功；手机菜单展开、Escape 关闭成功。
- 按住两秒后显示 Confirmed；轮播方向键切换到新的照片，并保留鼠标拖动与自动旋转。
- FAQ 展开后 aria-expanded=true，答案实际可见。
- 桌面 scrollWidth=1440、手机 scrollWidth=390，无页面横向溢出。
- console errors checked：最终页面无运行时异常；控制台仅有 Vite / React 开发信息。

## Comparison History

1. 首次尝试：内置浏览器连接超时，源站捕获阻塞；备用 Chrome 后恢复。
2. P1：着色器中保留了构建时模板常量，导致空白。替换实际常量后，重新截图验证正常渲染。
3. P1：手机舞台初稿为固定 640px。根据源站样式改为 4:5，重新对比手机首屏；标题、说明、CTA 和舞台比例恢复。
4. P2：轮播初稿为平面展示。改为十张原图及真实弧面分片，重新检查演示截图并验证键盘切换。
5. P2：Pro 预览统一高度改变了卡片比例。按源站 2.3:1 / 2:1 比例修复，复查 final-products.png。
6. P1：热更新时复用已释放的 WebGL 上下文。将画布创建与销毁绑定到 Effect 生命周期，后续热更新与切换视口确认 isContextLost=false。
7. 构建门禁：ColorPicker 预设将 Collapse 反向合入首屏。改用现有 Input 颜色能力，恢复自动分包，不改预算或 Vite 配置；最终首屏 JS gzip 303581 / 305000 bytes。

## Checks

- `npm test`：343 / 343 通过。测试需监听本地端口，在允许监听的环境运行。
- `npm run build`：通过，包含 TypeScript 与首屏预算检查。
- 首屏 CSS gzip：19808 / 20000 bytes；HTML gzip：11617 / 11800 bytes；无业务页面进入同步首屏闭包。
- `npm run lint`：通过。
- `npm run format:check`：通过。

## Implementation Checklist

- [x] 公开路由与目录懒加载。
- [x] 本地资源、许可、中文职责说明与页面 README。
- [x] 桌面和手机视觉对比。
- [x] 主要交互、资源加载及控制台检查。
- [x] 构建、测试、Lint 和格式检查。

## Follow-up Polish

P3：指针点阵、浮窗细微视差、次要预览动画及社交评价滚动节奏可继续打磨。动态波浪相位、Ant Design 控件的细微字距与原站存在可接受差异。

final result: passed
