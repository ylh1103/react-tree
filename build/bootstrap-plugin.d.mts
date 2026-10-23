/** HTML 启动插件的构建接口；统一管理主题、加载画面及首屏样式交接的注入顺序。 */
import type { Plugin } from 'vite';

/** 为开发服务器与生产构建生成同步启动脚本、内联画面和 UnoCSS 样式。 */
export function bootstrapPlugin(): Plugin;
