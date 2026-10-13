export type BrandDataLoadingVariant =
  | 'trace'
  | 'rings'
  | 'wave'
  | 'matrix'
  | 'comet'
  | 'relay'
  | 'segments'
  | 'shuttle'
  | 'beacon'
  | 'shine'
  | 'echo'
  | 'inflow';

/** Stable keys can be persisted by user preferences independently of gallery order. */
export const dataLoadingStyles: readonly {
  key: BrandDataLoadingVariant;
  letter: string;
  name: string;
  description: string;
  rhythm: string;
  isNew: boolean;
}[] = [
  {
    key: 'trace',
    letter: 'A',
    name: '品牌描边',
    description: '红蓝光段沿 Logo 轮廓连续游走。保留品牌形状，轻盈、精细。',
    rhythm: '连续描边 · 1.8s',
    isNew: false,
  },
  {
    key: 'rings',
    letter: 'B',
    name: '双轨流转',
    description: 'Logo 静止，红蓝双轨反向流转。加载信号清楚，适合反复出现。',
    rhythm: '双轨反向 · 1.6s',
    isNew: false,
  },
  {
    key: 'wave',
    letter: 'C',
    name: '数据脉冲',
    description: '五条细柱错峰起伏，形成连续的数据节奏。小尺寸也容易辨认。',
    rhythm: '错峰波动 · 1.1s',
    isNew: false,
  },
  {
    key: 'matrix',
    letter: 'D',
    name: '点阵汇聚',
    description: '红蓝点阵沿对角线依次亮起，像数据逐步汇聚。节奏平稳。',
    rhythm: '点阵接力 · 1.4s',
    isNew: false,
  },
  {
    key: 'comet',
    letter: 'E',
    name: '彗尾流转',
    description: '渐隐圆点组成彗尾，沿环形轨道匀速流转。紧凑、流畅，适合通用加载。',
    rhythm: '彗尾环行 · 1.6s',
    isNew: false,
  },
  {
    key: 'relay',
    letter: 'F',
    name: '双点接力',
    description: '红蓝双点沿交错轨道交换位置，像请求与响应相互传递。轻快、清楚。',
    rhythm: '双点交汇 · 1.6s',
    isNew: false,
  },
  {
    key: 'segments',
    letter: 'G',
    name: '分段圆环',
    description: '圆环的八段依次亮起，形成明确的旋转节奏。适合偏简洁的界面。',
    rhythm: '分段接力 · 1.2s',
    isNew: false,
  },
  {
    key: 'shuttle',
    letter: 'H',
    name: '光带穿梭',
    description: '两条红蓝光带反向穿梭，节奏舒缓。适合列表、面板中的局部数据加载。',
    rhythm: '双向穿梭 · 1.8s',
    isNew: false,
  },
  {
    key: 'beacon',
    letter: 'I',
    name: '品牌信标',
    description: '完整 Logo 保持清晰，外围光点沿短弧连续环行。品牌突出，加载节奏明确。',
    rhythm: 'Logo 常驻 · 光点环行 · 1.8s',
    isNew: true,
  },
  {
    key: 'shine',
    letter: 'J',
    name: '品牌扫光',
    description: '一道柔和光带掠过完整 Logo。形状与红蓝配色始终保留，适合安静的页面加载。',
    rhythm: '完整品牌 · 柔光扫描 · 1.8s',
    isNew: true,
  },
  {
    key: 'echo',
    letter: 'K',
    name: '品牌涟漪',
    description: 'Logo 静止，红蓝轮廓向外扩散后渐隐。像处理中的信号持续发出，节奏柔和。',
    rhythm: '轮廓回声 · 错峰扩散 · 2s',
    isNew: true,
  },
  {
    key: 'inflow',
    letter: 'L',
    name: '数据入流',
    description: '红蓝数据点从两侧流向 Logo。品牌处于视觉中心，适合参数与列表数据加载。',
    rhythm: '双向接入 · 品牌常驻 · 1.4s',
    isNew: true,
  },
];
