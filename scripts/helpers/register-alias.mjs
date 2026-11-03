/**
 * Node 测试入口的路径适配：直接加载 TypeScript 源码时，将 @/ 映射到 src/。
 * 使用 Node 22.12 已支持的异步注册 API；不改变 Vite 的开发与构建流程。
 */
import { register } from 'node:module';

register('./alias-loader.mjs', import.meta.url);
