/** 环境参数只读面板：用 Monaco 展示 YAML 配置，保留快照、审批信息及待接入的操作入口。 */
import { App, Badge, Button, Empty, Popover, Space, Tooltip, type TooltipProps } from 'antd';
import { MonacoEditor, type MonacoEditorProps } from '@/components/MonacoEditor';
import type { ApplicationEnvironment } from '@/types/applicationEnvironments';

// 与原只读面板的字号、行高保持一致；稳定选项避免元信息刷新时重复更新编辑器配置。
const configEditorOptions: NonNullable<MonacoEditorProps['options']> = {
  readOnly: true,
  domReadOnly: true,
  fontSize: 12,
  lineHeight: 22,
  padding: { top: 12, bottom: 12 },
};

// 默认 shift 阈值为箭头预留距离，即使关闭箭头，半露出的按钮仍可能把浮层推到视口外。
// 使用布尔 shift 优先保持浮层完整可见，避免 body 被撑宽；保留原有翻转及滚动重定位。
const viewportAlign: NonNullable<TooltipProps['align']> = {
  htmlRegion: 'visible',
  overflow: { adjustX: true, adjustY: true, shiftX: true, shiftY: true },
};

/** 操作入口先开放交互；直接使用 Button 承接焦点及组合样式，点击只提示待接入。 */
function PendingAction({
  label,
  icon,
  primary = false,
}: {
  label: string;
  icon?: string;
  primary?: boolean;
}) {
  const { message } = App.useApp();
  return (
    <Tooltip title={label} trigger={['hover', 'focus']} align={viewportAlign}>
      <Button
        size="small"
        type={primary ? 'primary' : 'default'}
        onClick={() => void message.info(`${label}功能尚未接入`)}
        aria-label={label}
        className="shrink-0 px-1.5! text-12px!"
        icon={icon ? <span className={`${icon} h-14px w-14px`} aria-hidden="true" /> : undefined}
      >
        {!icon && label}
      </Button>
    </Tooltip>
  );
}

function SnapshotVersion({
  label,
  version,
  message,
}: {
  label: string;
  version: number;
  message: string;
}) {
  return (
    <Popover
      align={viewportAlign}
      trigger={['hover', 'focus', 'click']}
      title={`${label}快照 #${version}`}
      content={
        <p className="m-0 max-w-280px whitespace-pre-wrap break-words text-13px">
          {message || '暂无快照创建信息'}
        </p>
      }
    >
      <Button
        size="small"
        type="text"
        className={`rounded-none! px-1.5! font-mono! text-12px! ${label === '运行时' ? 'bg-sidebar! text-text!' : 'bg-hover! text-accent-text!'}`}
        aria-label={`${label}快照版本 ${version}`}
      >
        #{version}
      </Button>
    </Popover>
  );
}

export function EnvironmentPanel({
  environment: env,
  compact,
  appType,
}: {
  environment: ApplicationEnvironment;
  compact: boolean;
  appType: '0' | '1';
}) {
  const common = appType === '1';
  const production = env.isPrd === '1';
  // 仅正数提示待处理差异，零及后端负数状态均不展示徽标。
  const differenceHint =
    env.runtimeDifferNum > 0 ? `运行时配置差异数：${env.runtimeDifferNum}` : undefined;
  const config = env.configInfo;
  return (
    <article
      className="flex h-full min-w-0 flex-col overflow-hidden bg-surface"
      aria-label={`${env.envTag} 环境参数配置`}
    >
      <header
        className={`shrink-0 border-b border-b-solid bg-surface ${compact ? 'border-divider' : 'border-border-subtle'}`}
      >
        {/* 单行工具栏紧邻配置内容；缩窄面板时横向滚动，避免操作换行挤占正文。 */}
        <div className="overflow-x-auto tree-scrollbar">
          <div
            role="toolbar"
            aria-label={`${env.envTag} 参数操作`}
            className="flex min-h-52px w-max min-w-full items-center gap-1.5 px-2 py-2 box-border whitespace-nowrap"
          >
            <Tooltip
              align={viewportAlign}
              title={`${env.envTag} · ${production ? '生产环境' : '非生产环境'}${!production && env.approvalRequiredFlag === 'Y' ? ' · 发布需审批' : ''}`}
              trigger={['hover', 'focus']}
            >
              <h3
                tabIndex={0}
                className="m-0 shrink-0 rounded-control bg-hover px-2 font-mono text-13px font-600 leading-24px text-accent layout-focus"
              >
                {env.envTag}
              </h3>
            </Tooltip>
            <PendingAction label="历史记录" icon="i-lucide-history" />
            {!common && (
              <>
                <PendingAction label="快照生成" icon="i-lucide-camera" />
                <div className="flex shrink-0 items-center overflow-hidden rounded-control border border-solid border-divider">
                  <SnapshotVersion
                    label="运行时"
                    version={env.currentVersion}
                    message={env.currentShotMessage}
                  />
                  <span className="h-12px w-1px bg-divider" aria-hidden="true" />
                  <SnapshotVersion
                    label="最新"
                    version={env.latestVersion}
                    message={env.latestShotMessage}
                  />
                </div>
              </>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <PendingAction label="上传文件" icon="i-lucide-file-up" />
              <PendingAction label={common ? '批量创建快照' : '创建快照'} />
              <Space.Compact size="small" role="group" aria-label="发布操作">
                <PendingAction label={common ? '批量发布快照' : '发布'} primary />
                {!common && !production && <PendingAction label="一键发布" icon="i-lucide-zap" />}
              </Space.Compact>
            </div>
            {!common && (
              // Compact 按钮悬停时层级升至 4；隔离当前组合并抬高徽标，避免数字下半部被遮挡。
              <Badge
                className="isolate mr-2.5 shrink-0"
                classNames={{ indicator: 'z-5!' }}
                count={env.runtimeDifferNum > 0 ? env.runtimeDifferNum : 0}
                overflowCount={999}
                size="small"
                color="var(--color-danger)"
                title={differenceHint}
                aria-label={differenceHint}
              >
                <Space.Compact size="small" role="group" aria-label="检查与刷新差异数">
                  <PendingAction label="检查" />
                  <PendingAction label="刷新差异数" icon="i-lucide-refresh-cw" />
                </Space.Compact>
              </Badge>
            )}
          </div>
        </div>
        {env.saveStatus === 'N' && (
          <p role="status" className="m-0 px-3 pb-3 text-12px text-text-secondary">
            未保存：{env.unsavedReason || '原因未提供'}
          </p>
        )}
      </header>
      {config.trim() ? (
        <div
          className="relative flex-1 min-h-280px min-w-0 overflow-hidden"
          role="region"
          aria-label={`${env.envTag} 配置内容（只读）`}
        >
          {/* 绝对定位填满分栏分配的高度，避免编辑器自身尺寸反向撑大父容器。 */}
          <div className="absolute inset-0">
            <MonacoEditor
              height="100%"
              language="yaml"
              // 系统、应用和环境共同隔离模型，切换或刷新时不复用其他配置的内容及撤销历史。
              path={`parameter://application/${encodeURIComponent(env.systemName)}/${encodeURIComponent(env.appName)}/${encodeURIComponent(env.envTag)}/config.yaml`}
              value={config}
              options={configEditorOptions}
            />
          </div>
        </div>
      ) : (
        <div className="grid flex-1 min-h-280px place-items-center p-6">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前环境暂无参数配置" />
        </div>
      )}
      <footer className="flex shrink-0 flex-wrap justify-between gap-1 border-t border-t-solid border-divider px-3 py-2 text-11px text-text-muted">
        <span>只读配置 · {common ? '公共应用' : '业务应用'}</span>
        <span title={env.techMntTime}>
          {env.maintUser} · {env.maintDate}
        </span>
      </footer>
    </article>
  );
}
