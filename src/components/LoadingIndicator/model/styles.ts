/** 加载图标共享清单：启动 HTML、设置面板与图库使用相同文案、顺序和稳定方案标识。 */
import type { LoadingStyleId } from '../../../types/loading.ts';

/** 直接使用持久化标识选择效果，调用方无需区分图标系列或维护额外方案键。 */
export interface LoadingStyle {
  id: LoadingStyleId;
  name: string;
  description: string;
  rhythm?: string;
}

/** 展示顺序独立于方案标识；保留既有 data-/flat- 前缀，兼容用户配置及启动缓存。 */
export const loadingStyles: readonly LoadingStyle[] = [
  {
    id: 'data-trace',
    name: '品牌描边',
    description: '红蓝光段沿 Logo 轮廓连续游走。保留品牌形状，轻盈、精细。',
    rhythm: '连续描边 · 1.8s',
  },
  {
    id: 'data-wave',
    name: '数据脉冲',
    description: '五条细柱错峰起伏，形成连续的数据节奏。小尺寸也容易辨认。',
    rhythm: '错峰波动 · 1.1s',
  },
  {
    id: 'data-matrix',
    name: '点阵汇聚',
    description: '红蓝点阵沿对角线依次亮起，像数据逐步汇聚。节奏平稳。',
    rhythm: '点阵接力 · 1.4s',
  },
  {
    id: 'data-comet',
    name: '彗尾流转',
    description: '渐隐圆点组成彗尾，沿环形轨道匀速流转。紧凑、流畅，适合通用加载。',
    rhythm: '彗尾环行 · 1.6s',
  },
  { id: 'flat-split', name: '分合回弹', description: '红蓝分离、交错起伏，再回弹合拢' },
];
