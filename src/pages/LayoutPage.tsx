import { LayoutOutlined } from '@ant-design/icons';
import { SplitPane } from '../components/SplitPane/SplitPane';

interface LayoutPageProps {
  title: string;
  splitPane?: boolean;
}

export default function LayoutPage({ title, splitPane = false }: LayoutPageProps) {
  const content = (
    <div className="flex min-h-full flex-col items-center justify-center p-24px text-center text-text-muted">
      <LayoutOutlined
        className="text-[clamp(64px,12vw,160px)] text-watermark mb-20px"
        aria-hidden="true"
      />
      <h2 className="m-0 mb-12px text-18px font-500 text-text-secondary">{title}</h2>
      <p className="text-13px m-0">从左侧菜单切换页面，在这里开始工作。</p>
    </div>
  );

  if (!splitPane) return content;

  return (
    <SplitPane
      key={title}
      storageKey={`react-tree:split-pane:${title}:v1`}
      sidebarLabel={`${title}侧边栏`}
      sidebar={
        <div className="py-20px px-16px">
          <h2 className="m-0 mb-28px text-14px font-600">{title}</h2>
          <p className="text-13px text-text-secondary">侧边栏区域</p>
          <span className="text-12px leading-[1.8] text-text-muted">
            可以在这里放置当前页面的导航、筛选或辅助内容。
          </span>
        </div>
      }
    >
      {content}
    </SplitPane>
  );
}
