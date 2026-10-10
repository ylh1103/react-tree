import { Button, Checkbox, Empty, Tooltip } from 'antd';
import { useLayoutPreferences } from '../preferences/useLayoutPreferences';
import { OverlayHorizontalScroll } from '../../components/OverlayHorizontalScroll';

// 布局预览数据；后续由应用关联的环境接口提供。
const previewEnvironments = [
  { key: 'dev', name: '开发环境' },
  { key: 'st', name: '系统测试' },
  { key: 'uat', name: '验收测试' },
  { key: 'local', name: '本地环境' },
  { key: 'stp', name: '预生产环境' },
];

interface EnvironmentSelectionProps {
  selectedEnvironments: string[];
  onChange: (keys: string[]) => void;
}

export function ApplicationParametersToolbar({
  selectedEnvironments,
  onChange,
}: EnvironmentSelectionProps) {
  const selectedCount = previewEnvironments.filter((item) =>
    selectedEnvironments.includes(item.key),
  ).length;
  const allSelected = selectedCount === previewEnvironments.length;
  return (
    <div className="grid min-w-0 flex-1 basis-520px grid-cols-1 items-center gap-x-16px gap-y-10px md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-12px">
        <Checkbox
          className="m-0! whitespace-nowrap text-13px!"
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          onChange={(event) =>
            onChange(event.target.checked ? previewEnvironments.map((item) => item.key) : [])
          }
        >
          全选
        </Checkbox>
        <Checkbox.Group
          aria-label="选择显示的应用环境"
          className="flex flex-wrap gap-x-4px gap-y-6px [&_.ant-checkbox-wrapper]:m-0! [&_.ant-checkbox-wrapper]:rounded-4px [&_.ant-checkbox-wrapper]:px-7px [&_.ant-checkbox-wrapper]:py-4px [&_.ant-checkbox-wrapper]:bg-sidebar [&_.ant-checkbox-wrapper-checked]:bg-hover [&_.ant-checkbox-wrapper-checked]:text-accent [&_.ant-checkbox-wrapper]:font-mono [&_.ant-checkbox-wrapper]:text-12px [&_.ant-checkbox-wrapper]:transition-colors [&_.ant-checkbox-wrapper]:duration-150 motion-reduce:[&_.ant-checkbox-wrapper]:transition-none [&_.ant-checkbox-wrapper:hover]:bg-hover"
          value={selectedEnvironments}
          options={previewEnvironments.map((item) => ({ label: item.key, value: item.key }))}
          onChange={(values) => onChange(values.map(String))}
        />
      </div>
      <div className="flex shrink-0 items-center justify-self-end gap-8px">
        <Tooltip title="参数接入后可进行跨环境比对">
          <Button
            size="small"
            disabled
            icon={<span className="i-lucide-columns-2 h-13px w-13px" aria-hidden="true" />}
          >
            环境比对
          </Button>
        </Tooltip>
        <Tooltip title="参数接入后可批量修改配置">
          <Button
            size="small"
            type="primary"
            disabled
            icon={<span className="i-lucide-list-filter h-13px w-13px" aria-hidden="true" />}
          >
            批量修改
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

export function ApplicationParametersWorkspace({
  selectedEnvironments,
  onChange,
}: EnvironmentSelectionProps) {
  const { layoutMode } = useLayoutPreferences();
  const compact = layoutMode === 'compact';
  const environments = previewEnvironments.filter((item) =>
    selectedEnvironments.includes(item.key),
  );
  return (
    <div className="flex min-w-0 min-h-full flex-col">
      <OverlayHorizontalScroll className={compact ? '' : 'bg-canvas'} label="各环境参数配置">
        {environments.length ? (
          <div
            className={`grid min-w-0 flex-1 grid-cols-[minmax(500px,1fr)] md:grid-cols-none md:grid-flow-col md:auto-cols-[minmax(500px,1fr)] ${compact ? '' : 'gap-4px'}`}
          >
            {environments.map((environment) => (
              <EnvironmentPanel key={environment.key} environment={environment} compact={compact} />
            ))}
          </div>
        ) : (
          <div className="grid flex-1 place-items-center min-h-320px p-24px bg-surface">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-text-secondary">
                  <p className="m-0 text-14px font-500">选择要查看的环境</p>
                  <p className="m-0 mt-6px text-13px">勾选上方环境，查看应用参数</p>
                </div>
              }
            >
              <Button
                size="small"
                onClick={() => onChange(previewEnvironments.map((item) => item.key))}
              >
                显示全部环境
              </Button>
            </Empty>
          </div>
        )}
      </OverlayHorizontalScroll>
    </div>
  );
}

function EnvironmentPanel({
  environment,
  compact,
}: {
  environment: (typeof previewEnvironments)[number];
  compact: boolean;
}) {
  return (
    <article
      className={`flex min-w-0 flex-col overflow-hidden ${compact ? 'border-b border-b-solid border-divider last:border-b-0 md:border-b-0 md:border-r md:border-r-solid md:last:border-r-0' : 'workspace-panel'}`}
      aria-label={`${environment.key} 环境参数配置`}
    >
      <header
        className={`shrink-0 border-b border-b-solid bg-surface ${compact ? 'border-divider' : 'border-border-subtle'}`}
      >
        <div className="flex items-center justify-between gap-12px px-16px pt-16px pb-12px">
          <div className="flex min-w-0 items-center gap-10px">
            <h3 className="m-0 shrink-0 rounded-4px bg-hover px-8px text-accent font-mono text-14px font-600 leading-28px">
              {environment.key}
            </h3>
            <span className="text-13px text-text-secondary">{environment.name}</span>
          </div>
          <Tooltip title="参数接入后可刷新配置">
            <Button
              size="small"
              type="text"
              disabled
              aria-label={`刷新 ${environment.key} 配置`}
              icon={<span className="i-lucide-refresh-cw w-13px h-13px" aria-hidden="true" />}
            />
          </Tooltip>
        </div>
        <div className="flex items-center justify-between gap-12px px-16px pb-12px">
          <span className="text-12px leading-20px text-text-secondary">参数待接入</span>
          <div className="flex items-center gap-8px">
            <Tooltip title="参数接入后可创建配置快照">
              <Button size="small" disabled>
                快照
              </Button>
            </Tooltip>
            <Tooltip title="参数接入后可发布配置">
              <Button size="small" type="primary" disabled>
                发布
              </Button>
            </Tooltip>
          </div>
        </div>
      </header>
      <div className="grid flex-1 place-items-center min-h-280px px-24px py-40px bg-surface">
        <Empty
          className="m-0! max-w-240px [&_.ant-empty-image]:h-28px! [&_.ant-empty-image]:mb-16px!"
          image={
            <span
              className="i-lucide-sliders-horizontal h-28px w-28px text-text-muted"
              aria-hidden="true"
            />
          }
          description={
            <div className="text-text-secondary">
              <p className="m-0 text-14px font-500 leading-22px">{environment.name}参数</p>
              <p className="m-0 mt-6px text-13px leading-22px">参数数据尚未接入</p>
            </div>
          }
        />
      </div>
    </article>
  );
}
