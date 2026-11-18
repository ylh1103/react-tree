/** 系统目录和无权限页同步展示申请入口，点击后再加载弹窗。 */
import { lazy, Suspense, useState } from 'react';
import { Button } from 'antd';
import type { SystemJoinTarget } from '@/types/systems';

const JoinSystemModal = lazy(() => import('./JoinSystemModal'));

export default function JoinSystemAction({
  system,
  primary = false,
}: {
  system: SystemJoinTarget;
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {primary ? (
        <Button
          type="primary"
          aria-haspopup="dialog"
          className="h-44px! px-5!"
          icon={<span className="i-lucide-user-round-plus text-4" aria-hidden="true" />}
          onClick={() => setOpen(true)}
        >
          申请加入
        </Button>
      ) : (
        <a
          href="#"
          role="button"
          aria-haspopup="dialog"
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-control text-12px hover:underline layout-focus"
          aria-label={`申请加入 ${system.systemName}`}
          onClick={(event) => {
            event.preventDefault();
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key !== ' ') return;
            event.preventDefault();
            setOpen(true);
          }}
        >
          <span className="i-lucide-user-round-plus size-12px" aria-hidden="true" />
          申请加入
        </a>
      )}
      {open && (
        <Suspense>
          <JoinSystemModal system={system} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
