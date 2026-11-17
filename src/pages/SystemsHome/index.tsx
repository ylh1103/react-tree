/** 系统首页只装配页签和弹窗；两份目录各自管理查询、筛选与不同的分页策略。 */
import { useState } from 'react';
import { Tabs } from 'antd';
import type { AllSystemInfo, MySystemInfo } from '@/types/systems';
import CreateSystemModal from './components/CreateSystemModal';
import { SystemDetailsModal } from './components/SystemPresentation';
import MySystemsPanel from './components/MySystemsPanel';
import AllSystemsPanel from './components/AllSystemsPanel';

export default function SystemsHomePage() {
  const [tab, setTab] = useState('mine');
  const [creating, setCreating] = useState(false);
  const [createdVersion, setCreatedVersion] = useState(0);
  const [details, setDetails] = useState<MySystemInfo | AllSystemInfo | null>(null);
  return (
    <section
      className="min-w-0 px-[clamp(12px,2.5vw,32px)] py-4 min-[641px]:py-6 min-[961px]:py-8 [&_.ant-btn]:shadow-none!"
      aria-label="系统列表"
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        className="[&_.ant-tabs-nav]:mb-5! [&_.ant-tabs-tab]:pt-0! [&_.ant-tabs-tab]:pb-3!"
        items={[
          {
            key: 'mine',
            label: '我的系统',
            children: (
              <MySystemsPanel
                key={createdVersion}
                active={tab === 'mine'}
                onCreate={() => setCreating(true)}
                onDetails={setDetails}
              />
            ),
          },
          {
            key: 'all',
            label: '所有系统',
            children: <AllSystemsPanel active={tab === 'all'} onDetails={setDetails} />,
          },
        ]}
      />
      {creating && (
        <CreateSystemModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setCreatedVersion((value) => value + 1);
            setTab('mine');
          }}
        />
      )}
      {details && <SystemDetailsModal system={details} onClose={() => setDetails(null)} />}
    </section>
  );
}
