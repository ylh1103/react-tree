/** 卡片骨架对应身份、描述、参数入口和底部元信息栏的实际尺寸，减少加载交接时的布局跳动。 */
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
          <div key={index} className="workspace-panel flex flex-col overflow-hidden">
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-start gap-3 h-36px">
                <Skeleton.Avatar shape="square" size={36} />
                <Skeleton
                  title={{ width: '50%' }}
                  paragraph={{ rows: 1, width: '75%' }}
                  className="[&_.ant-skeleton-title]:m-0! [&_.ant-skeleton-title]:h-14px! [&_.ant-skeleton-paragraph]:mt-2! [&_.ant-skeleton-paragraph]:mb-0! [&_.ant-skeleton-paragraph>li]:h-12px!"
                />
              </div>
              <Skeleton
                title={false}
                paragraph={{ rows: 2, width: ['100%', '70%'] }}
                className="h-40px [&_.ant-skeleton-paragraph]:m-0! [&_.ant-skeleton-paragraph>li]:h-12px! [&_.ant-skeleton-paragraph>li+li]:mt-3!"
              />
              <div className="grid grid-cols-2 gap-2 [&_.ant-skeleton-button]:h-60px! [&_.ant-skeleton-button]:w-full!">
                <Skeleton.Button active={false} block />
                <Skeleton.Button active={false} block />
              </div>
            </div>
            <div className="flex items-center justify-between h-44px px-5 border-t border-t-solid border-t-border-subtle">
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: 72 }}
                className="[&_.ant-skeleton-paragraph]:m-0! [&_.ant-skeleton-paragraph>li]:h-12px!"
              />
              <Skeleton.Avatar size={22} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
