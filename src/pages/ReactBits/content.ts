/** 产品信息编辑入口。文案依据 production.md；仅替换文案，保留官方组件及布局。 */
export const templateContent = {
  metadata: {
    language: 'zh-CN',
    title: '灵动参数管家｜让每一次参数变更更可控',
    description:
      '面向行内开发人员的集中化参数管理工具，通过快照版本、发布前检查与运行时比对，让参数变更更可控。',
  },
  brand: { name: '灵动参数管家', logo: '' },
  announcements: [{ label: '参数快照 · 发布前检查 · 运行时比对', to: '#features' }],
  navigation: [
    { label: '核心能力', to: '#capabilities' },
    { label: '变更流程', to: '#how-it-works' },
    { label: '接入指南', to: '#how-it-works' },
    { label: '常见问题', to: '#faq' },
  ],
  hero: {
    title: ['每次参数变更，', '更可控。'],
    description: ['集中管理技术参数。', '快照发布，检查与比对。'],
    primaryAction: { label: '进入控制台', to: '/' },
    secondaryAction: { label: '查看接入指南', to: '#integration' },
  },
  headerAction: {
    label: '进入控制台',
    shortLabel: '控制台',
    to: '/',
  },
  community: { show: true, href: 'https://github.com/DavidHDev/react-bits', stars: 43500 },
  closing: {
    title: '让下一次参数变更，从容一些。',
    description: '从集中管理到快照发布，通过发布前检查与运行时比对，让每一次参数变更更可控。',
    primaryAction: { label: '进入控制台', to: '/' },
    secondaryAction: {
      label: '查看接入指南',
      to: '#how-it-works',
    },
  },
  footer: {
    description: ['集中化技术参数管理。', '快照发布，检查与比对。'],
  },
};
