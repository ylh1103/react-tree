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
  systemEntryGrid,
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
                <div className="grid h-64px min-w-0 grid-rows-[24px_18px_22px] items-center [&_.ant-skeleton-element]:flex! [&_.ant-skeleton-input]:min-w-0!">
                  <div className="flex items-center gap-1.5">
                    <Skeleton.Input
                      block
                      className="w-[28%]! max-w-120px"
                      classNames={{ content: 'h-16px!' }}
                    />
                    <Skeleton.Input
                      block
                      className="w-[22%]! max-w-96px"
                      classNames={{ content: 'h-16px! rounded-full!' }}
                    />
                    <Skeleton.Input
                      block
                      className="w-38px!"
                      classNames={{ content: 'h-16px! rounded-full!' }}
                    />
                  </div>
                  <Skeleton.Input
                    block
                    className="w-[48%]! max-w-240px"
                    classNames={{ content: 'h-10px!' }}
                  />
                  <Skeleton.Input
                    block
                    className="w-[72%]! max-w-360px"
                    classNames={{ content: 'h-12px!' }}
                  />
                </div>
                <div className={systemEntryGrid}>
                  {[0, 1].map((entry) => (
                    <div
                      key={entry}
                      className="flex h-64px flex-col items-center justify-center gap-1 [&_.ant-skeleton-element]:flex!"
                    >
                      <Skeleton.Avatar shape="square" size={20} />
                      <Skeleton.Input classNames={{ content: 'h-12px! w-56px! min-w-0!' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className={systemListFooter}>
                <div className="flex items-center gap-1">
                  <Skeleton.Avatar size={24} />
                  <Skeleton.Avatar size={24} />
                </div>
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
                <div className="mt-auto grid h-92px grid-cols-2 gap-2">
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
