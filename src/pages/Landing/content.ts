/** 产品文案与示意数据：事实来自 production.md，示例不代表真实运行结果。 */
export const navigation = [
  { id: 'capabilities', label: '核心能力' },
  { id: 'workflow', label: '变更流程' },
  { id: 'integration', label: '接入指南' },
  { id: 'faq', label: '常见问题' },
];
export const risks = [
  {
    title: '应用发了，参数没跟上',
    summary: '核对快照版本，识别待发布变更。',
    heading: '让待发布变更有迹可查',
    detail: '当前版本 v12 / 待发布快照 v13',
    note: '基准环境漏配提醒：开发中',
    icon: 'i-lucide-files',
  },
  {
    title: '公共参数变了，关联应用没同步',
    summary: '识别公共参数依赖，提示重新生成快照。',
    heading: '公共配置修改后，检查关联快照',
    detail: 'shared-config / demo-service',
    note: '识别系统内公共参数依赖，修改后提示重新生成快照。',
    icon: 'i-lucide-git-branch',
  },
  {
    title: '配置能保存，却不符合使用要求',
    summary: '结合格式与业务规则，提示异常参数。',
    heading: '发现异常时，说明原因',
    detail: 'server.port: 70000',
    note: '示例检查提示：端口范围应为 1–65535。',
    icon: 'i-lucide-scan-line',
  },
];
export const steps = [
  {
    title: '保存参数',
    summary: '集中维护应用和公共模块配置，为后续快照提供参数来源。',
    label: '保存后的配置示意',
    detail: 'demo-service',
    code: 'connectionTimeout: 5000',
    note: '业务应用与公共模块配置集中维护。',
  },
  {
    title: '生成快照',
    summary: '合并应用与公共模块配置，形成某一版本的完整参数。',
    label: '某一版本的完整配置',
    detail: '应用配置 + 公共配置',
    code: '快照 v13',
    note: '快照保留完整参数，不在示意中推断覆盖优先级。',
  },
  {
    title: '发布快照',
    summary: '将选定快照发布到配置中心，保留历史版本供回退使用。',
    label: '选定版本与发布目的地',
    detail: '历史快照 v12 / 选定快照 v13',
    code: '发布到配置中心',
    note: '生产发布受现有权限流程约束；历史快照可作为回退依据。',
  },
  {
    title: '确认生效',
    summary: '按应用条件重启或热更新，结合运行时差异确认配置。',
    label: '运行时参数检查',
    detail: '预期快照 v13',
    code: '预期 5000 / 运行时 5000',
    note: '热更新需满足接入与代码条件，不代表发布后所有实例自动生效。',
  },
];
export const integrationSteps = [
  ['创建系统', '建立系统入口，组织应用与参数。'],
  ['添加环境', '按接入要求配置对应环境。'],
  ['创建应用', '添加需要管理参数的应用。'],
  ['参数迁移', '按接入文档迁移配置，核对迁移结果。'],
  ['集成客户端', '添加 SDK 依赖和配置，部署后验证。'],
];
export const documents = [
  {
    title: 'ZA21 应用接入',
    description: '查看客户端依赖与配置步骤',
    label: '查看 ZA21 文档',
    id: 'zuyq7E',
  },
  {
    title: 'ZA24 应用接入',
    description: '查看迁移、平台配置与验证说明',
    label: '查看 ZA24 文档',
    id: 'zuykdn',
  },
];
export const faqs = [
  [
    '参数热更新需要什么条件？',
    '产品文档列出两种方式：配置类使用 @ConfigurationProperties，或在 @Value 所在类添加 @RefreshScope。实际支持范围还应按客户端版本和接入文档确认。',
  ],
  [
    '修改后一定要重启应用吗？',
    '符合热更新接入条件的配置可通过热更新生效，其他情况按应用方式重启。发布后可结合运行时比对确认结果。',
  ],
  [
    '参数回退如何操作？',
    '产品支持选择历史快照版本进行发布回退；具体权限和操作步骤以控制台及对应文档为准。',
  ],
  [
    '工具或配置中心异常时怎么办？',
    '参数增强 SDK 提供文件故障转移能力。触发条件、文件准备与恢复步骤需按接入文档核对。',
  ],
  [
    '哪些应用可以接入？',
    '产品介绍列出 Spring Boot 2.0 以上应用及 ZA21、ZA24 的接入方式。具体版本矩阵和限制尚待核对。',
  ],
];
