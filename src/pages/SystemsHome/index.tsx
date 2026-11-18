/** 系统首页装配页签和弹窗，管理各目录的展示模式与共用分页尺寸。 */
import { useLayoutEffect, useRef, useState } from 'react';
import { Tabs } from 'antd';
import { useLocation, useNavigate } from 'react-router';
import type { AllSystemInfo, MySystemInfo, SystemRole } from '@/types/systems';
import CreateSystemModal from './components/CreateSystemModal';
import { SystemDetailsModal } from './components/SystemPresentation';
import MySystemsPanel from './components/MySystemsPanel';
import AllSystemsPanel from './components/AllSystemsPanel';
import { systemCardContainer, systemCardGrid } from './model/presentation';

const rowsPerPage = 2;
const tabLabelClassName = 'flex h-40px items-center gap-2 rounded-control px-3.5 font-600';

export default function SystemsHomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab') === 'all' ? 'all' : 'mine';
  const myView = params.get('mineView') === 'list' ? 'list' : 'card';
  const allView = params.get('allView') === 'list' ? 'list' : 'card';
  const role = params.get('role');
  const myRole: SystemRole | 'all' = role === 'V' || role === 'D' || role === 'R' ? role : 'all';
  const [creating, setCreating] = useState(false);
  const [createdVersion, setCreatedVersion] = useState(0);
  const [details, setDetails] = useState<MySystemInfo | AllSystemInfo | null>(null);
  const gridMeasureRef = useRef<HTMLDivElement>(null);
  const [defaultPageSize, setDefaultPageSize] = useState(0);

  // 保留另一目录的条件和其他 URL 参数；实时筛选替换历史，显式操作可以前进后退。
  function updateParams(changes: Record<string, string>, replace = false) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (next.toString() !== params.toString()) {
      void navigate(
        { search: next.toString(), hash: location.hash },
        { replace, preventScrollReset: true },
      );
    }
  }

  useLayoutEffect(() => {
    const grid = gridMeasureRef.current;
    if (!grid) return;

    // 空网格与正文共用列布局。只在首次挂载时读取，后续宽度变化不改分页。
    const measure = () => {
      const tracks = getComputedStyle(grid).gridTemplateColumns;
      const columns = tracks === 'none' ? 1 : tracks.trim().split(/\s+/).length;
      setDefaultPageSize(columns * rowsPerPage);
    };
    measure();
  }, []);

  return (
    <section
      className="min-w-0 px-[clamp(12px,2.5vw,32px)] py-4 min-[641px]:py-6 min-[961px]:py-8 [&_.ant-btn]:shadow-none!"
      aria-label="系统列表"
    >
      <div className={systemCardContainer} aria-hidden="true">
        <div ref={gridMeasureRef} className={systemCardGrid} />
      </div>
      {/* 页签首次打开时挂载，隐藏后保留面板和查询订阅，切换不重新启用查询。 */}
      <Tabs
        activeKey={tab}
        onChange={(key) => updateParams({ tab: key === 'all' ? key : '' })}
        classNames={{
          header:
            'before:hidden [&_.ant-tabs-nav-list]:rounded-ui [&_.ant-tabs-nav-list]:bg-surface [&_.ant-tabs-nav-list]:p-3px motion-reduce:[&_[role=tab]]:transition-none!',
          item: 'p-0! [&+.ant-tabs-tab]:ms-1!',
          // 沿用 Tabs 自带的指示器定位和动画，将下划线扩展为选中项底色。
          indicator: 'rounded-control motion-reduce:transition-none!',
        }}
        styles={{
          header: { marginBottom: 20 },
          item: { zIndex: 1 },
          indicator: { top: 3, bottom: 3, height: 'auto', background: 'var(--color-hover)' },
        }}
        items={[
          {
            key: 'mine',
            label: (
              <span className={`${tabLabelClassName} ${tab === 'mine' ? 'text-accent-text' : ''}`}>
                <span aria-hidden="true" className="i-lucide-user-round text-16px" />
                我的系统
              </span>
            ),
            children: (
              <MySystemsPanel
                key={createdVersion}
                view={myView}
                onViewChange={(view) => updateParams({ mineView: view === 'list' ? view : '' })}
                search={params.get('mineKeyword') ?? ''}
                onSearchChange={(value) => updateParams({ mineKeyword: value }, true)}
                role={myRole}
                onRoleChange={(value) => updateParams({ role: value === 'all' ? '' : value })}
                defaultPageSize={defaultPageSize || rowsPerPage}
                onCreate={() => setCreating(true)}
                onDetails={setDetails}
              />
            ),
          },
          {
            key: 'all',
            label: (
              <span className={`${tabLabelClassName} ${tab === 'all' ? 'text-accent-text' : ''}`}>
                <span aria-hidden="true" className="i-lucide-layout-grid text-16px" />
                所有系统
              </span>
            ),
            children: defaultPageSize > 0 && (
              <AllSystemsPanel
                view={allView}
                onViewChange={(view) => updateParams({ allView: view === 'list' ? view : '' })}
                keyword={params.get('allKeyword')?.trim() ?? ''}
                onKeywordChange={(value) => updateParams({ allKeyword: value })}
                defaultPageSize={defaultPageSize}
                onDetails={setDetails}
              />
            ),
          },
        ]}
      />
      {creating && (
        <CreateSystemModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setCreatedVersion((value) => value + 1);
            updateParams({ tab: '', mineKeyword: '', role: '' });
          }}
        />
      )}
      {details && <SystemDetailsModal system={details} onClose={() => setDetails(null)} />}
    </section>
  );
}
