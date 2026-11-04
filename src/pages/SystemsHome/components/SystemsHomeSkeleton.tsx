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
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start gap-3 h-44px">
                <Skeleton.Avatar shape="square" size={44} />
                <Skeleton
                  title={{ width: '55%' }}
                  paragraph={{ rows: 1, width: '80%' }}
                  className="[&_.ant-skeleton-title]:m-0! [&_.ant-skeleton-paragraph]:mt-2! [&_.ant-skeleton-paragraph]:mb-0!"
                />
              </div>
              <div className="flex gap-2 mt-4 h-22px [&_.ant-skeleton-button]:h-22px! [&_.ant-skeleton-button]:min-w-56px!">
                <Skeleton.Button size="small" />
                <Skeleton.Button size="small" />
              </div>
              <Skeleton
                title={false}
                paragraph={{ rows: 2, width: ['100%', '75%'] }}
                className="mt-3 h-44px [&_.ant-skeleton-paragraph]:m-0! [&_.ant-skeleton-paragraph>li+li]:mt-2!"
              />
              <div className="flex items-center gap-2 mt-4 h-22px">
                <Skeleton.Avatar size={22} />
                <Skeleton
                  title={false}
                  paragraph={{ rows: 1, width: '50%' }}
                  className="[&_.ant-skeleton-paragraph]:m-0!"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 h-57px border-t border-t-solid border-divider bg-canvas">
              {[0, 1].map((cell) => (
                <div key={cell} className="flex items-center gap-3 px-4">
                  <Skeleton.Avatar shape="square" size={32} />
                  <Skeleton
                    title={false}
                    paragraph={{ rows: 2, width: ['50%', '70%'] }}
                    className="[&_.ant-skeleton-paragraph]:m-0! [&_.ant-skeleton-paragraph>li]:h-12px! [&_.ant-skeleton-paragraph>li+li]:mt-1.5!"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
