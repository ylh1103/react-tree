import { Skeleton } from 'antd';

/** 页头占位保持正式页头的 52px 高度；不挂载依赖系统上下文的切换控件和交互工具。 */
export function HeaderSkeleton() {
  const inputClass = '[&_.ant-skeleton-input]:min-w-0! [&_.ant-skeleton-input]:w-full!';
  return (
    <header
      className={`
        shrink-0 min-w-0 bg-header border-b border-b-solid border-divider
      `}
      aria-label="页头加载中"
      aria-busy
    >
      <div className="flex items-center gap-4 h-51px px-4" aria-hidden="true">
        <Skeleton.Avatar active size={28} shape="square" />
        <Skeleton.Input active size="small" className={`w-128px! ${inputClass}`} />
        <Skeleton.Input active className={`w-120px! ${inputClass}`} />
        <Skeleton.Input active className={`w-240px! ${inputClass}`} />
        <div className="flex shrink-0 items-center gap-1 ml-auto">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((key) => (
            <Skeleton.Avatar active key={key} size={36} shape="square" />
          ))}
        </div>
      </div>
    </header>
  );
}
