/** 所有模板链接使用显式地址；同时支持产品内路径、页内锚点和站外文档。 */
import type { ComponentPropsWithRef } from 'react';

export function Link({ to, ...props }: ComponentPropsWithRef<'a'> & { to: string }) {
  return <a {...props} href={to} />;
}
