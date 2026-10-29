/** 环境参数编辑面板：用 Monaco 编辑 YAML 本地草稿，保留快照、审批信息及待接入的操作入口。 */
import { App, Badge, Button, Space, Tooltip, type TooltipProps } from 'antd';
import { MonacoEditor, type MonacoEditorProps } from '@/components/MonacoEditor';
import type { ApplicationEnvironment } from '@/types/applicationEnvironments';
import { useNavigate } from 'react-router';
import { applicationOperationPath } from '@/router/paths';
import { useCallback, useState, useSyncExternalStore, type ReactNode } from 'react';
import { EnvironmentTag } from './EnvironmentTag';
import { EnvironmentModificationInfo } from './EnvironmentModificationInfo';
import { ToolbarOverflowFade } from './ToolbarOverflowFade';

type ConfigEditor = Parameters<NonNullable<MonacoEditorProps['onMount']>>[0];

/** 只订阅当前编辑器的光标与模型切换，移动光标不重渲染工具栏；卸载或换实例时释放监听。 */
function EditorCursorPosition({ editor }: { editor: ConfigEditor | null }) {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!editor) return () => {};
      const cursor = editor.onDidChangeCursorPosition(notify);
      const model = editor.onDidChangeModel(notify);
      return () => {
        cursor.dispose();
        model.dispose();
      };
    },
    [editor],
  );
  const getSnapshot = useCallback(() => {
    const position = editor?.getPosition();
    return `行 ${position?.lineNumber ?? 1}，列 ${position?.column ?? 1}`;
  }, [editor]);
  const position = useSyncExternalStore(subscribe, getSnapshot, () => '行 1，列 1');
  return (
    <span className="shrink-0 tabular-nums" aria-label={`光标位置：${position}`}>
      {position}
    </span>
  );
}

// 保持行高及选项引用稳定，字号使用用户偏好；空配置和已有配置使用相同的可编辑模式。
const configEditorOptions: NonNullable<MonacoEditorProps['options']> = {
  readOnly: false,
  domReadOnly: false,
  padding: { top: 12, bottom: 12 },
};

// 默认 shift 阈值为箭头预留距离，即使关闭箭头，半露出的按钮仍可能把浮层推到视口外。
// 使用布尔 shift 优先保持浮层完整可见，避免 body 被撑宽；保留原有翻转及滚动重定位。
const viewportAlign: NonNullable<TooltipProps['align']> = {
  htmlRegion: 'visible',
  overflow: { adjustX: true, adjustY: true, shiftX: true, shiftY: true },
};

/** 已有布局的操作进入独立页面，其余入口提示待接入；保留原有按钮与焦点行为。 */
function PendingAction({
  label,
  icon,
  primary = false,
  to,
}: {
  label: string;
  icon?: string;
  primary?: boolean;
  to?: string;
}) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  return (
    <Tooltip title={label} trigger={['hover', 'focus']} align={viewportAlign}>
      <Button
        size="small"
        type={primary ? 'primary' : 'default'}
        onClick={() => (to ? navigate(to) : void message.info(`${label}功能尚未接入`))}
        aria-label={label}
        className="shrink-0 px-1.5! text-12px!"
        icon={icon ? <span className={`${icon} h-14px w-14px`} aria-hidden="true" /> : undefined}
      >
        {!icon && label}
      </Button>
    </Tooltip>
  );
}

/** 合并两种快照的信息入口；标识与浮层共享顺序和配色，便于识别尚未运行的最新版本。 */
function SnapshotVersions({ environment: env }: { environment: ApplicationEnvironment }) {
  const versionsDiffer = env.currentVersion !== env.latestVersion;
  return (
    <Tooltip
      align={viewportAlign}
      placement="bottomLeft"
      trigger={['hover', 'focus', 'click']}
      color="var(--color-surface)"
      classNames={{
        root: 'max-w-[min(380px,calc(100vw-24px))]!',
        container: 'px-3! py-2.5! text-text! border border-solid border-border-subtle',
      }}
      title={
        <div className="flex flex-col gap-2 text-12px leading-20px">
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 font-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-2px bg-text" aria-hidden="true" />
              最新的快照版本
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-2px bg-success" aria-hidden="true" />
              运行时快照版本
            </span>
          </div>
          <div className="flex flex-col gap-1 whitespace-pre-wrap break-words">
            <p className="m-0">
              <span className="mr-1.5 font-mono font-600">#{env.latestVersion}</span>
              {env.latestShotMessage || '暂无快照创建信息'}
            </p>
            <p className="m-0">
              <span className="mr-1.5 font-mono font-600">#{env.currentVersion}</span>
              {env.currentShotMessage || '暂无快照创建信息'}
            </p>
          </div>
          {versionsDiffer && (
            <p className="m-0 flex items-start gap-1.5 text-warning">
              <span className="i-lucide-info mt-3px h-14px w-14px shrink-0" aria-hidden="true" />
              请注意：当前运行时快照非最新版本
            </p>
          )}
        </div>
      }
    >
      <Button
        size="small"
        type="text"
        aria-label={`快照版本：最新 #${env.latestVersion}，运行时 #${env.currentVersion}`}
        className="h-24px! shrink-0 gap-0! overflow-hidden p-0! font-mono! text-12px! layout-focus"
      >
        <span
          className="inline-flex h-full items-center bg-text px-1.5 text-surface"
          aria-label={`最新快照版本 ${env.latestVersion}`}
        >
          #{env.latestVersion}
        </span>
        <span
          className="inline-flex h-full items-center bg-success px-1.5 text-canvas"
          aria-label={`运行时快照版本 ${env.currentVersion}`}
        >
          #{env.currentVersion}
        </span>
      </Button>
    </Tooltip>
  );
}

export function EnvironmentPanel({
  environment: env,
  appType,
  panelActions,
  draft,
  onDraftChange,
}: {
  environment: ApplicationEnvironment;
  appType: '0' | '1';
  /** 面板布局动作固定在底栏左侧，与业务操作及编辑内容分开。 */
  panelActions: ReactNode;
  /** 草稿由应用工作区按环境持有，取消勾选仅隐藏编辑器；不写入查询缓存。 */
  draft: string | undefined;
  onDraftChange: (value: string) => void;
}) {
  const [editor, setEditor] = useState<ConfigEditor | null>(null);
  const common = appType === '1';
  const production = env.isPrd === '1';
  // 仅正数提示待处理差异，零及后端负数状态均不展示徽标。
  const differenceHint =
    env.runtimeDifferNum > 0 ? `运行时配置差异数：${env.runtimeDifferNum}` : undefined;
  const config = draft ?? env.configInfo;
  return (
    <article
      className="flex h-full min-w-0 flex-col overflow-hidden bg-surface [--toolbar-background:var(--color-sidebar)] [--toolbar-fade-base:var(--color-surface)]"
      aria-label={`${env.envTag} 环境参数配置`}
    >
      {/* 顶部工具栏以柔和表面色区分编辑区，底栏保持连续背景，不增加分割线。 */}
      <header className="shrink-0 bg-[var(--toolbar-background)]">
        {/* 单行工具栏紧邻配置内容；缩窄面板时横向滚动，避免操作换行挤占正文。 */}
        <ToolbarOverflowFade>
          <div
            role="toolbar"
            aria-label={`${env.envTag} 参数操作`}
            className="flex min-h-52px w-max min-w-full items-center gap-1.5 px-3 py-2 box-border whitespace-nowrap"
          >
            <EnvironmentTag environment={env} />
            <PendingAction label="历史记录" icon="i-lucide-history" />
            {!common && (
              <>
                <PendingAction label="快照生成" icon="i-lucide-camera" />
                <SnapshotVersions environment={env} />
              </>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <PendingAction label="上传文件" icon="i-lucide-file-up" />
              <PendingAction
                label={common ? '批量创建快照' : '创建快照'}
                to={
                  common
                    ? undefined
                    : applicationOperationPath(env.systemName, 'create', env.appName, env.envTag)
                }
              />
              <Space.Compact size="small" role="group" aria-label="发布操作">
                <PendingAction
                  label={common ? '批量发布快照' : '发布'}
                  primary
                  to={
                    common
                      ? undefined
                      : applicationOperationPath(env.systemName, 'publish', env.appName, env.envTag)
                  }
                />
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
                  <PendingAction
                    label="检查"
                    to={applicationOperationPath(
                      env.systemName,
                      'inspect',
                      env.appName,
                      env.envTag,
                    )}
                  />
                  <PendingAction label="刷新差异数" icon="i-lucide-refresh-cw" />
                </Space.Compact>
              </Badge>
            )}
          </div>
        </ToolbarOverflowFade>
        {env.saveStatus === 'N' && (
          <p role="status" className="m-0 px-3 pb-3 text-12px text-text-secondary">
            未保存：{env.unsavedReason || '原因未提供'}
          </p>
        )}
      </header>
      <div
        className="relative flex-1 min-h-280px min-w-320px overflow-hidden"
        role="region"
        aria-label={`${env.envTag} 配置内容（可编辑）`}
      >
        {/* 空配置也挂载编辑器；绝对定位填满分栏高度，避免编辑器反向撑大父容器。 */}
        <div className="absolute inset-0">
          <MonacoEditor
            height="100%"
            language="yaml"
            // 系统、应用和环境共同隔离模型，避免内容及撤销历史串到其他配置。
            path={`parameter://application/${encodeURIComponent(env.systemName)}/${encodeURIComponent(env.appName)}/${encodeURIComponent(env.envTag)}/config.yaml`}
            value={config}
            onChange={(value) => onDraftChange(value ?? '')}
            options={configEditorOptions}
            onMount={setEditor}
          />
        </div>
      </div>
      <footer className="shrink-0 text-12px leading-20px text-text-muted [--toolbar-background:var(--color-surface)] [--toolbar-fade-base:transparent]">
        <ToolbarOverflowFade showScrollbar={false}>
          <div className="flex h-36px w-max min-w-full box-border items-center gap-3 whitespace-nowrap px-3">
            {panelActions}
            <div className="ml-auto flex shrink-0 items-center justify-end gap-3">
              <EnvironmentModificationInfo environment={env} />
              <EditorCursorPosition editor={editor} />
            </div>
          </div>
        </ToolbarOverflowFade>
      </footer>
    </article>
  );
}
