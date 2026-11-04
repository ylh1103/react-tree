import { Skeleton } from 'antd';

/** 对齐正式页头的单行与窄屏工作区双行高度，不挂载切换控件或交互工具。 */
export function HeaderSkeleton({ workspace = false }: { workspace?: boolean }) {
  const inputClass = '[&_.ant-skeleton-input]:min-w-0! [&_.ant-skeleton-input]:w-full!';
  return (
    <header
      className={`
        shrink-0 min-w-0 bg-header border-b border-b-solid border-divider
      `}
      aria-label="页头加载中"
      aria-busy
    >
      <div
        className="flex flex-wrap items-center gap-x-2 min-h-51px px-3 min-[640px]:gap-x-3 min-[640px]:px-4"
        aria-hidden="true"
      >
        <div className="flex shrink-0 items-center gap-2 h-51px">
          <Skeleton.Avatar active size={28} shape="square" />
          <Skeleton.Input
            active
            size="small"
            className={`w-112px! min-[640px]:w-128px! ${inputClass}`}
          />
        </div>
        {workspace && (
          <div className="order-4 flex w-full items-center gap-2 min-w-0 h-48px border-t border-t-solid border-divider min-[960px]:order-none min-[960px]:flex-1 min-[960px]:w-auto min-[960px]:h-51px min-[960px]:border-t-0">
            <Skeleton.Input active className={`w-120px! shrink-0 ${inputClass}`} />
            <Skeleton.Input active className={`flex-1 min-w-0! max-w-360px ${inputClass}`} />
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1 ml-auto">
          <div className="min-[520px]:hidden">
            <Skeleton.Avatar active size={36} shape="square" />
          </div>
          <div className="hidden min-[520px]:flex items-center gap-1">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <Skeleton.Avatar active key={key} size={36} shape="square" />
            ))}
          </div>
          <Skeleton.Avatar active size={32} shape="circle" />
        </div>
      </div>
    </header>
  );
}
