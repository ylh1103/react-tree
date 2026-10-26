import { Skeleton } from 'antd';
import { NavigationFrame } from '@/layouts/LayoutFrame';
import { useAppSelector } from '@/store/hooks';

/** 导航占位只从公开路由配置推导数量；授权完成前不展示系统成员或业务清单。 */
export function NavigationSkeleton({
  items,
}: {
  items: readonly { path: string; bottom?: boolean }[];
}) {
  const iconOnly = useAppSelector((state) => state.preferences.navigationIconOnly);
  return (
    <NavigationFrame>
      <nav
        className="flex flex-col gap-0.5 min-h-full py-2 px-0.75 motion-reduce:[&_.ant-skeleton-active_*]:animate-none!"
        aria-label="主导航加载中"
        aria-busy
      >
        {items.map((item) => (
          <div
            key={item.path}
            className={`flex shrink-0 flex-col items-center justify-center gap-0.5 ${iconOnly ? 'min-h-44px' : 'min-h-60px'} py-1 ${item.bottom ? 'mt-auto' : ''}`}
            aria-hidden="true"
          >
            <Skeleton.Avatar
              active
              size={24}
              shape="square"
              className="[&_.ant-skeleton-avatar]:bg-nav-hover!"
            />
            {!iconOnly && <div className="w-32px h-12px rounded-control bg-nav-hover" />}
          </div>
        ))}
      </nav>
    </NavigationFrame>
  );
}
