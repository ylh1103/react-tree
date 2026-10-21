/** 加载方案的稳定标识，供指示器与参数项展示页面共享。 */
export type BrandDataLoadingVariant = 'trace' | 'wave' | 'matrix' | 'comet';

/** 展示文案与顺序；稳定键不随展示排序变化，避免影响已选方案。 */
export const dataLoadingStyles: readonly {
  key: BrandDataLoadingVariant;
  name: string;
  description: string;
  rhythm: string;
}[] = [
  {
    key: 'trace',
    name: '品牌描边',
    description: '红蓝光段沿 Logo 轮廓连续游走。保留品牌形状，轻盈、精细。',
    rhythm: '连续描边 · 1.8s',
  },
  {
    key: 'wave',
    name: '数据脉冲',
    description: '五条细柱错峰起伏，形成连续的数据节奏。小尺寸也容易辨认。',
    rhythm: '错峰波动 · 1.1s',
  },
  {
    key: 'matrix',
    name: '点阵汇聚',
    description: '红蓝点阵沿对角线依次亮起，像数据逐步汇聚。节奏平稳。',
    rhythm: '点阵接力 · 1.4s',
  },
  {
    key: 'comet',
    name: '彗尾流转',
    description: '渐隐圆点组成彗尾，沿环形轨道匀速流转。紧凑、流畅，适合通用加载。',
    rhythm: '彗尾环行 · 1.6s',
  },
];
