/** 系统首页装配页签和弹窗，管理共用的展示模式与分页尺寸。 */
import { useLayoutEffect, useRef, useState } from 'react';
import { Tabs } from 'antd';
import { useLocation } from 'react-router';
import type { AllSystemInfo, MySystemInfo, SystemInfo, SystemRole } from '@/types/systems';
import SystemManagementModal from './SystemManagement';
import SystemDetailsModal from './SystemDetails';
import SystemViewSwitch from './SystemList/SystemViewSwitch';
import MySystemsPanel from './MySystems';
import AllSystemsPanel from './AllSystems';
import { systemCardContainer, systemCardGrid } from './SystemList/layout';

const rowsPerPage = 2;
const tabLabelClassName =
  'flex h-40px items-center gap-2 rounded-control px-2.5 font-600 min-[360px]:px-3.5';

export default function SystemsHomePage() {
  const location = useLocation();
  // 只记录当前 Router 位置上的浅更新，真正导航时直接读取目标查询字符串。
  const [shallowSearch, setShallowSearch] = useState<{
    location: typeof location;
    search: string;
  }>();
  const search = shallowSearch?.location === location ? shallowSearch.search : location.search;
  const params = new URLSearchParams(search);
  const tab = params.get('tab') === 'all' ? 'all' : 'mine';
  const legacyView = params.get(tab === 'all' ? 'allView' : 'mineView');
  const view = (params.get('view') ?? legacyView) === 'list' ? 'list' : 'card';
  const role = params.get('role');
  const myRole: SystemRole | 'all' = role === 'V' || role === 'D' || role === 'R' ? role : 'all';
  const [management, setManagement] = useState<SystemInfo | 'create' | null>(null);
  const [createdVersion, setCreatedVersion] = useState(0);
  const [details, setDetails] = useState<MySystemInfo | AllSystemInfo | null>(null);
  const gridMeasureRef = useRef<HTMLDivElement>(null);
  const [defaultPageSize, setDefaultPageSize] = useState(0);

  // 原地替换查询字符串，保留 Router 写入的历史状态及其他参数。
  function updateParams(changes: Record<string, string>) {
    const url = new URL(window.location.href);
    if (url.pathname !== location.pathname) return;
    const next = url.searchParams;
    const previous = next.toString();
    // 旧链接按当前页签恢复展示模式，首次更新 URL 后由两个页签共用。
    if (next.has('mineView') || next.has('allView')) {
      if (view === 'list') next.set('view', view);
      next.delete('mineView');
      next.delete('allView');
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (next.toString() === previous) return;

    window.history.replaceState(window.history.state, '', url);
    setShallowSearch({ location, search: url.search });
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
        tabBarExtraContent={{
          right: (
            <SystemViewSwitch
              label="系统展示模式"
              view={view}
              onChange={(nextView) => updateParams({ view: nextView === 'list' ? nextView : '' })}
            />
          ),
        }}
        classNames={{
          header:
            'before:hidden [&_.ant-tabs-extra-content]:ms-2 [&_.ant-tabs-extra-content]:flex [&_.ant-tabs-extra-content]:items-center [&_.ant-tabs-nav-list]:rounded-control [&_.ant-tabs-nav-list]:bg-surface [&_.ant-tabs-nav-list]:p-3px motion-reduce:[&_[role=tab]]:transition-none!',
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
                view={view}
                search={params.get('mineKeyword') ?? ''}
                onSearchChange={(value) => updateParams({ mineKeyword: value })}
                role={myRole}
                onRoleChange={(value) => updateParams({ role: value === 'all' ? '' : value })}
                onClearFilters={() => updateParams({ mineKeyword: '', role: '' })}
                defaultPageSize={defaultPageSize || rowsPerPage}
                onCreate={() => setManagement('create')}
                onDetails={setDetails}
                onManage={setManagement}
              />
            ),
          },
          {
            key: 'all',
            label: (
              <span className={`${tabLabelClassName} ${tab === 'all' ? 'text-accent-text' : ''}`}>
                <span aria-hidden="true" className="i-lucide-layers text-16px" />
                所有系统
              </span>
            ),
            children: defaultPageSize > 0 && (
              <AllSystemsPanel
                view={view}
                keyword={params.get('allKeyword')?.trim() ?? ''}
                onKeywordChange={(value) => updateParams({ allKeyword: value })}
                defaultPageSize={defaultPageSize}
                onDetails={setDetails}
                onManage={setManagement}
              />
            ),
          },
        ]}
      />
      {management && (
        <SystemManagementModal
          key={management === 'create' ? 'create' : `edit:${management.systemName}`}
          system={management === 'create' ? undefined : management}
          onClose={() => setManagement(null)}
          onSaved={() => {
            setManagement(null);
            if (management !== 'create') return;
            setCreatedVersion((value) => value + 1);
            updateParams({ tab: '', mineKeyword: '', role: '' });
          }}
        />
      )}
      {details && <SystemDetailsModal system={details} onClose={() => setDetails(null)} />}
    </section>
  );
}
