/** 应用参数页私有的空状态、环境工具栏和参数面板；环境选择由页面统一持有。 */
import { App as AntdApp, Button, Checkbox, Empty, Popover, Switch, Tooltip } from 'antd';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import {
  actionLabelModes,
  fitToolbarLayout,
  type ActionLabelMode,
  type ToolbarLayout,
} from './toolbarLayout';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';
import { OverlayScroll } from '@/components/OverlayScroll';

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

export function ApplicationParametersEmptyState({
  applicationCount,
  onRefresh,
  refreshing,
}: {
  applicationCount: number;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const hasApplications = applicationCount > 0;
  return (
    <div className="w-full max-w-440px text-center">
      <Empty
        className="m-0! [&_.ant-empty-image]:h-auto! [&_.ant-empty-image]:mb-6!"
        image={
          <div
            className="relative mx-auto grid h-80px w-80px place-items-center rounded-ui border border-solid border-accent-border bg-hover"
            aria-hidden="true"
          >
            <span className="i-lucide-panels-top-left h-32px w-32px text-accent" />
            <span className="absolute -bottom-2 -right-2 grid h-30px w-30px place-items-center rounded-full border-3 border-solid border-surface bg-accent">
              <span className="i-lucide-mouse-pointer-2 h-14px w-14px text-on-accent" />
            </span>
          </div>
        }
        description={
          <div>
            <h3 className="m-0 text-20px font-600 leading-30px text-text">
              {hasApplications ? '选择应用，查看参数' : '当前系统暂无应用'}
            </h3>
            <p className="m-0 mt-3 text-14px leading-24px text-text-secondary">
              {hasApplications
                ? '从左侧应用列表中选择一个应用，查看各环境的参数配置。'
                : '应用接入后，可在此查看参数配置。刷新列表可获取最新应用。'}
            </p>
          </div>
        }
      >
        {!hasApplications ? (
          <Button
            onClick={onRefresh}
            loading={refreshing}
            icon={<span className="i-lucide-refresh-cw h-14px w-14px" aria-hidden="true" />}
          >
            刷新应用列表
          </Button>
        ) : null}
      </Empty>
    </div>
  );
}

/** 按实际剩余宽度收纳环境与按钮文字，环境选择及比对状态不随收纳改变。 */
export function ApplicationParametersToolbar({
  selectedEnvironments,
  onChange,
}: EnvironmentSelectionProps) {
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ToolbarLayout>({
    visibleCount: previewEnvironments.length,
    actionLabelMode: 'icons',
    showMoreLabel: false,
  });
  const { visibleCount, actionLabelMode, showMoreLabel } = layout;
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowId = useId();
  // 应用切换会重新挂载工具栏，首帧绘制前完成测量，避免图标先显示再补上文字。
  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    const comparison = comparisonRef.current;
    const measure = measureRef.current;
    if (!toolbar || !comparison || !measure) return;
    let previous: ToolbarLayout | undefined;
    function updateLayout() {
      if (!toolbar || !comparison || !measure) return;
      const labels = Array.from(measure.querySelectorAll('label'));
      const widthOf = (selector: string) =>
        measure.querySelector(selector)?.getBoundingClientRect().width ?? 0;
      const gap = parseFloat(getComputedStyle(toolbar).columnGap) || 0;
      const comparisonGroup = comparison.parentElement;
      const comparisonGap = comparisonGroup
        ? parseFloat(getComputedStyle(comparisonGroup).columnGap) || 0
        : 0;
      const dividerWidth =
        comparisonGroup?.querySelector('[data-toolbar-divider]')?.getBoundingClientRect().width ??
        0;
      const next = fitToolbarLayout({
        // 标题自然占宽后，flex 分配给工具栏的宽度就是可用空间，无需预估标题长度。
        availableWidth:
          toolbar.clientWidth -
          comparison.getBoundingClientRect().width -
          comparisonGap * 2 -
          dividerWidth,
        allWidth: labels[0]?.getBoundingClientRect().width ?? 0,
        environmentWidths: labels.slice(1).map((label) => label.getBoundingClientRect().width),
        moreWidths: { label: widthOf('[data-more="label"]'), icon: widthOf('[data-more="icon"]') },
        actionWidths: {
          all: widthOf('[data-actions="all"]'),
          primary: widthOf('[data-actions="primary"]'),
          icons: widthOf('[data-actions="icons"]'),
        },
        groupGap: gap,
        previous,
      });
      previous = next;
      setLayout((current) =>
        current.visibleCount === next.visibleCount &&
        current.actionLabelMode === next.actionLabelMode &&
        current.showMoreLabel === next.showMoreLabel
          ? current
          : next,
      );
    }
    const observer = new ResizeObserver(updateLayout);
    [
      toolbar,
      comparison,
      measure,
      ...measure.querySelectorAll('[data-actions], [data-more], label'),
    ].forEach((element) => observer.observe(element));
    updateLayout();
    return () => observer.disconnect();
  }, []);
  const visibleEnvironments = previewEnvironments.slice(0, visibleCount);
  const overflowEnvironments = previewEnvironments.slice(visibleCount);
  const overflowSelectedCount = overflowEnvironments.filter((item) =>
    selectedEnvironments.includes(item.key),
  ).length;
  const { message } = AntdApp.useApp();
  const selectedCount = previewEnvironments.filter((item) =>
    selectedEnvironments.includes(item.key),
  ).length;
  const comparisonHint = comparisonEnabled
    ? `正在比对 ${selectedEnvironments.join(' / ')}，关闭比对后可调整环境`
    : selectedCount === 2
      ? '开启所选两个环境的比对'
      : '请恰好勾选两个环境后开启比对';
  const selectionProps = {
    selectedEnvironments,
    disabled: comparisonEnabled,
    onChange: (keys: string[]) => {
      if (!comparisonEnabled) onChange(keys);
    },
  };
  return (
    <div ref={toolbarRef} className="ml-2 flex min-w-0 flex-1 items-center justify-between gap-3">
      <div
        aria-hidden="true"
        inert
        ref={measureRef}
        className="absolute left-0 top-0 invisible pointer-events-none w-max"
      >
        <EnvironmentCheckboxes
          selectedEnvironments={[]}
          onChange={() => {}}
          disabled={false}
          environments={previewEnvironments}
          inline
        />
        {(['label', 'icon'] as const).map((mode) => (
          <Button
            key={mode}
            data-more={mode}
            type="text"
            className="px-1.5! gap-1! text-12px!"
            icon={<span className="i-lucide-ellipsis w-16px h-16px" />}
          >
            {mode === 'label' && <span>更多</span>}
            <span className="min-w-16px rounded-control bg-hover px-1 text-11px text-accent-text tabular-nums">
              5
            </span>
          </Button>
        ))}
        {actionLabelModes.map((mode) => (
          <div key={mode} data-actions={mode} className="w-max">
            <ToolbarActions labelMode={mode} />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-1">
          <EnvironmentCheckboxes {...selectionProps} environments={visibleEnvironments} inline />
          {overflowEnvironments.length > 0 && (
            <Popover
              trigger="click"
              placement="bottomLeft"
              open={overflowOpen}
              onOpenChange={setOverflowOpen}
              content={
                <div id={overflowId} className="min-w-100px max-w-240px">
                  <EnvironmentCheckboxes
                    {...selectionProps}
                    environments={overflowEnvironments}
                    showAll={false}
                  />
                </div>
              }
            >
              <Tooltip
                title={
                  overflowOpen
                    ? undefined
                    : `收起 ${overflowEnvironments.length} 个环境，已选 ${overflowSelectedCount} 个`
                }
                trigger={['hover', 'focus']}
              >
                <Button
                  type="text"
                  className="px-1.5! gap-1! text-12px! text-text-secondary!"
                  aria-label={`更多环境，${overflowEnvironments.length} 个环境中已选 ${overflowSelectedCount} 个`}
                  aria-expanded={overflowOpen}
                  aria-controls={overflowId}
                  icon={<span className="i-lucide-ellipsis w-16px h-16px" aria-hidden="true" />}
                >
                  {showMoreLabel && <span>更多</span>}
                  {overflowSelectedCount > 0 && (
                    <span className="min-w-16px rounded-control bg-hover px-1 text-11px text-accent-text tabular-nums">
                      {overflowSelectedCount}
                    </span>
                  )}
                </Button>
              </Tooltip>
            </Popover>
          )}
        </div>
        <span data-toolbar-divider className="h-18px w-1px bg-divider" aria-hidden="true" />
        <Tooltip title={comparisonHint} trigger={['hover', 'focus']}>
          <div
            ref={comparisonRef}
            role="group"
            aria-label={comparisonHint}
            tabIndex={!comparisonEnabled && selectedCount !== 2 ? 0 : undefined}
            className="flex shrink-0 items-center gap-2 rounded-control layout-focus"
          >
            {comparisonEnabled ? (
              <span
                role="status"
                className="flex items-center gap-1.5 text-13px text-text whitespace-nowrap"
              >
                <span
                  className="i-lucide-lock-keyhole w-12px h-12px text-text-muted"
                  aria-hidden="true"
                />
                {selectedEnvironments.join(' ↔ ')}
              </span>
            ) : (
              <span className="text-13px whitespace-nowrap">环境比对</span>
            )}
            <Switch
              aria-label="环境比对"
              aria-description={comparisonHint}
              checked={comparisonEnabled}
              disabled={!comparisonEnabled && selectedCount !== 2}
              onChange={(checked) => {
                if (!checked || selectedCount === 2) setComparisonEnabled(checked);
              }}
            />
          </div>
        </Tooltip>
      </div>
      <ToolbarActions
        labelMode={actionLabelMode}
        onAction={(label) => void message.info(`${label}功能尚未接入`)}
      />
    </div>
  );
}

const toolbarActions = [
  { label: '快照对比', icon: 'i-lucide-git-compare-arrows', primary: true },
  { label: '参数值加密及验证', icon: 'i-lucide-shield-check', primary: false },
  { label: '一键修改多环境配置', icon: 'i-lucide-file-pen-line', primary: false },
];

/** 测量副本和可见按钮复用同一结构；只过渡颜色，避免首帧测量切换文字时触发尺寸动画。 */
function ToolbarActions({
  labelMode,
  onAction,
}: {
  labelMode: ActionLabelMode;
  onAction?: (label: string) => void;
}) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {toolbarActions.map((action) => {
        const showLabel = labelMode === 'all' || (labelMode === 'primary' && action.primary);
        return (
          <Tooltip key={action.label} title={action.label} trigger={['hover', 'focus']}>
            <Button
              type={action.primary ? 'primary' : 'default'}
              aria-label={action.label}
              className={`[transition-property:color,background-color,border-color,box-shadow]! ${showLabel ? '' : 'w-32px! px-0! gap-0!'}`}
              icon={<span className={`${action.icon} h-16px w-16px`} aria-hidden="true" />}
              onClick={() => onAction?.(action.label)}
            >
              {showLabel && <span>{action.label}</span>}
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );
}

function EnvironmentCheckboxes({
  selectedEnvironments,
  onChange,
  disabled,
  environments,
  inline = false,
  showAll = true,
}: EnvironmentSelectionProps & {
  disabled: boolean;
  environments: typeof previewEnvironments;
  inline?: boolean;
  showAll?: boolean;
}) {
  const selectedCount = previewEnvironments.filter((item) =>
    selectedEnvironments.includes(item.key),
  ).length;
  return (
    <div className={inline ? 'flex shrink-0 items-center gap-2' : 'flex flex-col gap-3'}>
      {showAll && (
        <Checkbox
          className="m-0! whitespace-nowrap text-13px!"
          disabled={disabled}
          checked={selectedCount === previewEnvironments.length}
          indeterminate={selectedCount > 0 && selectedCount < previewEnvironments.length}
          onChange={(event) =>
            onChange(event.target.checked ? previewEnvironments.map((item) => item.key) : [])
          }
        >
          全选
        </Checkbox>
      )}
      <div
        role="group"
        aria-label={showAll ? '选择显示的应用环境' : '收起的应用环境'}
        className={`gap-1 [&_.ant-checkbox-wrapper]:m-0! [&_.ant-checkbox-wrapper]:rounded-control [&_.ant-checkbox-wrapper]:px-1.5 [&_.ant-checkbox-wrapper]:py-1 [&_.ant-checkbox-wrapper]:text-text! [&_.ant-checkbox-wrapper:hover]:bg-sidebar [&_.ant-checkbox-wrapper-checked]:bg-sidebar [&_.ant-checkbox-wrapper]:font-mono [&_.ant-checkbox-wrapper]:text-12px ${inline ? 'flex flex-nowrap' : 'flex flex-wrap'}`}
      >
        {environments.map((environment) => (
          <Checkbox
            key={environment.key}
            disabled={disabled}
            checked={selectedEnvironments.includes(environment.key)}
            onChange={(event) => {
              const next = new Set(selectedEnvironments);
              if (event.target.checked) next.add(environment.key);
              else next.delete(environment.key);
              onChange(
                previewEnvironments.filter((item) => next.has(item.key)).map((item) => item.key),
              );
            }}
          >
            {environment.key}
          </Checkbox>
        ))}
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
      <OverlayScroll className={compact ? '' : 'bg-canvas'} label="各环境参数配置">
        {environments.length ? (
          <div className="grid min-w-0 flex-1 grid-flow-col auto-cols-[minmax(500px,1fr)] gap-layout">
            {environments.map((environment) => (
              <EnvironmentPanel key={environment.key} environment={environment} compact={compact} />
            ))}
          </div>
        ) : (
          <div className="grid flex-1 place-items-center min-h-320px p-6 bg-surface">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-text-secondary">
                  <p className="m-0 text-14px font-500">选择要查看的环境</p>
                  <p className="m-0 mt-1.5 text-13px">勾选上方环境，查看应用参数</p>
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
      </OverlayScroll>
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
      className={`flex min-w-0 flex-col overflow-hidden ${compact ? 'border-r border-r-solid border-divider last:border-r-0' : 'workspace-panel'}`}
      aria-label={`${environment.key} 环境参数配置`}
    >
      <header
        className={`shrink-0 border-b border-b-solid bg-surface ${compact ? 'border-divider' : 'border-border-subtle'}`}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <h3 className="m-0 shrink-0 rounded-ui bg-hover px-2 text-accent font-mono text-14px font-600 leading-28px">
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
        <div className="flex items-center justify-between gap-3 px-4 pb-3">
          <span className="text-12px leading-20px text-text-secondary">参数待接入</span>
          <div className="flex items-center gap-2">
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
      <div className="grid flex-1 place-items-center min-h-280px px-6 py-10 bg-surface">
        <Empty
          className="m-0! max-w-240px [&_.ant-empty-image]:h-28px! [&_.ant-empty-image]:mb-4!"
          image={
            <span
              className="i-lucide-sliders-horizontal h-28px w-28px text-text-muted"
              aria-hidden="true"
            />
          }
          description={
            <div className="text-text-secondary">
              <p className="m-0 text-14px font-500 leading-22px">{environment.name}参数</p>
              <p className="m-0 mt-1.5 text-13px leading-22px">参数数据尚未接入</p>
            </div>
          }
        />
      </div>
    </article>
  );
}
