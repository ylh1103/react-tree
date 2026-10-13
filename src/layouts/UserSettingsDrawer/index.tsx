/**
 * 全局用户设置抽屉；可见状态保存在当前页签的 Redux 中。
 * 表单内容复用 LayoutSettings，关闭与保存配置是独立行为。
 */
import { Button, Drawer, Popconfirm, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeUserSettings, saveUserSettings } from '../../store/slices/preferencesSlice';
import { LayoutSettings } from '../../components/LayoutSettings';
import { defaultUserSettings, type UserSettings } from '../../types/preferences';

export function UserSettingsDrawer() {
  const {
    settingsOpen: open,
    status,
    error,
    failedSettings,
  } = useAppSelector((state) => state.preferences);
  const dispatch = useAppDispatch();
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const close = () => {
    setSyncedAt(null);
    dispatch(closeUserSettings());
  };
  useEffect(() => {
    if (!open) return;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const panel = document.querySelector('.user-settings-panel');
      if (panel && event.target instanceof Node && !panel.contains(event.target)) {
        setSyncedAt(null);
        dispatch(closeUserSettings());
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
  }, [open, dispatch]);
  const save = async (changes: Partial<UserSettings>) => {
    setSyncedAt(null);
    const result = await dispatch(saveUserSettings(changes));
    if (saveUserSettings.fulfilled.match(result)) setSyncedAt(Date.now());
  };
  useEffect(() => {
    if (syncedAt === null) return;
    const timer = window.setTimeout(() => setSyncedAt(null), 3000);
    return () => window.clearTimeout(timer);
  }, [syncedAt]);
  return (
    <Drawer
      title="用户设置"
      placement="right"
      size={400}
      open={open}
      mask={false}
      closable={{ 'aria-label': '关闭用户设置' }}
      onClose={close}
      classNames={{
        wrapper: 'user-settings-panel max-w-full!',
        section: 'user-settings-surface',
        body: 'px-6! pt-0! pb-5! overscroll-contain',
        footer: 'px-6! py-3!',
      }}
      footer={
        <div className="flex min-h-8 items-center justify-between gap-3">
          <Popconfirm
            title="恢复全部默认设置？"
            description="主题、配色、布局、圆角和菜单显示都会恢复默认。"
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
