import { LayoutSettings } from '../features/preferences/LayoutSettings';

export default function UserSettingsPage() {
  return (
    <section className="workspace-panel flex flex-col min-h-full">
      <div className="workspace-titlebar">
        <h2 className="workspace-page__title">用户设置</h2>
      </div>
      <div className="p-24px">
        <LayoutSettings />
      </div>
    </section>
  );
}
