/** 全局加载偏好适配：仅订阅图标字段，设置切换时只更新指示器，避免整个主题 Provider 重渲染。 */
import type { SVGProps } from 'react';
import { LoadingIndicator } from './index';
import { useAppSelector } from '@/store/hooks';
import { defaultUserSettings } from '@/types/preferences';

export function UserLoadingIndicator(props: SVGProps<SVGSVGElement>) {
  const styleId = useAppSelector((state) => state.preferences.loadingStyle);
  return <LoadingIndicator styleId={styleId ?? defaultUserSettings.loadingStyle} {...props} />;
}
