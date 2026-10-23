/**
 * 在 Vite 运行的 Node 环境中生成启动 HTML，复用正式 SVG 和 ResourceLoadingView 的布局。
 * 这里只生成静态标记，不挂载组件；浏览器显示这份 HTML 时无需先下载 React。
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { LoadingIndicator } from '../src/components/LoadingIndicator/index.tsx';
import { loadingStyles } from '../src/components/LoadingIndicator/model/styles.ts';
import { ResourceLoadingView } from '../src/components/ResourceLoading/LoadingView.tsx';

/**
 * 所有内置方案随 HTML 一起返回，避免读取浏览器缓存后再请求对应图标。
 * 各方案默认隐藏，由头部脚本设置的 data-bootstrap-loading-style 选择其中一款。
 * 此处只使用项目内的固定方案；浏览器缓存不参与 HTML 拼接，也不会在配置返回时重建这组 SVG。
 */
export function renderBootstrapLoading() {
  return renderToStaticMarkup(
    <div id="bootstrap-loading" className="fixed inset-0 overflow-auto font-sans">
      <ResourceLoadingView>
        {loadingStyles.map((item) => (
          <span
            key={item.id}
            data-loading-style={item.id}
            className={`hidden [[data-bootstrap-loading-style=${item.id}]_&]:inline-flex`}
          >
            <LoadingIndicator styleId={item.id} />
          </span>
        ))}
      </ResourceLoadingView>
    </div>,
  );
}
