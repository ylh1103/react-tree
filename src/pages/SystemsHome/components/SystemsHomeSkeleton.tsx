import { Skeleton } from 'antd';

/** 系统卡片占位沿用正文的自适应列宽和间距，避免加载阶段退化为整行纵向堆叠。 */
export default function SystemsHomeSkeleton() {
  return (
    <section
      className="motion-reduce:[&_.ant-skeleton-active_*]:animate-none! max-w-1600px mx-auto p-5 desktop:p-8"
      aria-busy
    >
      <span className="sr-only" role="status">
        系统列表加载中…
      </span>
      <div className="flex items-center justify-between gap-4 mb-5" aria-hidden="true">
        <h1 className="m-0 text-22px font-600">系统列表</h1>
        <Skeleton.Button active />
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-5" aria-hidden="true">
        <Skeleton.Input
          active
          className="w-440px! max-w-full [&_.ant-skeleton-input]:w-full! [&_.ant-skeleton-input]:min-w-0!"
        />
        <Skeleton.Input active className="w-160px!" />
        <Skeleton.Button active />
      </div>
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-4"
        aria-hidden="true"
      >
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="workspace-panel p-5">
            <Skeleton active title={{ width: '45%' }} paragraph={{ rows: 3 }} />
            <div className="grid grid-cols-2 gap-2 mt-4 [&_.ant-skeleton-button]:w-full! [&_.ant-skeleton-button]:h-88px!">
              <Skeleton.Button active block />
              <Skeleton.Button active block />
            </div>
            <Skeleton active title={false} paragraph={{ rows: 1 }} className="mt-4" />
          </div>
        ))}
      </div>
    </section>
  );
}
