import { Button, Descriptions, Tag } from 'antd';
import { useNavigate } from 'react-router';
import { useSystemWorkspace } from '../features/systems/SystemContext';
import { descriptionText, roleLabel } from '../features/systems/model';
import { applicationPath, databasePath } from '../features/systems/paths';

export default function SystemOverviewPage() {
  const { system } = useSystemWorkspace();
  const navigate = useNavigate();
  return (
    <section className="workspace-panel min-h-full p-24px md:p-32px">
      <div className="flex flex-wrap items-center gap-12px mb-8px">
        <h2 className="m-0 text-22px font-600">{system.systemName}</h2>
        <Tag>{roleLabel(system.role)}</Tag>
      </div>
      <p className="m-0 text-text-secondary text-15px">{system.systemChineseName}</p>
      <p className="workspace-muted mt-16px mb-24px max-w-960px">
        {descriptionText(system.systemDesc)}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16px max-w-960px mb-32px">
        <div className="workspace-panel p-20px bg-sidebar">
          <p className="workspace-muted m-0">应用数</p>
          <p className="text-28px text-accent font-600 my-12px">{system.appCount ?? 0}</p>
          <Button onClick={() => navigate(applicationPath(system.systemName))}>查看应用参数</Button>
        </div>
        <div className="workspace-panel p-20px bg-sidebar">
          <p className="workspace-muted m-0">参数类型数</p>
          <p className="text-28px text-accent font-600 my-12px">{system.paramTypeCount ?? 0}</p>
          <Button onClick={() => navigate(databasePath(system.systemName))}>查看数据库参数</Button>
        </div>
      </div>
      <Descriptions
        title="系统信息"
        column={{ xs: 1, sm: 1, md: 2 }}
        items={[
          { key: 'arch', label: '系统编号', children: system.systemArchNo || '—' },
          { key: 'risk', label: '风险等级', children: system.sysRiskLevel || '—' },
          { key: 'charges', label: '系统负责人', children: system.systemCharges || '—', span: 2 },
          { key: 'room', label: '所属室', children: system.ownRoom || '—' },
          { key: 'group', label: '所属组', children: system.ownGroup || '—' },
          { key: 'approver', label: '审批负责人', children: system.approverCharge || '—' },
        ]}
      />
    </section>
  );
}
