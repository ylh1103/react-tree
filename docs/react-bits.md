# React Bits 开发指南

本指南约定如何在当前仓库引入 React Bits，并为 Codex 提供可重复使用的任务上下文。核对日期：2026-11-05。

## 环境与启动

项目已有 React 19、TypeScript、Vite、UnoCSS 和 Ant Design，版本以本地 package.json、pnpm-lock.yaml 和安装结果为准。Node 要求 ≥22.12.0。

依赖已安装时，在项目根目录执行：

```sh
npm run dev:landing
```

Vite 会输出实际本地地址并尝试打开 `/landing`，这是实际产品落地页的公开入口，当前为待开发占位。该页面不要求登录。若浏览器未自动打开，使用终端输出的地址加对应路径。停止服务使用 Ctrl+C。

全新检出按根 README 使用 pnpm 安装依赖，继续沿用 pnpm-lock.yaml，不混用其他包管理器生成锁文件。`npm run` 仅运行已有脚本，不安装依赖。

## 接入方案

采用官方推荐的 shadcn MCP 访问 React Bits 注册表，检索组件并获取官方源码后，按项目约定适配。React Bits 组件成为仓库内维护的源码，不需要先安装一个统一的 reactbits 运行时包。

- 官方站点：<https://reactbits.dev/>
- 官方源码与安装说明：<https://github.com/DavidHDev/react-bits>
- 官方许可证：<https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md>

项目根目录 `components.json` 注册 `@react-bits`。Codex 用户级配置通过下列命令添加服务，当前固定为已核对的 shadcn 4.23.0，避免每次启动自动切换版本：

```sh
codex mcp add shadcn -- npx -y shadcn@4.23.0 mcp
codex mcp get shadcn
```

更换电脑时需要重新添加用户级服务；仓库配置随项目保留。配置后重启 Codex，加载 MCP 工具。在本项目中验证：

```text
使用 shadcn MCP 列出当前项目的注册表，再搜索 @react-bits 中的 Aurora，
查看 Aurora-TS-TW 的详情，再从官方 registry JSON 获取源码和依赖，
先不要安装或修改文件。
```

当前项目使用 UnoCSS 的 presetWind3，并非 Tailwind 项目。`components.json` 仅配置注册表，供 MCP 检索和读取；不伪造 Tailwind 配置，不运行 shadcn init。CLI 自动安装流程可能要求完整的 shadcn/Tailwind 项目配置，因此当前通过 MCP 定位组件，获取官方源码后由 Codex 按本项目目录、主题及 UnoCSS 约定落地，不直接执行生成的 add 命令。MCP 不属于浏览器运行时依赖。

实测 MCP 握手、工具发现、项目注册表识别、Aurora 搜索和组件详情查询通过。当前 `view_items_in_registries` 返回摘要及文件数量，未直接返回完整源码；需要读取 `https://reactbits.dev/r/Aurora-TS-TW.json` 中的 files/content、dependencies，或官方仓库对应源码。不能将摘要查询成功报告成已读取源码。

本次单独直连 registry JSON 时，Python 请求返回 403，Node 请求连接超时，完整源码下载尚未验证成功。遇到相同情况时改从官方 GitHub 仓库读取对应组件，不能将网络失败当成组件不存在。

官方接入说明：<https://reactbits.dev/get-started/mcp>；Codex 配置说明：<https://ui.shadcn.com/docs/mcp#codex>。

## 每个组件的引入流程

1. 从产品目标选择效果，提供官方组件链接、使用区块、期望参数和移动端表现。先完成内容与布局，再加入动效。
2. 优先通过 shadcn MCP 搜索 `@react-bits`、查看组件详情，再从官方 registry JSON 或源码仓库读取对应 TypeScript 源码和依赖，结合官方 Code、安装说明核对参数、默认值、清理行为及许可；不要凭示例名称猜测 API。MCP 不可用时使用官方站点或源码，并说明实际获取方式。
3. 获取 TS-TW 或 TS-CSS 版本作为适配依据。Tailwind 类逐项核对 UnoCSS 支持情况，特别检查任意变体、渐变、动画及断点。当前全局断点为 desktop/wide，不能直接假定上游 sm/md/lg 可用。
4. 仅安装选中组件真正需要的依赖。先检查项目现有能力，再核对实际版本的本地类型、React 19 兼容性和废弃标记，不预装整套动画或图形库。
5. 页面私有组件放在所属页面的 components 内；真正跨页面复用时才进入 src/components，并遵循大驼峰目录与 index.tsx 入口。不要创建空目录或总 barrel。
6. 布局优先 UnoCSS，颜色沿用主题变量，局部组合留在使用处。实际产品落地页 `/landing` 的内容容器最大宽度为 1280px，组件尽量采用 React Bits，不使用 Ant Design；无合适组件时以语义化原生元素与 UnoCSS 补齐，并实现键盘、焦点和状态反馈。其他页面沿用既有控件约定。不新增样式文件；专用关键帧可内嵌于所属组件，并在其说明中解释原因。
7. 清理帧循环、监听器、观察器、计时器和 GPU 资源；检查 StrictMode 重挂载、尺寸变化、离屏/后台暂停及低性能设备降级。动态效果偏好遵循所属页面已有约定，不改写全局策略。
8. 记录来源链接、实际获取的上游 commit 或 registry 版本、变体、直接依赖、改动和许可位置；无法取得版本时明确标注，不能把跟踪 main 当成已固定版本。

当前上游 LICENSE.md 标注 MIT + Commons Clause；引入时重新核对组件及其第三方资源的具体许可，保存必要的版权和许可文本。Pro 素材单独按所持许可处理，不将付费密钥写入源码。

实际产品落地页使用 `src/pages/Landing/index.tsx` 和 `/landing`，不沿用复刻页的品牌与内容，不更改业务鉴权。

## 在 Codex 中提供上下文

根 AGENTS.md 保存长期约定，并指向本指南。产品文档、参考截图和组件链接随具体任务提供；这些资料属于任务输入，不必全部塞入 AGENTS.md。OpenAI 官方也将 AGENTS.md 作为项目持久指引，其他文档按需组织：

<https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex>

有组件目标时可直接使用：

```text
请按 AGENTS.md 和 docs/react-bits.md 开发。
目标页面/路由：[填写]
产品介绍：[文档路径或正文]
目标用户与主要行动：[填写，例如预约演示]
视觉参考：[链接或截图]
React Bits 组件：[官方链接]
使用位置与效果：[例如仅用于首屏背景，文字必须清晰]
请先查看已有实现，获取官方 TypeScript 源码并核对依赖，
适配 UnoCSS 和主题，记录来源与许可，完成交互和相关验证。
```

只有产品介绍时可使用：

```text
请根据这份产品介绍准备落地页方案：先整理目标用户、价值主张、
主要行动、页面结构和文案，并标记缺少依据的内容；
再推荐少量 React Bits 效果，说明位置、作用和依赖成本。
不编造客户、评价或效果数据。按 AGENTS.md 和 docs/react-bits.md 执行。
产品介绍：[文档路径或正文]
```

## 验证与完成条件

纯文档修改检查内容、链接路径与格式。组件、依赖或配置变更按影响范围执行项目检查；跨模块、依赖和构建配置变更运行完整检查：

```sh
npm test
npm run build
npm run lint
npm run format:check
```

视觉和交互改动还需要浏览器验证：桌面与手机尺寸、长文案、键盘和触摸、重复挂载/卸载、控制台错误，以及动效对阅读和滚动的影响。构建成功不代表视觉验收通过。报告已有失败和新增问题，不覆盖其他未提交工作。
