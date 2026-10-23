/**
 * Node 测试入口的路径适配：直接加载 TypeScript 源码时，将 @/ 映射到 src/。
 * 仅拦截应用别名，其他依赖交给 Node 原生解析；不改变 Vite 的开发与构建流程。
 */
import { registerHooks } from 'node:module';

const sourceRoot = new URL('../../src/', import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = specifier.startsWith('@/')
      ? new URL(specifier.slice(2), sourceRoot).href
      : specifier;
    return nextResolve(target, context);
  },
});
