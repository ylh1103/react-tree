/** 为同名 MJS 插件提供 TypeScript 声明；插件运行在 Vite 开发服务器和生产构建阶段。 */
import type { Plugin } from 'vite';

/** 注入 HTML 启动画面、缓存读取脚本及首屏样式交接逻辑。 */
export function loadingBootstrapPlugin(): Plugin;
