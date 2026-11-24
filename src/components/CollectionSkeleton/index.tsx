/** 通用业务清单的数据等待占位，随使用它的页面按需加载。 */
import { Skeleton } from 'antd';
import { CollectionSkeletonFrame } from '@/components/RouteSkeleton/components/CollectionSkeletonFrame';

export function CollectionSkeleton({
  storageKey,
  defaultWidth = 290,
  title,
  integratedHeader = false,
}: {
  storageKey: string;
  defaultWidth?: number;
  title: string;
  integratedHeader?: boolean;
}) {
  const content = integratedHeader ? (
    <div className="grid min-h-full min-w-0 place-items-center px-6 py-12">
      <div className="flex w-full max-w-440px flex-col items-center gap-6">
        <Skeleton.Avatar active size={80} shape="square" />
        <Skeleton.Input active className="w-240px!" />
        <Skeleton active title={false} paragraph={{ rows: 2 }} />
      </div>
    </div>
  ) : (
    <div className="p-5">
      <Skeleton active paragraph={{ rows: 10 }} />
    </div>
  );
  return (
    <CollectionSkeletonFrame
      storageKey={storageKey}
      defaultWidth={defaultWidth}
      sidebarLabel={`${title}列表`}
      integratedHeader={integratedHeader}
      titleContent={<Skeleton.Input active size="small" className="max-w-full" />}
      sidebar={
        <div className="workspace-panel min-h-full p-4">
          <Skeleton active paragraph={{ rows: 12 }} />
        </div>
      }
    >
      {content}
    </CollectionSkeletonFrame>
  );
}
