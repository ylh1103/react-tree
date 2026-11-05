/** 默认示例保留官方目的地；产品模板不带原站归因和埋点。 */
export const PRO_ORIGIN = 'https://pro.reactbits.dev';
export function proLinkProps(path, placement, { sameTab = false } = {}) {
  return {
    href: new URL(path || '/', PRO_ORIGIN).toString(),
    target: sameTab ? undefined : '_blank',
    rel: sameTab ? undefined : 'noopener noreferrer',
  };
}
