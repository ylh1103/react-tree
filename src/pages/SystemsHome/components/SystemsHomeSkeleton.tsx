/** 系统目录骨架随展示模式切换，减少加载交接时的布局跳动。 */
import { Skeleton } from 'antd';
import {
  systemCardContainer,
  systemCardFrame,
  systemCardGrid,
  systemCardPadding,
  systemCardDescriptionHeight,
  systemCardFooter,
  systemListLayout,
  systemListRow,
  systemListBody,
  systemListFooter,
  type SystemView,
} from '../model/presentation';

export default function SystemsHomeSkeleton({ count, view }: { count: number; view: SystemView }) {
  return (
    <div aria-busy className={systemCardContainer}>
      <span className="sr-only" role="status">
        系统列表加载中…
      </span>
      {view === 'list' ? (
        <div className={systemListLayout} aria-hidden="true">
          {Array.from({ length: count }, (_, index) => (
            <div key={index} className={systemListRow}>
              <div className={systemListBody}>
                <Skeleton title={{ width: '35%' }} paragraph={{ rows: 1, width: '65%' }} />
                <div className="grid h-64px grid-cols-2 place-items-center gap-2">
                  <Skeleton.Button />
                  <Skeleton.Button />
                </div>
              </div>
              <div className={systemListFooter}>
                <Skeleton.Avatar size={24} />
                <Skeleton.Button size="small" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={systemCardGrid} aria-hidden="true">
          {Array.from({ length: count }, (_, index) => (
            <div key={index} className={systemCardFrame}>
              <div className={`flex flex-1 flex-col gap-2.5 ${systemCardPadding}`}>
                <div className="flex h-42px items-start gap-3">
                  <Skeleton
                    title={{ width: '40%' }}
                    paragraph={{ rows: 1, width: '75%' }}
                    className="[&_.ant-skeleton-title]:m-0! [&_.ant-skeleton-title]:h-16px! [&_.ant-skeleton-paragraph]:mt-2! [&_.ant-skeleton-paragraph]:mb-0! [&_.ant-skeleton-paragraph>li]:h-12px!"
                  />
                  <Skeleton.Button size="small" />
                </div>
                <Skeleton
                  title={false}
                  paragraph={{ rows: 2, width: ['100%', '70%'] }}
                  className={`${systemCardDescriptionHeight} [&_.ant-skeleton-paragraph]:m-0! [&_.ant-skeleton-paragraph>li]:h-12px! [&_.ant-skeleton-paragraph>li+li]:mt-1.5!`}
                />
                <div className="mt-auto grid h-96px grid-cols-2 gap-2 pt-1">
                  {[0, 1].map((entry) => (
                    <div key={entry} className="flex flex-col items-center justify-center gap-2">
                      <Skeleton.Avatar shape="square" size={36} />
                      <Skeleton.Button size="small" />
                    </div>
                  ))}
                </div>
              </div>
              <div
                className={`flex items-center justify-between gap-2 ${systemCardPadding} ${systemCardFooter}`}
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((owner) => (
                    <Skeleton.Avatar key={owner} size={24} />
                  ))}
                </div>
                <Skeleton.Button size="small" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
