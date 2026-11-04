/** 设置抽屉外壳即时打开，表单按首次打开加载；异步反馈始终留在抽屉内部。 */
import { lazy, useEffect, useState } from 'react';
import { ConfigProvider, Drawer } from 'antd';
import { DeferredPanel } from '../DeferredPanel';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeUserSettings } from '@/store/slices/preferencesSlice';

const UserSettingsContent = lazy(async () => {
  const module = await import('./index');
  return { default: module.UserSettingsContent };
});

/** 浮层挂到抽屉内部，避免外部点击监听误关面板，并保留无触发节点时的默认挂载位置。 */
function getSettingsPopupContainer(trigger?: HTMLElement) {
  return trigger?.closest<HTMLElement>('.user-settings-surface') ?? document.body;
}

/** 首次打开后保留内容与错误边界，关闭动画及失败模块的恢复语义不因开关重置。 */
export function DeferredUserSettingsDrawer() {
  const open = useAppSelector((state) => state.preferences.settingsOpen);
  const dispatch = useAppDispatch();
  const [activated, setActivated] = useState(false);
  if (open && !activated) setActivated(true);
  const close = () => dispatch(closeUserSettings());
  // 下载期间与加载完成后使用同一外部点击规则，捕获阶段兼容阻止冒泡的控件。
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const panel = document.querySelector('.user-settings-panel');
      if (panel && event.target instanceof Node && !panel.contains(event.target))
        dispatch(closeUserSettings());
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open, dispatch]);
  if (!activated) return null;
  return (
    <ConfigProvider getPopupContainer={getSettingsPopupContainer}>
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
          // 与页头的 51px 内容及 1px 分隔线对齐。
          header: 'box-border! h-52px! min-h-52px! px-6! py-0!',
          // 内容与底部保存反馈共同铺满抽屉，表单内部维护滚动及留白。
          body: 'flex! min-h-0! flex-col! overflow-hidden! p-0!',
        }}
      >
        <DeferredPanel title="用户设置">
          <UserSettingsContent />
        </DeferredPanel>
      </Drawer>
    </ConfigProvider>
  );
}
