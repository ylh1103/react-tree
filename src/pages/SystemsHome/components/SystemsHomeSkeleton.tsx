/** 页签正文的卡片骨架与正式卡片共用四列布局，不遮挡搜索工具栏或页签。 */
import { Skeleton } from 'antd';
import { systemCardGrid } from '../model/presentation';

export default function SystemsHomeSkeleton() {
  return (
    <div aria-busy>
      <span className="sr-only" role="status">
        系统列表加载中…
      </span>
      <div className={systemCardGrid} aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="workspace-panel overflow-hidden border-t-3 border-t-accent p-4"
          >
            <Skeleton title={{ width: '40%' }} paragraph={{ rows: 3 }} />
            <div className="grid grid-cols-2 gap-4 my-5 [&_.ant-skeleton-button]:w-full! [&_.ant-skeleton-button]:h-100px!">
              <Skeleton.Button block />
              <Skeleton.Button block />
            </div>
            <Skeleton title={false} paragraph={{ rows: 3 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
