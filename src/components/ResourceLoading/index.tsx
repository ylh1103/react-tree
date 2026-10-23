/**
 * 没有静态页面骨架时使用的等待回退：HTML 启动画面存在时继续使用原 SVG，否则显示 React 图标。
 * 此组件不结束启动阶段；移除 HTML 画面的时机由提交实际内容的 BootstrapLoadingHandoff 决定。
 */
import { useContext } from 'react';
import { BootstrapLoadingContext } from '@/contexts/BootstrapLoadingContext';
import { UserLoadingIndicator } from '@/components/LoadingIndicator/UserLoadingIndicator';
import { ResourceLoadingView } from './LoadingView';

export function ResourceLoading() {
  const { active } = useContext(BootstrapLoadingContext);
  // 返回 null 只是不在 root 内重复渲染；root 外的 HTML 画面仍可见，原动画可以继续播放。
  if (active) return null;
  return (
    <ResourceLoadingView>
      <UserLoadingIndicator />
    </ResourceLoadingView>
  );
}
