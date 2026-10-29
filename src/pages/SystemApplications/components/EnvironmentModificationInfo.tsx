/** 参数底栏的修改摘要：借用提交记录的视觉语义，展示真实维护人，不推断当前用户身份。 */
import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import type { ApplicationEnvironment } from '@/types/applicationEnvironments';
import { formatModificationTime } from './modificationTime';

export function EnvironmentModificationInfo({
  environment: env,
}: {
  environment: ApplicationEnvironment;
}) {
  const [now, setNow] = useState(() => Date.now());
  // 时间是外部时钟；只刷新此摘要，避免每分钟更新编辑器和工具栏，卸载时清理计时器。
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const time = formatModificationTime(env.techMntTime, env.maintDate, now);
  const author = env.maintUser || '未知';
  return (
    <Tooltip
      title={`${author}${time.absolute ? ` · ${time.absolute}` : ' · 暂无时间'}`}
      trigger={['hover', 'focus']}
    >
      <span
        tabIndex={0}
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control layout-focus"
      >
        <span className="i-lucide-git-commit-vertical h-14px w-14px shrink-0" aria-hidden="true" />
        <span>
          {author}，<time dateTime={time.dateTime}>{time.relative}</time>
        </span>
      </span>
    </Tooltip>
  );
}
