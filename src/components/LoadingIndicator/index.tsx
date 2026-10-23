/** 统一渲染用户可选的加载图标；图库预览显式传入方案，全局加载仅订阅对应偏好字段。 */
import type { SVGProps } from 'react';
import { BrandDataLoading } from '@/components/BrandDataLoading';
import { BrandLoading } from '@/components/BrandLoading';
import { loadingStyles } from './model/styles';
import { defaultUserSettings } from '@/types/preferences';
import type { LoadingStyleId } from '@/types/loading';
import { useAppSelector } from '@/store/hooks';

/** SVG 尺寸与加载语义由调用处或 Ant Design Spin 提供。 */
interface LoadingIndicatorProps extends SVGProps<SVGSVGElement> {
  styleId: LoadingStyleId;
}

export function LoadingIndicator({ styleId, ...props }: LoadingIndicatorProps) {
  const item = loadingStyles.find((style) => style.id === styleId) ?? loadingStyles[0];
  return item.kind === 'flat' ? (
    <BrandLoading variant={item.key} {...props} />
  ) : (
    <BrandDataLoading variant={item.key} {...props} />
  );
}

/** 独立订阅图标偏好，配置切换只更新指示器，不迫使整个主题 Provider 和页面重渲染。 */
export function UserLoadingIndicator(props: SVGProps<SVGSVGElement>) {
  const styleId = useAppSelector((state) => state.preferences.loadingStyle);
  return <LoadingIndicator styleId={styleId ?? defaultUserSettings.loadingStyle} {...props} />;
}
