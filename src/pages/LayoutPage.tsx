import { LayoutOutlined } from '@ant-design/icons';
import { SplitPane } from '../components/SplitPane/SplitPane';

interface LayoutPageProps {
  title: string;
  splitPane?: boolean;
}

export default function LayoutPage({ title, splitPane = false }: LayoutPageProps) {
  const content = (
    <div
      className={`flex flex-1 flex-col items-center justify-center p-32px text-center ${splitPane ? 'min-h-full' : 'min-h-0'}`}
    >
      <div className="grid place-items-center w-56px h-56px mb-18px border border-solid border-border rounded-12px text-accent bg-sidebar text-24px">
        <LayoutOutlined aria-hidden="true" />
      </div>
      <h3 className="m-0 mb-8px text-text-secondary text-15px font-500">{title}工作区</h3>
      <p className="max-w-360px m-0 text-text-muted text-13px leading-22px">
        当前暂无内容，可从左侧导航切换其他功能。
      </p>
    </div>
  );

  if (!splitPane)
    return (
      <section className="flex flex-col min-h-full border border-solid border-border rounded-8px bg-surface">
        <div className="flex items-center min-h-49px px-20px border-b border-b-solid border-divider">
          <h2 className="workspace-page__title">{title}</h2>
        </div>
        {content}
      </section>
    );

  return (
    <SplitPane
      key={title}
      storageKey={`react-tree:split-pane:${title}:v1`}
      sidebarLabel={`${title}侧边栏`}
      title={title}
      sidebar={
        <div>
          <div className="flex items-center min-h-49px px-16px border-b border-b-solid border-divider">
            <h2 className="workspace-page__title">{title}导航</h2>
          </div>
          <div className="py-20px px-16px text-text-muted text-13px leading-22px">
            <p className="m-0 mb-8px text-text-secondary font-500">
              暂无{title === '搜索' ? '筛选条件' : '导航内容'}
            </p>
            <span className="text-12px">当前工作区尚未配置内容。</span>
          </div>
        </div>
      }
    >
      {content}
    </SplitPane>
  );
}
