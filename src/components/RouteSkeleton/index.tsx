/** 路由阶段统一使用的轻量内容占位；不读取业务数据或分栏偏好，不依赖懒加载页面。 */
import { Skeleton } from 'antd';

export function RouteSkeleton() {
  return (
    <section className="workspace-panel min-h-full p-6" aria-busy>
      <span className="sr-only" role="status">
        页面加载中…
      </span>
      <Skeleton active paragraph={{ rows: 8 }} />
    </section>
  );
}
