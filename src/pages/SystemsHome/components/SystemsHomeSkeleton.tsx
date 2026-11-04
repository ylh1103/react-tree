/** 卡片骨架对应身份、摘要、参数入口和页脚的实际尺寸，减少加载交接时的布局跳动。 */
import { Skeleton } from 'antd';
import { systemCardContainer, systemCardGrid, systemPageSizes } from '../model/presentation';

export default function SystemsHomeSkeleton() {
  return (
    <div aria-busy className={systemCardContainer}>
      <span className="sr-only" role="status">
        系统列表加载中…
      </span>
      <div className={systemCardGrid} aria-hidden="true">
        {Array.from({ length: systemPageSizes[0] }, (_, index) => (
          <div key={index} className="workspace-panel overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-3 h-44px">
                <Skeleton.Avatar shape="square" size={40} />
                <Skeleton
                  title={{ width: '55%' }}
                  paragraph={{ rows: 1, width: '80%' }}
                  className="[&_.ant-skeleton-title]:m-0! [&_.ant-skeleton-paragraph]:mt-2! [&_.ant-skeleton-paragraph]:mb-0!"
                />
              </div>
              <div className="flex gap-1.5 mt-3 h-22px [&_.ant-skeleton-button]:h-22px! [&_.ant-skeleton-button]:min-w-56px!">
                <Skeleton.Button size="small" />
                <Skeleton.Button size="small" />
              </div>
              <Skeleton
                title={false}
                paragraph={{ rows: 2, width: ['100%', '75%'] }}
                className="mt-3 h-40px [&_.ant-skeleton-paragraph]:m-0! [&_.ant-skeleton-paragraph>li+li]:mt-1!"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4 [&_.ant-skeleton-button]:w-full! [&_.ant-skeleton-button]:h-64px!">
              <Skeleton.Button block />
              <Skeleton.Button block />
            </div>
            <div className="flex items-center h-41px px-4 border-t border-t-solid border-divider">
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: '60%' }}
                className="[&_.ant-skeleton-paragraph]:m-0!"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
