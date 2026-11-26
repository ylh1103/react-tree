/** 页头资源配置。站点地址和帮助链接由业务方提供后在此补充。 */
import mdnIcon from './site-icons/mdn.png';
import reactIcon from './site-icons/react.ico';
import viteIcon from './site-icons/vite.svg';

// 图标取自各站官方 favicon.ico（MDN、React）及 logo.svg（Vite）。
// 按数组顺序展示站点。iconUrl 可填写站点官方图标地址，缺省时显示通用图标。
export const relatedSites: ReadonlyArray<{ label: string; href: string; iconUrl?: string }> = [
  {
    label: 'MDN Web Docs',
    href: 'https://developer.mozilla.org/',
    iconUrl: mdnIcon,
  },
  {
    label: 'React',
    href: 'https://react.dev/',
    iconUrl: reactIcon,
  },
  {
    label: 'Vite',
    href: 'https://vite.dev/',
    iconUrl: viteIcon,
  },
];
// 反馈和支持群暂用测试地址，待业务方提供正式链接后替换。
export const helpLinks = [
  {
    label: '接入指南',
    detail: '查看接入步骤与配置说明',
    href: '/landing#landing-integration',
    icon: 'i-lucide-book-open',
  },
  {
    label: '产品介绍',
    detail: '了解平台能力与使用场景',
    href: '/landing#core-features',
    icon: 'i-lucide-info',
  },
  {
    label: '我要反馈',
    detail: '报告问题或提交建议',
    href: 'https://example.org/feedback',
    icon: 'i-lucide-message-square',
  },
] as const;

export const supportGroupHref = 'https://example.org/support-group';

// 账号菜单暂用测试地址，待业务方提供正式链接后替换。
export const legacyHref = 'https://example.org/legacy';
export const platformManagementHref = 'https://example.org/platform-management';
