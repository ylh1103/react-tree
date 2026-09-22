import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowLeftOutlined,
  CodeOutlined,
  FileOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  SettingOutlined,
  AppstoreOutlined,
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
} from '@ant-design/icons';
import './WorkspacePage.css';

const panels = [
  { id: 'explorer', label: '资源管理器', icon: FileOutlined },
  { id: 'search', label: '搜索', icon: SearchOutlined },
  { id: 'settings', label: '设置', icon: SettingOutlined },
] as const;
type Panel = (typeof panels)[number]['id'];
const files = [
  {
    path: 'src/App.tsx',
    content: '// 应用入口\nexport default function App() {\n  return <Workspace />;\n}\n',
  },
  {
    path: 'src/router.tsx',
    content:
      '// 路由配置\nconst routes = [\n  { path: "/applications" },\n  { path: "/parameters" },\n  { path: "/workspace" },\n];\n',
  },
  {
    path: 'src/index.css',
    content:
      '/* 全局样式 */\n:root {\n  font-family: "Segoe UI", sans-serif;\n  color-scheme: dark;\n}\n',
  },
  {
    path: 'package.json',
    content: '{\n  "name": "react-tree",\n  "private": true,\n  "type": "module"\n}\n',
  },
  {
    path: 'README.md',
    content:
      '# React Tree\n\n欢迎来到工作台。\n\n左侧菜单切换面板，拖动侧栏右边缘调整宽度。\n再次点击当前菜单可隐藏侧栏。\n\n此处为布局演示文件，不会修改项目源码。\n',
  },
];
const MIN_WIDTH = 180;
const DEFAULT_WIDTH = 280;

export default function WorkspacePage() {
  const [panel, setPanel] = useState<Panel>('explorer');
  const [visible, setVisible] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [maxWidth, setMaxWidth] = useState(520);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState('');
  const [srcOpen, setSrcOpen] = useState(true);
  const [rootOpen, setRootOpen] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; width: number } | null>(null);
  const actualWidth = Math.min(width, maxWidth);
  const file = files.find((item) => item.path === selected);
  const matches = files.filter((item) => item.path.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const layout = layoutRef.current;
    if (!layout) return;
    const observer = new ResizeObserver(([entry]) => {
      setMaxWidth(Math.max(MIN_WIDTH, Math.min(520, entry.contentRect.width - 48 - 2 - 6 - 160)));
    });
    observer.observe(layout);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setVisible((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function selectPanel(next: Panel) {
    setVisible(next === panel ? !visible : true);
    setPanel(next);
  }
  function resize(next: number) {
    setWidth(Math.max(MIN_WIDTH, Math.min(maxWidth, next)));
  }
  function endDrag() {
    dragRef.current = null;
    setDragging(false);
  }
  function fileButton(item: (typeof files)[number], nested = false) {
    return (
      <button
        key={item.path}
        className={`workspace-file ${selected === item.path ? 'is-selected' : ''}`}
        style={{ paddingLeft: nested ? 38 : 22 }}
        onClick={() => setSelected(item.path)}
        aria-current={selected === item.path ? 'page' : undefined}
        title={item.path}
      >
        <FileOutlined aria-hidden="true" />
        <span>{item.path.split('/').pop()}</span>
      </button>
    );
  }

  return (
    <div className={`workspace ${dragging ? 'is-resizing' : ''}`}>
      <header className="workspace-titlebar">
        <CodeOutlined className="workspace-brand" aria-hidden="true" />
        <span>
          React Tree <span className="workspace-title-muted">/ 工作台</span>
        </span>
        <span className="workspace-title-center">react-tree</span>
        <button
          className="workspace-icon-button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? '隐藏侧边栏' : '显示侧边栏'}
          title="切换侧边栏 (Ctrl+B)"
          aria-expanded={visible}
          aria-controls="workspace-sidebar"
        >
          {visible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        </button>
        <Link to="/applications" className="workspace-back">
          <ArrowLeftOutlined /> 返回应用
        </Link>
      </header>
      <div className="workspace-layout" ref={layoutRef}>
        <div className={`workspace-left-panel ${visible ? '' : 'is-collapsed'}`}>
          <nav className="workspace-activity" aria-label="工作台菜单">
            {panels.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`workspace-activity-button ${visible && panel === id ? 'is-active' : ''}`}
                onClick={() => selectPanel(id)}
                aria-label={label}
                title={label}
                aria-expanded={visible && panel === id}
                aria-controls="workspace-sidebar"
              >
                <Icon aria-hidden="true" />
              </button>
            ))}
            <Link
              to="/applications"
              className="workspace-activity-button workspace-home"
              aria-label="应用列表"
              title="应用列表"
            >
              <AppstoreOutlined />
            </Link>
          </nav>
          <aside
            id="workspace-sidebar"
            className="workspace-sidebar"
            style={{ width: actualWidth }}
            hidden={!visible}
          >
            <div className="workspace-panel-heading">
              <h1>{panels.find((item) => item.id === panel)?.label}</h1>
              <button
                className="workspace-icon-button"
                aria-label="收起侧边栏"
                title="收起侧边栏"
                onClick={() => setVisible(false)}
              >
                <MenuFoldOutlined />
              </button>
            </div>
            <div className="workspace-panel-content">
              {panel === 'explorer' && (
                <>
                  <button
                    className="workspace-folder workspace-root"
                    onClick={() => setRootOpen((value) => !value)}
                    aria-expanded={rootOpen}
                  >
                    <RightOutlined className={rootOpen ? 'is-open' : ''} /> REACT-TREE
                  </button>
                  {rootOpen && (
                    <>
                      <button
                        className="workspace-folder"
                        onClick={() => setSrcOpen((value) => !value)}
                        aria-expanded={srcOpen}
                      >
                        <RightOutlined className={srcOpen ? 'is-open' : ''} />
                        {srcOpen ? <FolderOpenOutlined /> : <FolderOutlined />} src
                      </button>
                      {srcOpen &&
                        files
                          .filter((item) => item.path.startsWith('src/'))
                          .map((item) => fileButton(item, true))}
                      {files
                        .filter((item) => !item.path.startsWith('src/'))
                        .map((item) => fileButton(item))}
                    </>
                  )}
                </>
              )}
              {panel === 'search' && (
                <div className="workspace-search">
                  <label htmlFor="workspace-search-input">搜索演示文件</label>
                  <input
                    id="workspace-search-input"
                    placeholder="输入文件名…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <p role="status">{matches.length} 个结果</p>
                  {matches.map((item) => fileButton(item))}
                  {matches.length === 0 && <p>没有找到匹配的文件。</p>}
                </div>
              )}
              {panel === 'settings' && (
                <div className="workspace-settings">
                  <h2>布局设置</h2>
                  <p>拖动侧栏右边缘，调整工作区比例。</p>
                  <label htmlFor="workspace-width">
                    侧栏宽度 <span>{Math.round(actualWidth)} px</span>
                  </label>
                  <input
                    id="workspace-width"
                    type="range"
                    min={MIN_WIDTH}
                    max={maxWidth}
                    value={actualWidth}
                    onChange={(event) => resize(Number(event.target.value))}
                  />
                  <button className="workspace-secondary" onClick={() => setWidth(DEFAULT_WIDTH)}>
                    恢复默认宽度
                  </button>
                  <p>
                    快捷键 <kbd>Ctrl / ⌘</kbd> + <kbd>B</kbd> 切换侧栏。
                  </p>
                </div>
              )}
            </div>
            <div className="workspace-sidebar-footer">
              <span className="workspace-dot" /> 本地演示工作区
            </div>
          </aside>
        </div>
        {visible && (
          <div
            className="workspace-resizer"
            role="separator"
            tabIndex={0}
            aria-label="调整侧边栏宽度"
            aria-orientation="vertical"
            aria-controls="workspace-sidebar"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={Math.round(maxWidth)}
            aria-valuenow={Math.round(actualWidth)}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = { x: event.clientX, width: actualWidth };
              setDragging(true);
            }}
            onPointerMove={(event) => {
              if (dragRef.current)
                resize(dragRef.current.width + event.clientX - dragRef.current.x);
            }}
            onPointerUp={(event) => {
              endDrag();
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              resize(
                event.key === 'Home'
                  ? MIN_WIDTH
                  : event.key === 'End'
                    ? maxWidth
                    : actualWidth + (event.key === 'ArrowLeft' ? -10 : 10),
              );
            }}
          />
        )}
        <main className="workspace-main">
          {file ? (
            <>
              <div className="workspace-tabs">
                <div className="workspace-tab">
                  <FileOutlined />
                  <span>{file.path.split('/').pop()}</span>
                  <button
                    className="workspace-icon-button"
                    aria-label="关闭文件"
                    onClick={() => setSelected(null)}
                  >
                    <CloseOutlined />
                  </button>
                </div>
                <span className="workspace-readonly">只读演示</span>
              </div>
              <div className="workspace-breadcrumb">
                react-tree <RightOutlined /> {file.path}
              </div>
              <div className="workspace-code" aria-label={file.path}>
                {file.content.split('\n').map((line, index) => (
                  <div key={index} className="workspace-code-line">
                    <span aria-hidden="true">{index + 1}</span>
                    <code>{line || ' '}</code>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="workspace-welcome">
              <CodeOutlined className="workspace-watermark" aria-hidden="true" />
              <h2>你的下一次创造，从这里开始</h2>
              <p>一个专注、自由的工作空间</p>
              <div className="workspace-shortcuts">
                <button
                  onClick={() => {
                    setPanel('explorer');
                    setVisible(true);
                  }}
                >
                  <span>浏览项目文件</span>
                  <FileOutlined />
                </button>
                <button
                  onClick={() => {
                    setPanel('search');
                    setVisible(true);
                  }}
                >
                  <span>搜索文件</span>
                  <SearchOutlined />
                </button>
                <button onClick={() => setVisible((value) => !value)}>
                  <span>切换侧边栏</span>
                  <kbd>Ctrl / ⌘ B</kbd>
                </button>
              </div>
              <span className="workspace-welcome-note">拖拽侧栏边缘，找到适合你的布局</span>
            </div>
          )}
        </main>
      </div>
      <footer className="workspace-status">
        <span>
          <span className="workspace-dot" /> 工作区就绪
        </span>
        <span>
          {file ? file.path : 'React Tree'}
          <span className="workspace-status-detail">UTF-8 · TypeScript React</span>
        </span>
      </footer>
    </div>
  );
}
