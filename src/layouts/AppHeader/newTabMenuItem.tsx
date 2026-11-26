import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

/** 键盘激活菜单项或点击图标时打开新页签，文字链接保留原生行为。 */
export function newTabMenuItem(label: string, href: string, content: ReactNode = label) {
  return {
    key: href,
    label: (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label}（在新页签打开）`}
      >
        {content}
      </a>
    ),
    onClick: ({ domEvent }) => {
      if (!(domEvent.target instanceof Element && domEvent.target.closest('a'))) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    },
  } satisfies NonNullable<MenuProps['items']>[number];
}
