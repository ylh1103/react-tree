/** 卡片骨架对应身份、摘要、参数入口和页脚的实际尺寸，减少加载交接时的布局跳动。 */
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
          <div key={index} className="workspace-panel overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3 h-44px">
                <Skeleton.Avatar shape="square" size={40} />
                <Skeleton
                  title={{ width: '55%' }}
                  paragraph={{ rows: 1, width: '80%' }}
                  className="[&_.ant-skeleton-title]:mt-0! [&_.ant-skeleton-paragraph]:mt-2! [&_.ant-skeleton-paragraph]:mb-0!"
                />
              </div>
              <div className="mt-3 h-22px [&_.ant-skeleton-button]:h-20px!">
                <Skeleton.Button size="small" />
              </div>
              <Skeleton
                title={false}
                paragraph={{ rows: 3, width: ['65%', '100%', '75%'] }}
                className="mt-3 h-64px [&_.ant-skeleton-paragraph]:m-0! [&_.ant-skeleton-paragraph>li+li]:mt-1!"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4 [&_.ant-skeleton-button]:w-full! [&_.ant-skeleton-button]:h-64px!">
              <Skeleton.Button block />
              <Skeleton.Button block />
            </div>
            <div className="flex items-center h-45px px-4 border-t border-t-solid border-divider">
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: '65%' }}
                className="[&_.ant-skeleton-paragraph]:m-0!"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
