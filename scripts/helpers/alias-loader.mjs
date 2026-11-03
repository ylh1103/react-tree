/** Node 测试的应用别名解析；仅映射 @/，其他依赖交给 Node 原生加载。 */
const sourceRoot = new URL('../../src/', import.meta.url);

export function resolve(specifier, context, nextResolve) {
  const target = specifier.startsWith('@/')
    ? new URL(specifier.slice(2), sourceRoot).href
    : specifier;
  return nextResolve(target, context);
}
