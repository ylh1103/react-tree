/** 设置面板按首次打开加载；外壳只订阅开关，下载和失败反馈不阻塞当前业务页面。 */
import { lazy, useState } from 'react';
import { DeferredPanel } from '../DeferredPanel';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeUserSettings } from '@/store/slices/preferencesSlice';

const UserSettingsDrawer = lazy(async () => {
  const module = await import('./index');
  return { default: module.UserSettingsDrawer };
});

/** 首次打开后保留模块挂载，关闭不重置边界，防止对缓存的失败模块进行无效重试。 */
export function DeferredUserSettingsDrawer() {
  const open = useAppSelector((state) => state.preferences.settingsOpen);
  const dispatch = useAppDispatch();
  const [activated, setActivated] = useState(false);
  // 根据当前 props 在渲染期间记录一次激活，不增加 Effect 或重复的抽屉开关状态。
  if (open && !activated) setActivated(true);
  const close = () => dispatch(closeUserSettings());
  if (!activated) return null;
  return (
    <DeferredPanel open={open} title="用户设置" onClose={close}>
      <UserSettingsDrawer />
    </DeferredPanel>
  );
}
