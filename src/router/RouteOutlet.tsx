import { Activity, useContext, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router';
import { matchPageSkeleton, RouteLoadingContext } from './loading';

/** 同一布局内延迟显示目标骨架，跨布局或保留工作区时继续显示原页面；全局进度由 Router 订阅处理。 */
export function RouteOutlet({ layoutId, delayMs = 250 }: { layoutId: string; delayMs?: number }) {
  const routes = useContext(RouteLoadingContext);
  const navigation = useNavigation();
  const location = useLocation();
  const targetSkeleton = navigation.location
    ? matchPageSkeleton(routes, navigation.location.pathname, layoutId, location.pathname)
    : null;
  const pendingKey = targetSkeleton ? navigation.location?.key : undefined;
  const [revealedKey, setRevealedKey] = useState<string>();
  useEffect(() => {
    if (!pendingKey) return;
    const timer = setTimeout(() => setRevealedKey(pendingKey), delayMs);
    return () => {
      clearTimeout(timer);
      setRevealedKey(undefined);
    };
  }, [pendingKey, delayMs]);
  const skeleton =
    delayMs === 0 || (pendingKey && revealedKey === pendingKey) ? targetSkeleton : null;
  return (
    <>
      <Activity mode={skeleton ? 'hidden' : 'visible'}>
        <Outlet />
      </Activity>
      {skeleton}
    </>
  );
}
