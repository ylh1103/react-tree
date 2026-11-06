# React Bits 开发指南

本指南约定如何在当前仓库引入 React Bits，并为 Codex 提供可重复使用的任务上下文。本地配置核对日期：2026-11-06。

## 环境与启动

项目已有 React 19、TypeScript、Vite、UnoCSS 和 Ant Design，版本以本地 package.json、pnpm-lock.yaml 和安装结果为准。Node 要求 ≥22.12.0。

依赖已安装时，在项目根目录执行：

```sh
npm run dev:reactbits
```

Vite 会输出实际本地地址并尝试打开 `/reactbits`，这是 React Bits 复刻页的公开入口。该页面不要求登录。若浏览器未自动打开，使用终端输出的地址加对应路径。停止服务使用 Ctrl+C。

全新检出按根 README 使用 pnpm 安装依赖，继续沿用 pnpm-lock.yaml，不混用其他包管理器生成锁文件。`npm run` 仅运行已有脚本，不安装依赖。

## 接入方案

采用官方推荐的 shadcn MCP 访问 React Bits 注册表，检索组件并获取官方源码后，按项目约定适配。React Bits 组件成为仓库内维护的源码，不需要先安装一个统一的 reactbits 运行时包。

- 官方站点：<https://reactbits.dev/>
- 官方源码与安装说明：<https://github.com/DavidHDev/react-bits>
- 官方许可证：<https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md>

### 已配置的注册表

以项目根目录 `components.json` 的 `registries` 为准，当前三项均已配置：

| 命名空间             | 注册表 URL                                                           | 鉴权                              |
| -------------------- | -------------------------------------------------------------------- | --------------------------------- |
| `@react-bits`        | `https://reactbits.dev/r/{name}.json`                                | 未配置鉴权头                      |
| `@reactbits-starter` | `https://registry.collectui.pro/api/r/reactbits/starter/{name}.json` | `Bearer ${REACTBITS_LICENSE_KEY}` |
| `@reactbits-pro`     | `https://registry.collectui.pro/api/r/reactbits/pro/{name}.json`     | `Bearer ${REACTBITS_LICENSE_KEY}` |

按目标组件所属命名空间检索和安装，不将 Starter/Pro 组件名套用到免费注册表。优先通过 shadcn MCP 查看项目注册表、搜索组件和读取详情；详情若只含摘要，继续取得 registry JSON 中的 `files/content`、依赖和关联注册项后再适配。

授权密钥放在被 Git 忽略的 `.env.local`，变量名为 `REACTBITS_LICENSE_KEY`。执行授权注册表请求的 CLI 或 MCP 进程必须能读取该变量；不能仅凭 Vite 能读取 `.env.local` 就认定其他进程已加载。不要打印、提交密钥，或把带密钥的请求头写入文档和日志。

### 安装与项目适配

项目已有 `components.json`，无需重新运行 shadcn init。当前配置为 `rsc: false`、`tsx: true`、`style: new-york`，样式入口指向 `src/styles/index.css`。这些 CLI 兼容字段不代表项目已采用 Tailwind；实际使用 UnoCSS `presetWind3`，不自动安装 Tailwind 或覆盖全局主题。

根 TypeScript 配置已有 `@/* → ./src/*`。注册表 aliases 包含 `@/components`、`@/components/ui`、`@/lib/utils`、`@/lib` 和 `@/hooks`，它们是生成路径配置，不保证目标文件或工具函数已存在。安装后按项目目录约定整理为大驼峰目录和 `index.tsx` 入口，核对新增导入，不为兼容生成结果创建空目录。

以下为安装命令示例；名称须先通过对应注册表确认，命令不代表已安装成功：

```sh
npx shadcn@latest add @react-bits/Aurora-TS-TW
npx shadcn@latest add @reactbits-pro/profile-3
```

Starter 组件使用 `@reactbits-starter/` 加已确认的组件名。CLI 版本以执行时实际结果为准；历史接入使用过 4.23.0，不代表项目锁定该版本。执行前检查生成文件和依赖，执行后审查 diff，特别关注全局 CSS、主题变量及锁文件；不要混用包管理器生成另一份锁文件。

`/reactbits` 是独立的公开复刻页，入口为 `src/pages/ReactBits/index.tsx`，拥有局部样式与主题。产品入口 `/landing` 位于 `src/pages/Landing/index.tsx`，目前仅实现导航和首屏；导航、完整粒子层、DotGrid 和主题均已独立迁入 Landing，不依赖参考页目录，来源和适配说明见 `src/pages/Landing/README.md`。

### 历史接入记录（2026-11-06）

以下保留已有接入记录；本次仅核对本地配置与源码，未重新验证注册表联网、密钥有效性或 MCP 连通性。

- shadcn CLI 实际版本 4.23.0。两个授权 URL 用本地密钥直接请求均返回 HTTP 200，没有遇到 401；未替换用户指定的 registry。
- CLI 直接请求出现 TLS 断连/连接超时；尝试代理及 Node 原生代理后仍失败。将同一地址下载的原始 JSON 交给 CLI，仍被它额外请求的 `ui.shadcn.com/r/colors/neutral.json` 阻塞。因此采用原始 JSON 中的 `files/content` 直接落源码，不声称 CLI add 已成功。
- 验证组件：`src/components/Profile3/index.tsx`，默认导出 `Profile3`，未挂入现有业务页面。来源：`https://registry.collectui.pro/api/r/reactbits/pro/profile-3.json`；说明：<https://pro.reactbits.dev/docs/blocks/profile/profile-3>。响应未提供 commit/版本，下载日期为 2026-11-06；原始 content SHA-256 为 `e0932fe0c8c9c39d38a73884451f13fa4efbaebeaa4d26053445ecdac80722bd`。
- 许可：授权 Pro 素材，按所持商业许可使用；响应未附许可全文，不将其作为官方开源 MIT 素材传播。Skill 标记 Proprietary。
- 依赖沿用现有 `motion` 12.23.21 和 `lucide-react` 0.542.0，不更改 package.json 或锁文件。组件保留上游动画，改用项目主题色、现有 desktop/wide 断点、UnoCSS 渐变和纵横比语法；内容上限改为 1280px。补足上游缺失的头像占位图，关注按钮改为可点击、可键盘操作的本地演示状态。
- 当时记录未运行 init，也未注入全局主题变量或 `.dark` 激活机制。`backup-pre-reactbits` 备份现已删除，后续通过 Git diff 和版本历史检查变更。
- 当时构建、Lint、格式检查与 344 项测试全部通过；测试首次因沙盒禁止监听本地端口失败，允许本地测试服务器后全部通过。构建仅保留大文件体积提示。组件未渲染到页面，本次仅验收源码和构建，不代表页面视觉验收。

此前实测 MCP 握手、工具发现、项目注册表识别、Aurora 搜索和组件详情查询通过。当时 `view_items_in_registries` 返回摘要及文件数量，未直接返回完整源码；需要读取 `https://reactbits.dev/r/Aurora-TS-TW.json` 中的 files/content、dependencies，或官方仓库对应源码。不能将摘要查询成功报告成已读取源码。

此前单独直连免费 Aurora registry JSON 时，Python 请求返回 403，Node 请求连接超时，完整源码下载尚未验证成功。遇到相同情况时改从官方 GitHub 仓库读取对应组件，不能将网络失败当成组件不存在。

官方接入说明：<https://reactbits.dev/get-started/mcp>；Codex 配置说明：<https://ui.shadcn.com/docs/mcp#codex>。

## 每个组件的引入流程

1. 从产品目标选择效果，提供官方组件链接、使用区块、期望参数和移动端表现。先完成内容与布局，再加入动效。
2. 按组件归属，通过 shadcn MCP 搜索 `@react-bits`、`@reactbits-starter` 或 `@reactbits-pro` 并查看详情，再从对应 registry JSON 或有权访问的源码读取 TypeScript 源码和依赖，结合官方 Code、安装说明核对参数、默认值、清理行为及许可；不要凭示例名称猜测 API。MCP 不可用时使用对应官方站点或授权来源，并说明实际获取方式。Starter/Pro 沿用配置中的鉴权头，不改用免费注册表替代授权请求。
3. 获取 TS-TW 或 TS-CSS 版本作为适配依据。Tailwind 类逐项核对 UnoCSS 支持情况，特别检查任意变体、渐变、动画及断点。当前全局断点为 desktop/wide，不能直接假定上游 sm/md/lg 可用。
4. 仅安装选中组件真正需要的依赖。先检查项目现有能力，再核对实际版本的本地类型、React 19 兼容性和废弃标记，不预装整套动画或图形库。
5. 页面私有组件放在所属页面的 components 内；真正跨页面复用时才进入 src/components，并遵循大驼峰目录与 index.tsx 入口。不要创建空目录或总 barrel。
6. 布局优先 UnoCSS，颜色沿用主题变量，局部组合留在使用处。页面沿用既有控件约定，并保留键盘、焦点和状态反馈。不新增样式文件；专用关键帧可内嵌于所属组件，并在其说明中解释原因。
7. 清理帧循环、监听器、观察器、计时器和 GPU 资源；检查 StrictMode 重挂载、尺寸变化、离屏/后台暂停及低性能设备降级。动态效果偏好遵循所属页面已有约定，不改写全局策略。
8. 记录来源链接、实际获取的上游 commit 或 registry 版本、变体、直接依赖、改动和许可位置；无法取得版本时明确标注，不能把跟踪 main 当成已固定版本。

免费组件此前核对的上游 LICENSE.md 标注 MIT + Commons Clause；引入时重新核对组件及其第三方资源的具体许可，保存必要的版权和许可文本。Pro 素材单独按所持许可处理，不将付费密钥写入源码。

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
React Bits 组件：[所属注册表命名空间、组件名和官方链接]
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
