/** 应用页的分栏、环境工具栏和参数面板占位，供路由和页面数据等待共用。 */
import { Skeleton } from 'antd';
import type { Params } from 'react-router';
import { useAppSelector } from '@/store/hooks';
import { responsiveSplitPaneClassName } from '@/components/SplitPane/components/Frame';
import { CollectionSkeletonFrame } from './CollectionSkeletonFrame';

export const applicationSidebarStorageKey = 'parameter-management:split-pane:application:v1';
export const applicationSidebarDefaultWidth = 290;

// Ant Design 给内层占位条设了默认最小宽度，需跟随外层宽度才能保留工具栏右侧留白。
const skeletonInputWidth = '[&_.ant-skeleton-input]:min-w-0! [&_.ant-skeleton-input]:w-full!';

export function ApplicationEnvironmentToolbarSkeleton() {
  return (
    <div className="ml-2 flex min-w-0 flex-1 items-center gap-3 overflow-hidden" aria-hidden>
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        {[1, 2, 3].map((item) => (
          <Skeleton.Button key={item} active size="small" className="w-48px!" />
        ))}
      </div>
      <Skeleton.Input active size="small" className={`min-w-0 w-96px! ${skeletonInputWidth}`} />
    </div>
  );
}

/** 环境接口返回前按默认三列预留空间，沿用正文的面板宽度与横向滚动。 */
export function ApplicationEnvironmentPanelsSkeleton({ loadingLabel }: { loadingLabel?: string }) {
  const compact = useAppSelector((state) => state.preferences.layoutMode === 'compact');
  const showLineNumbers = useAppSelector((state) => state.preferences.editor.lineNumbers !== 'off');
  const editorLines =
    '[&_.ant-skeleton-paragraph]:m-0! [&_.ant-skeleton-paragraph>li]:h-8px! [&_.ant-skeleton-paragraph>li+li]:mt-3!';
  return (
    <div
      className="h-full overflow-x-auto [container:application-environments/inline-size]"
      role={loadingLabel ? 'status' : undefined}
      aria-label={loadingLabel}
    >
      <div className="flex min-h-full gap-layout" aria-hidden>
        {[1, 2, 3].map((panel) => (
          <div
            key={panel}
            className={`flex w-500px shrink-0 grow flex-col [@container_application-environments_(max-width:510px)]:max-w-full ${compact ? 'bg-surface border-r border-r-solid border-divider' : 'workspace-panel'}`}
          >
            <div className="flex h-48px shrink-0 items-center gap-1.5 px-3">
              <Skeleton.Input
                active
                className={`w-52px! [&_.ant-skeleton-input]:h-22px! ${skeletonInputWidth}`}
              />
              <Skeleton.Avatar active size={24} shape="square" />
              <div className="ml-auto flex items-center gap-1">
                <Skeleton.Avatar active size={24} shape="square" />
                <Skeleton.Input active size="small" className={`w-96px! ${skeletonInputWidth}`} />
              </div>
            </div>
            <div className="flex min-h-280px flex-1 overflow-hidden border-y border-y-solid border-divider">
              {showLineNumbers && (
                <div className="w-36px shrink-0 bg-canvas px-3 py-3">
                  <Skeleton
                    active
                    title={false}
                    paragraph={{ rows: 7, width: Array(7).fill(8) }}
                    className={editorLines}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 px-3 py-3">
                <Skeleton
                  active
                  title={false}
                  paragraph={{ rows: 7, width: ['24%', '43%', '35%', '53%', '20%', '39%', '30%'] }}
                  className={editorLines}
                />
              </div>
            </div>
            <div className="flex h-36px shrink-0 items-center gap-1 px-3">
              <Skeleton.Avatar active size={18} shape="square" />
              <Skeleton.Avatar active size={18} shape="square" />
              <Skeleton.Input
                active
                className={`ml-auto w-96px! [&_.ant-skeleton-input]:h-8px! ${skeletonInputWidth}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 沿用列表工具栏与行高，以扁平占位表示待加载的应用。 */
function ApplicationListSkeleton() {
  const compact = useAppSelector((state) => state.preferences.layoutMode === 'compact');
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface" aria-hidden>
      <div
        className={`workspace-collection-titlebar justify-between ${compact ? 'workspace-titlebar mb-3' : 'workspace-titlebar-layout workspace-titlebar-frame-edge'}`}
      >
        <div className="flex shrink-0 items-center gap-1.5">
          <Skeleton.Input
            active
            className={`w-64px! [&_.ant-skeleton-input]:h-16px! ${skeletonInputWidth}`}
          />
          <Skeleton.Avatar active size={20} shape="square" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {[1, 2, 3, 4].map((action) => (
            <Skeleton.Avatar key={action} active size={24} shape="square" />
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center px-4 pb-2">
        <Skeleton.Input
          active
          block
          className="min-w-0 flex-1 [&_.ant-skeleton-input]:min-w-0! [&_.ant-skeleton-input]:h-32px! [&_.ant-skeleton-input]:rounded-r-0!"
        />
        <Skeleton.Avatar
          active
          size={32}
          shape="square"
          className="shrink-0 [&_.ant-skeleton-avatar]:rounded-l-0!"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-10px overflow-hidden px-4 pt-1">
        {['w-3/5!', 'w-4/5!', 'w-2/3!', 'w-3/4!', 'w-1/2!', 'w-5/6!'].map((width) => (
          <div
            key={width}
            className="flex h-42px shrink-0 items-center gap-2.25 rounded-control border border-solid border-border px-2.5"
          >
            <Skeleton.Avatar active size={18} shape="square" />
            <Skeleton.Input
              active
              className={`${width} min-w-0 [&_.ant-skeleton-input]:h-12px! ${skeletonInputWidth}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApplicationSkeleton({ params }: { params?: Params }) {
  const hasApplication = Boolean(params?.appName);
  return (
    <div className={responsiveSplitPaneClassName}>
      <CollectionSkeletonFrame
        storageKey={applicationSidebarStorageKey}
        defaultWidth={applicationSidebarDefaultWidth}
        sidebarLabel="应用列表"
        integratedHeader={!hasApplication}
        narrowPane={hasApplication ? 'content' : 'sidebar'}
        titleContent={<Skeleton.Input active size="small" className="max-w-full" />}
        toolbar={hasApplication ? <ApplicationEnvironmentToolbarSkeleton /> : undefined}
        sidebar={<ApplicationListSkeleton />}
      >
        {hasApplication ? (
          <ApplicationEnvironmentPanelsSkeleton />
        ) : (
          <div className="grid min-h-full min-w-0 place-items-center px-6 py-12" aria-hidden>
            <div className="flex w-full max-w-300px flex-col items-center">
              <Skeleton.Avatar
                active
                size={80}
                shape="square"
                className="[&_.ant-skeleton-avatar]:rounded-ui!"
              />
              <Skeleton.Input
                active
                className={`mt-6 h-30px w-160px! max-w-full flex! items-center [&_.ant-skeleton-input]:h-16px! ${skeletonInputWidth}`}
              />
              <Skeleton.Input
                active
                className={`mt-3 h-24px w-full! flex! items-center [&_.ant-skeleton-input]:h-10px! ${skeletonInputWidth}`}
              />
              <Skeleton.Input
                active
                className={`hidden! h-24px w-3/5! items-center [@container_split-pane-content_(max-width:360px)]:flex! [&_.ant-skeleton-input]:h-10px! ${skeletonInputWidth}`}
              />
            </div>
          </div>
        )}
      </CollectionSkeletonFrame>
    </div>
  );
}
