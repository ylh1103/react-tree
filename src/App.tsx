import { GroupedListRefreshButton } from './features/grouped-list/GroupedListRefreshButton';
import { useEffect, useRef, useState } from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import {
  AppstoreOutlined,
  ApartmentOutlined,
  CodeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { NavLink, Outlet, useLocation } from 'react-router';

const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 260;
const STORAGE_KEY = 'react-tree:layout:v1';
function readLayout(): { width: number; visible: boolean } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return {
      width: Number.isFinite(saved?.width)
        ? Math.max(MIN_WIDTH, Math.min(640, saved.width))
        : DEFAULT_WIDTH,
      visible: typeof saved?.visible === 'boolean' ? saved.visible : true,
    };
  } catch {
    return { width: DEFAULT_WIDTH, visible: true };
  }
}

export default function App() {
  const [layout, setLayout] = useState(readLayout);
  const [availableWidth, setAvailableWidth] = useState(1000);
  const [dragging, setDragging] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ x: number; width: number } | null>(null);
  const { pathname } = useLocation();
  const pageLabel = pathname === '/parameters' ? '参数' : '应用';
  // 窄屏时允许侧栏占据剩余空间，主工作区仍可通过收起侧栏访问。
  const maxWidth = Math.max(0, Math.min(640, availableWidth - (availableWidth >= 600 ? 240 : 8)));
  const minWidth = Math.min(MIN_WIDTH, maxWidth);
  const width = Math.min(layout.width, maxWidth);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width));
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dragging) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      /* 存储不可用时仍可调整布局。 */
    }
  }, [layout, dragging]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
      )
        return;
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'b'
      ) {
        event.preventDefault();
        toggleRef.current?.focus();
        setLayout((value) => ({ ...value, visible: !value.visible }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function resize(next: number) {
    setLayout((value) => ({ ...value, width: Math.max(minWidth, Math.min(maxWidth, next)) }));
  }
  function toggleSidebar() {
    toggleRef.current?.focus();
    setLayout((value) => ({ ...value, visible: !value.visible }));
  }
  function endDrag() {
    dragRef.current = null;
    setDragging(false);
  }

  return (
    <ConfigProvider theme={{ token: { borderRadius: 4, fontSize: 14 } }}>
      <AntdApp component={false}>
        <div className={`app-shell${dragging ? ' is-resizing' : ''}`}>
          <header className="app-header">
            <svg className="app-logo" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M3 11 14 7v21L3 25Z" fill="#fa3155" />
              <path d="m14 2 9 4v24l-9-4Z" fill="#1677ff" />
              <path d="m23 6 7-3v19l-7 4Z" fill="#22b5ef" />
            </svg>
            <h1>灵动参数管家</h1>
            <span className="app-title-context">{pageLabel}管理</span>
            <button
              ref={toggleRef}
              className="app-icon-button app-layout-toggle"
              onClick={toggleSidebar}
              aria-label={layout.visible ? '隐藏侧边栏' : '显示侧边栏'}
              title="切换侧边栏 (Ctrl / ⌘ + B)"
              aria-expanded={layout.visible}
              aria-controls="app-explorer"
            >
              {layout.visible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            </button>
          </header>
          <div className="app-body">
            <aside className="app-sidebar" data-collapsed={!layout.visible}>
              <nav aria-label="主导航">
                {[
                  { to: '/applications', label: '应用', icon: AppstoreOutlined },
                  { to: '/parameters', label: '参数', icon: ApartmentOutlined },
                ].map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className="sidebar-link"
                    title={label}
                    aria-controls="app-explorer"
                    aria-expanded={pathname === to && layout.visible}
                    onClick={(event) => {
                      if (
                        event.ctrlKey ||
                        event.metaKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      )
                        return;
                      if (pathname === to) {
                        event.preventDefault();
                        setLayout((value) => ({ ...value, visible: !value.visible }));
                      } else setLayout((value) => ({ ...value, visible: true }));
                    }}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                ))}
                <NavLink to="/workspace" className="sidebar-link" title="工作台">
                  <CodeOutlined aria-hidden="true" />
                  <span>工作台</span>
                </NavLink>
              </nav>
            </aside>
            <div className="app-workbench" ref={bodyRef}>
              <aside
                id="app-explorer"
                className="app-explorer"
                hidden={!layout.visible}
                style={{ width }}
                aria-label={`${pageLabel}侧边栏`}
              >
                <div className="app-explorer-content">
                  <Outlet />
                </div>
                <div className="app-sidebar-tools">
                  <span>侧边栏</span>
                  <button
                    className="app-icon-button"
                    aria-label="缩小侧边栏"
                    title="缩小侧边栏"
                    disabled={width <= minWidth}
                    onClick={() => resize(width - 20)}
                  >
                    <MinusOutlined />
                  </button>
                  <button
                    className="app-width-reset"
                    title="恢复默认宽度"
                    onClick={() => resize(DEFAULT_WIDTH)}
                  >
                    {Math.round(width)} px
                  </button>
                  <button
                    className="app-icon-button"
                    aria-label="加宽侧边栏"
                    title="加宽侧边栏"
                    disabled={width >= maxWidth}
                    onClick={() => resize(width + 20)}
                  >
                    <PlusOutlined />
                  </button>
                  <button
                    className="app-icon-button"
                    aria-label="收起侧边栏"
                    title="收起侧边栏"
                    onClick={toggleSidebar}
                  >
                    <MenuFoldOutlined />
                  </button>
                </div>
              </aside>
              {layout.visible && (
                <div
                  className="app-resizer"
                  role="separator"
                  tabIndex={0}
                  aria-label="调整侧边栏宽度"
                  aria-orientation="vertical"
                  aria-controls="app-explorer"
                  aria-valuemin={Math.round(minWidth)}
                  aria-valuemax={Math.round(maxWidth)}
                  aria-valuenow={Math.round(width)}
                  title="拖拽调整宽度，双击恢复默认；方向键微调"
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    event.currentTarget.focus();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragRef.current = { x: event.clientX, width };
                    setDragging(true);
                  }}
                  onPointerMove={(event) => {
                    if (dragRef.current)
                      resize(dragRef.current.width + event.clientX - dragRef.current.x);
                  }}
                  onPointerUp={(event) => {
                    endDrag();
                    if (event.currentTarget.hasPointerCapture(event.pointerId))
                      event.currentTarget.releasePointerCapture(event.pointerId);
                  }}
                  onPointerCancel={endDrag}
                  onLostPointerCapture={endDrag}
                  onDoubleClick={() => resize(DEFAULT_WIDTH)}
                  onKeyDown={(event) => {
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault();
                    resize(
                      event.key === 'Home'
                        ? minWidth
                        : event.key === 'End'
                          ? maxWidth
                          : width + (event.key === 'ArrowLeft' ? -10 : 10),
                    );
                  }}
                />
              )}
              <main className="app-content" aria-label="主工作区">
                <div className="app-content-toolbar">
                  <GroupedListRefreshButton
                    id={pathname === '/parameters' ? 'parameters' : 'applications'}
                  />
                </div>
                <div className="app-welcome">
                  <AppstoreOutlined className="app-watermark" aria-hidden="true" />
                  <h2>灵动参数管家</h2>
                  <p>在侧边栏中浏览和管理{pageLabel}</p>
                  <button onClick={toggleSidebar}>
                    <span>{layout.visible ? '隐藏侧边栏' : '显示侧边栏'}</span>
                    <kbd>Ctrl / ⌘ B</kbd>
                  </button>
                </div>
              </main>
            </div>
          </div>
          <footer className="app-statusbar">
            <span>灵动参数管家</span>
            <span>{pageLabel}管理</span>
          </footer>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
