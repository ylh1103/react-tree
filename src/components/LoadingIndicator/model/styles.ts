/** 加载图标共享清单：设置面板与参数项图库使用相同文案、顺序和方案键。 */
import type { BrandDataLoadingVariant } from '../../BrandDataLoading/model/styles.ts';
import type { BrandLoadingVariant } from '../../BrandLoading/index.tsx';
import { dataLoadingStyles } from '../../BrandDataLoading/model/styles.ts';
import type { LoadingStyleId } from '../../../types/loading.ts';

/** 保留指示器与方案键的对应关系，渲染时按类型收窄，不使用不安全的类型断言。 */
export type LoadingStyle = {
  id: LoadingStyleId;
  name: string;
  description: string;
  rhythm?: string;
} & ({ kind: 'data'; key: BrandDataLoadingVariant } | { kind: 'flat'; key: BrandLoadingVariant });

const flatStyles: { key: BrandLoadingVariant; name: string; description: string }[] = [
  { key: 'split', name: '分合回弹', description: '红蓝分离、交错起伏，再回弹合拢' },
];

/** 所有方案一次展示；清单在模块加载时组装，不在组件渲染中反复筛选或维护派生状态。 */
export const loadingStyles: readonly LoadingStyle[] = [
  ...dataLoadingStyles.map((item) => ({
    ...item,
    id: `data-${item.key}` as const,
    kind: 'data' as const,
  })),
  ...flatStyles.map((item) => ({
    ...item,
    id: `flat-${item.key}` as const,
    kind: 'flat' as const,
  })),
];
