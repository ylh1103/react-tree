import { Activity, useContext, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router';
import { matchPageSkeleton, RouteLoadingContext } from './loading';

/** 同一布局内导航时显示目标页面的骨架，保留旧页面直到导航完成。 */
export function RouteOutlet({ layoutId, delayMs = 180 }: { layoutId: string; delayMs?: number }) {
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
