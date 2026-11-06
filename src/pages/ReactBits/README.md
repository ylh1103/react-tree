# 本地落地页模板

`/reactbits` 现在直接渲染本项目源码，没有 iframe 或独立官网服务。启动使用 `pnpm dev:reactbits`，构建使用项目原有 `pnpm build`。

从 [content.ts](./content.ts) 编辑品牌、Logo、页面标题与描述、公告、导航、首屏标题和按钮、结尾 CTA 与页脚说明。当前已套用“灵动参数管家”的产品介绍。链接支持本地路径、锚点与完整站外地址。

产品能力、变更流程、接入说明、FAQ、结尾及参数快照交互示意在 [ProductSections.tsx](./ProductSections.tsx)。产品事实依据项目 `production.md`，历史规模数据标明截至 2025-03-03，“防漏配提醒”保留开发中标记。环境切换仅改变本地示意，不调用发布接口。下列官方原始区块源码仍保留，但产品版不渲染推广、评价和赞助区。

页面区块顺序在 [LandingPage.jsx](./template/pages/LandingPage.jsx)。其他内容直接修改 `template/components/landingnew` 下的源码：

| 内容           | 目录                                            |
| -------------- | ----------------------------------------------- |
| 首屏与交互舞台 | Hero                                            |
| 特性卡片       | Features                                        |
| 动态演示       | LiveDemo                                        |
| 使用流程       | HowItWorks                                      |
| 产品能力展示   | ProSpotlight，及 template/components/common/Pro |
| 工具卡片       | Tools，及 template/constants/Tools.js           |
| 合作伙伴       | Sponsors，及 template/constants/Sponsors.js     |
| 用户评价       | Testimonials                                    |
| 常见问题       | FAQ                                             |
| 结尾与页脚     | CTA、Footer                                     |

图片和字体在 `public/reactbits`，渲染器在 `template/content`。这些均为项目内普通文件，可直接修改；运行和构建不依赖 vendor 检出。

来源为 React Bits 官方提交 `4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4` 的首页及依赖源码，共迁入 97 个模板文件。没有使用其他页面的内容。首页官方源码本身为 JavaScript，保留其 JSX/CSS；TypeScript 入口使用明确组件声明。

保留官方布局、动态组件和 CSS；为了项目集成，主题与滚动改为页面私有，去掉文档站专用导航逻辑、埋点及远程星标查询。样式在构建时加作用域并隔离关键帧，工具类用 UnoCSS 生成，未初始化 Tailwind/shadcn。保留原 CSS 是为了维护官方模板的完整布局与动画，避免重新实现设计。

依赖固定到上游锁文件版本；GPU 参数改为提交后同步，保留离屏暂停及资源清理。VGPU 仅使用浏览器实现，明确跳过 Node GPU 适配器的构建脚本。两个按住确认回调的时钟读取存在精确的 Lint 误报豁免，实际只在事件、计时器与帧回调执行。

代码许可见 [LICENSE.md](./template/LICENSE.md)，发布资源亦包含 `public/reactbits/LICENSE.txt`。字体许可在 `public/reactbits/fonts/LICENSE.txt`，照片来源在 `public/reactbits/photos/SOURCE.md`。
