import { Button } from 'antd';
import { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { openUserSettings } from '../../store/slices/preferencesSlice';

/** 保留旧设置地址；配置统一在全局抽屉中完成。 */
export default function UserSettingsPage() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(openUserSettings());
  }, [dispatch]);
  return (
    <section className="workspace-panel flex flex-col min-h-full">
      <div className="workspace-titlebar">
        <h2 className="workspace-page__title">用户设置</h2>
      </div>
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="m-0 workspace-muted">在右侧抽屉中配置界面布局和主题，设置立即生效。</p>
        <Button onClick={() => dispatch(openUserSettings())}>打开用户设置</Button>
      </div>
    </section>
  );
}
