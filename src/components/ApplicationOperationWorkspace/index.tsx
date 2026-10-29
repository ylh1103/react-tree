/**
 * 创建快照、发布、检查共用的参数对比工作区。
 * 当前只提供布局和本地视图切换；示例内容不进入业务缓存，也不作为实际快照或检查结果。
 */
import { useState } from 'react';
import { Alert, App, Button, Input, Select, Table, Tabs, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { MonacoDiffEditor, type MonacoDiffEditorProps } from '@/components/MonacoDiffEditor';
import { useSystemWorkspace } from '@/contexts/SystemContext';
import { applicationPath } from '@/router/paths';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';

/** 各操作只声明标题、比较方向与提示，共享视图不持有服务器状态。 */
const operations = {
  snapshot: {
    title: '创建快照',
    original: '最新快照参数',
    modified: '配置中心当前参数',
    tip: '请确认参数差异并填写快照说明，再创建快照。',
  },
  publish: {
    title: '发布',
    original: '配置中心当前参数',
    modified: '即将发布的参数',
    tip: '请确认修改记录信息，再进行发布。',
  },
  inspect: {
    title: '检查',
    original: '配置中心当前参数',
    modified: '运行时参数',
    tip: '对比配置中心与运行时参数，确认配置是否一致。',
  },
};

// 仅用于布局预览，使用无敏感信息的配置；两个视图始终展示相同的示例差异。
const exampleRows = [
  { key: 'server.port', original: '8080', modified: '8081' },
  { key: 'logging.level.root', original: 'info', modified: 'warn' },
  { key: 'spring.cache.enabled', original: 'false', modified: 'true' },
];
const originalExample = `# 示例配置，仅用于布局预览
application:
  name: demo-application
  version: 1.0.0

server:
  port: 8080

logging:
  level:
    root: info

spring:
  cache:
    enabled: false
  datasource:
    url: jdbc:mysql://localhost:3306/demo

management:
  endpoints:
    enabled: true
`;
const modifiedExample = originalExample
  .replace('port: 8080', 'port: 8081')
  .replace('root: info', 'root: warn')
  .replace('enabled: false', 'enabled: true');
const editorOptions: NonNullable<MonacoDiffEditorProps['options']> = {
  padding: { top: 12, bottom: 12 },
  renderSideBySide: true,
  renderSideBySideInlineBreakpoint: 0,
};

export function ApplicationOperationWorkspace({
  operation,
}: {
  operation: keyof typeof operations;
}) {
  const { system } = useSystemWorkspace();
  const { layoutMode } = useLayoutPreferences();
  const compact = layoutMode === 'compact';
  const { appName, envTag, version } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [view, setView] = useState('yaml');
  const [remark, setRemark] = useState('');
  const [publishMode, setPublishMode] = useState('normal');
  const config = operations[operation];
  const pending = () => void message.info(`${config.title}页面为布局预览，业务接口尚未接入`);

  return (
    <section
      aria-label={`${config.title}工作区`}
      className={`flex h-full min-h-580px min-w-0 flex-col overflow-hidden gap-layout ${compact ? 'bg-surface' : 'bg-canvas'}`}
    >
      {/* 标题与正文沿用标准布局的独立面板；紧凑布局仅保留区域间分隔线。 */}
      <header
        className={`${compact ? 'workspace-titlebar' : 'workspace-titlebar-detached'} gap-x-3!`}
      >
        <h2 className="workspace-page__title">{config.title}</h2>
        <div className="flex items-center gap-2">
          <Tag
            className="m-0! max-w-240px truncate border-accent-border! bg-hover! text-accent-text!"
            title={appName}
          >
            {appName ?? '未选择应用'}
          </Tag>
          <Tag className="m-0! font-mono">{envTag ?? '未选择环境'}</Tag>
        </div>
        {operation === 'snapshot' && version !== undefined && <Tag>基于快照 #{version}</Tag>}
        {operation === 'snapshot' ? (
          <Input
            aria-label="快照说明"
            placeholder="填写快照说明"
            maxLength={200}
            value={remark}
            onChange={(event) => setRemark(event.target.value)}
            className="w-340px! max-w-full"
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-13px text-text-secondary">快照版本列表：</span>
            <Select
              aria-label="快照版本列表"
              value={version ?? 'example'}
              className="w-320px"
              options={[
                {
                  value: version ?? 'example',
                  label:
                    version === undefined
                      ? '#4 示例快照 · 参数调整（布局预览）'
                      : `#${version} 快照（布局预览）`,
                },
              ]}
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {operation === 'publish' && (
            <Select
              aria-label="发布方式"
              value={publishMode}
              onChange={setPublishMode}
              className="w-120px"
              options={[
                { value: 'normal', label: '普通发布' },
                { value: 'gray', label: '灰度发布' },
              ]}
            />
          )}
          <Button type="primary" onClick={pending}>
            {config.title}
          </Button>
          <Button onClick={() => navigate(applicationPath(system.systemName, appName))}>
            关闭
          </Button>
        </div>
      </header>

      <div
        className={`flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden ${compact ? 'bg-surface' : 'workspace-panel'}`}
      >
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 border-b border-b-solid border-divider px-4">
          <Tabs
            aria-label="参数对比模式"
            activeKey={view}
            onChange={setView}
            size="small"
            className="[&_.ant-tabs-nav]:mb-0! [&_.ant-tabs-nav::before]:border-0!"
            items={[
              { key: 'yaml', label: 'YAML 模式对比' },
              { key: 'table', label: '表格模式对比（3 条示例差异）' },
            ]}
          />
          <span className="ml-auto py-2 text-12px text-text-muted">布局预览 · 示例参数</span>
        </div>

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="grid grid-cols-2 shrink-0 border-b border-b-solid border-divider bg-sidebar text-13px text-text-secondary">
            <div className="px-4 py-2.5">{config.original}</div>
            <div className="border-l border-l-solid border-divider px-4 py-2.5">
              {config.modified}
            </div>
          </div>
          <div
            className="relative flex-1 min-h-0 overflow-auto"
            role="region"
            aria-label="参数差异对比"
          >
            {view === 'yaml' ? (
              <div className="absolute inset-0">
                <MonacoDiffEditor
                  height="100%"
                  language="yaml"
                  original={originalExample}
                  modified={modifiedExample}
                  options={editorOptions}
                />
              </div>
            ) : (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={exampleRows}
                columns={[
                  { title: '参数名', dataIndex: 'key' },
                  { title: config.original, dataIndex: 'original' },
                  { title: config.modified, dataIndex: 'modified' },
                  {
                    title: '变更类型',
                    key: 'status',
                    render: () => <Tag color="orange">修改</Tag>,
                  },
                ]}
              />
            )}
          </div>
        </div>
        {/* 提示属于对比面板，与正文共用外框和底部圆角，不额外占用模块间距。 */}
        <footer className="shrink-0">
          <Alert
            className="rounded-0! border-0! bg-hover! px-4! py-2.5!"
            type="info"
            showIcon
            title={`提示：${config.tip}当前仅展示页面布局。`}
          />
        </footer>
      </div>
    </section>
  );
}
