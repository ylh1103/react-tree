/**
 * 全局用户设置抽屉；可见状态保存在当前页签的 Redux 中。
 * 表单内容复用 LayoutSettings，关闭与保存配置是独立行为。
 */
import { Button, Drawer } from 'antd';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeUserSettings, saveUserSettings } from '../../store/slices/preferencesSlice';
import { LayoutSettings } from '../../components/LayoutSettings';
import { defaultUserSettings, type UserSettings } from '../../types/preferences';

export function UserSettingsDrawer() {
  const { settingsOpen: open, status } = useAppSelector((state) => state.preferences);
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
      onClose={close}
      classNames={{
        wrapper: 'user-settings-panel max-w-full!',
        body: 'p-6!',
        footer: 'px-6! py-3!',
      }}
      footer={
        <div className="flex min-h-8 items-center justify-between gap-3">
          <Button
            disabled={
              status === 'idle' ||
              status === 'loading' ||
              status === 'saving' ||
              status === 'load-error'
            }
            onClick={() => {
              void save(defaultUserSettings);
            }}
          >
            重置
          </Button>
          <span
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 text-12px text-text-secondary"
          >
            {syncedAt !== null && status === 'ready' && (
              <>
                <span aria-hidden="true" className="i-lucide-check text-success text-14px" />
                设置已同步
              </>
            )}
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
