# React + TypeScript + Vite

## 开发

```sh
pnpm install
pnpm dev
pnpm build
```

## ESLint + Prettier

使用 ESLint 9 Flat Config：JavaScript、TypeScript、React 组件和 JSX 推荐规则，React Hooks 推荐规则，以及 Vite Fast Refresh 检查。浏览器代码与 Node 配置文件分别设置全局变量。

`eslint` 和 `@eslint/js` 使用 `^9` 版本范围，仅更新 9.x，不会升级到 10。`eslint-plugin-react` 启用 `recommended` 和 `jsx-runtime` 预设，支持自动 JSX 转换，并自动检测 React 版本。仅在 TypeScript 文件中关闭 `react/prop-types`，由 TypeScript 检查组件 props。

ESLint 负责代码质量，Prettier 负责格式，`eslint-config-prettier` 放在最后关闭冲突规则。无需 `eslint-plugin-prettier`。

```sh
pnpm lint          # 检查代码
pnpm lint:fix      # 自动修复可修复的问题
pnpm format        # 格式化项目
pnpm format:check  # 检查格式，适合 CI
```

- `eslint.config.js`：检查规则及忽略目录。
- `.prettierrc.json`：2 空格、单引号、分号、尾随逗号、100 字符行宽、LF 换行。
- `.prettierignore`：忽略依赖、构建产物、生成文件和锁文件。
- `.vscode/settings.json`：保存时格式化并执行 ESLint 自动修复。

VS Code 请安装工作区推荐的 ESLint 和 Prettier 扩展。

这套配置不启用需要类型信息的 ESLint 规则；类型检查由 `pnpm build` 中的 `tsc -b` 完成。

参考：[typescript-eslint](https://typescript-eslint.io/getting-started/)、[Prettier 与 Linter 集成](https://prettier.io/docs/integrating-with-linters)。
