/**
 * 全局用户设置抽屉；可见状态保存在当前页签的 Redux 中。
 * 表单内容复用 LayoutSettings，关闭与保存配置是独立行为；无遮罩面板允许回到背景操作。
 */
import { Button, Drawer, Popconfirm, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useDebounceFn, useEventListener } from 'ahooks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeUserSettings, saveUserSettings } from '@/store/slices/preferencesSlice';
import { LayoutSettings } from '@/components/LayoutSettings';
import { defaultUserSettings, type UserSettings } from '@/types/preferences';

export function UserSettingsDrawer() {
  // 只订阅抽屉实际展示的字段，布局预览等无关变更不触发整层抽屉更新。
  const open = useAppSelector((state) => state.preferences.settingsOpen);
  const status = useAppSelector((state) => state.preferences.status);
  const error = useAppSelector((state) => state.preferences.error);
  const failedSettings = useAppSelector((state) => state.preferences.failedSettings);
  const dispatch = useAppDispatch();
  // “已保存”只是一段短暂 UI 提示；实际配置及保存结果以 Redux 为准，不在组件中复制配置。
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const close = () => {
    setSyncedAt(null);
    dispatch(closeUserSettings());
  };
  // 保留捕获阶段监听：即使外部控件阻止冒泡，也能关闭抽屉；仅打开时注册。
  useEventListener(
    'pointerdown',
    (event: PointerEvent) => {
      if (event.button !== 0) return;
      const panel = document.querySelector('.user-settings-panel');
      if (panel && event.target instanceof Node && !panel.contains(event.target)) close();
    },
    { target: () => document, capture: true, enable: open },
  );
  const { run: scheduleClearSyncedAt, cancel: cancelClearSyncedAt } = useDebounceFn(
    () => setSyncedAt(null),
    { wait: 3000 },
  );
  // RTK thunk 的 dispatch 会返回结果 action；显式判断 fulfilled 后才显示成功，失败交给 Slice 回退。
  // 自动保存、恢复默认、失败重试都走同一入口；恢复默认仅覆盖平台字段，API 仍保留未知字段。
  const save = async (changes: Partial<UserSettings>) => {
    setSyncedAt(null);
    const result = await dispatch(saveUserSettings(changes));
    if (saveUserSettings.fulfilled.match(result)) setSyncedAt(Date.now());
  };
  useEffect(() => {
    if (syncedAt === null) return;
    // 每次保存完成重新计时；开始新保存、关闭或卸载时取消旧提示任务。
    scheduleClearSyncedAt();
    return cancelClearSyncedAt;
  }, [syncedAt, scheduleClearSyncedAt, cancelClearSyncedAt]);
  return (
    <Drawer
      title="用户设置"
      placement="right"
      size={400}
      open={open}
      mask={false}
      aria-modal={false}
      focusable={{ trap: false }}
      closable={{ 'aria-label': '关闭用户设置' }}
      onClose={close}
      classNames={{
        wrapper: 'user-settings-panel max-w-full!',
        section: 'user-settings-surface',
        body: 'flex! min-h-0! flex-col! overflow-hidden! px-5! pt-0! pb-0!',
        footer: 'px-6! py-3!',
      }}
      footer={
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Popconfirm
            title="恢复全部默认设置？"
            description="主题、配色、加载图标、布局、圆角和菜单显示都会恢复默认。"
            okText="恢复默认"
            cancelText="取消"
            placement="topLeft"
            disabled={status === 'idle' || status === 'loading' || status === 'load-error'}
            onConfirm={() => save(defaultUserSettings)}
            getPopupContainer={(trigger) =>
              // 外层 wrapper 禁用指针事件；浮层须挂到可交互的 section，避免点击穿透。
              trigger.closest<HTMLElement>('.user-settings-surface') ??
              trigger.parentElement ??
              document.body
            }
          >
            <Button disabled={status === 'idle' || status === 'loading' || status === 'load-error'}>
              恢复全部默认
            </Button>
          </Popconfirm>
          <span
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 text-12px text-text-secondary"
          >
            {status === 'saving' && (
              <>
                <span
                  aria-hidden="true"
                  className="i-lucide-loader-circle animate-spin motion-reduce:animate-none text-accent text-14px"
                />
                正在保存…
              </>
            )}
            {status === 'save-error' && (
              <>
                <Tooltip title={error}>
                  <span className="flex items-center gap-1.5 text-error">
                    <span aria-hidden="true" className="i-lucide-circle-alert text-14px" />
                    保存失败，已恢复原设置
                  </span>
                </Tooltip>
                <Button
                  type="link"
                  size="small"
                  danger
                  className="h-auto! px-0! py-0!"
                  onClick={() => {
                    // UI 已回退，重试必须发送之前失败的修改项，不能重新读取当前回退值作为输入。
                    if (failedSettings) void save(failedSettings);
                  }}
                >
                  重试
                </Button>
              </>
            )}
            {syncedAt !== null && status === 'ready' && (
              <>
                <span aria-hidden="true" className="i-lucide-check text-success text-14px" />
                已保存
              </>
            )}
            {status === 'ready' && syncedAt === null && '更改后自动保存'}
          </span>
        </div>
      }
    >
      <LayoutSettings
        onSave={(changes) => {
          void save(changes);
        }}
      />
    </Drawer>
  );
}
