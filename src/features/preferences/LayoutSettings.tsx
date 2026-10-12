import { Alert, Button, Divider, Radio, Switch, Tabs } from 'antd';
import { useId, type CSSProperties } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loadUserSettings } from '../../store/preferencesSlice';
import { themeVariablesByMode } from '../../styles/theme';
import type { LayoutMode, ResolvedThemeMode, UserSettings } from './types';
import { useResolvedTheme } from './useResolvedTheme';

const themeOptions = [
  {
    value: 'light',
    label: '浅色模式',
    icon: 'i-lucide-sun',
    description: '明亮清晰，适合日间使用',
  },
  {
    value: 'dark',
    label: '暗色模式',
    icon: 'i-lucide-moon',
    description: '柔和暗色，适合低光环境',
  },
  {
    value: 'system',
    label: '跟随系统',
    icon: 'i-lucide-monitor',
    description: '随系统外观自动切换',
  },
] as const;

/** 用实际主题变量绘制缩略图，主题切换后仍能对比浅色与暗色。 */
function SettingsPreview({
  layoutMode,
  themeMode,
  selected,
  className = '',
}: {
  layoutMode: LayoutMode;
  themeMode: ResolvedThemeMode;
  selected: boolean;
  className?: string;
}) {
  const compact = layoutMode === 'compact';
  return (
    <span
      aria-hidden="true"
      style={themeVariablesByMode[themeMode] as CSSProperties}
      className={`relative block h-92px overflow-hidden rounded-6px border border-solid border-border bg-canvas ${className}`}
    >
      <span className="flex h-17px items-center gap-1 border-b border-b-solid border-divider bg-header px-2">
        <span className="h-5px w-5px rounded-full bg-accent" />
        <span className="h-3px w-8 rounded-full bg-text-muted opacity-40" />
      </span>
      <span className={`flex h-75px ${compact ? 'gap-0 p-0' : 'gap-1 p-1'}`}>
        <span
          className={`flex w-5 shrink-0 flex-col items-center gap-1.5 bg-nav py-2 ${compact ? '' : 'rounded-3px'}`}
        >
          <span className="h-2 w-2 rounded-2px bg-accent" />
          <span className="h-1 w-2 rounded-1px bg-nav-text opacity-50" />
          <span className="h-1 w-2 rounded-1px bg-nav-text opacity-50" />
        </span>
        <span
          className={`w-8 shrink-0 border border-solid border-divider bg-sidebar p-1.5 ${compact ? 'border-y-0 border-l-0' : 'rounded-3px'}`}
        >
          <span className="mb-1.5 block h-1 w-full rounded-1px bg-accent opacity-60" />
          <span className="mb-1.5 block h-1 w-full rounded-1px bg-text-muted opacity-25" />
          <span className="block h-1 w-3/4 rounded-1px bg-text-muted opacity-25" />
        </span>
        <span
          className={`min-w-0 flex-1 border border-solid border-divider bg-surface p-2 ${compact ? 'border-0' : 'rounded-3px'}`}
        >
          <span className="mb-2 block h-1 w-2/3 rounded-1px bg-text-muted opacity-60" />
          <span className="mb-1.5 block h-1 w-full rounded-1px bg-text-muted opacity-20" />
          <span className="mb-1.5 block h-1 w-4/5 rounded-1px bg-text-muted opacity-20" />
          <span className="block h-1 w-1/2 rounded-1px bg-accent opacity-50" />
        </span>
      </span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent shadow-sm">
          <span className="i-lucide-check text-13px" />
        </span>
      )}
    </span>
  );
}

/** 同一布局以斜向分割展示两种外观，直观表达系统自动切换。 */
function SystemThemePreview({
  layoutMode,
  selected,
}: {
  layoutMode: LayoutMode;
  selected: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className="relative isolate block h-92px overflow-hidden rounded-6px border border-solid border-border"
    >
      <span className="absolute inset-0">
        <SettingsPreview
          layoutMode={layoutMode}
          themeMode="light"
          selected={false}
          className="border-0! rounded-none!"
        />
      </span>
      <span className="absolute inset-0 [clip-path:polygon(58%_0,100%_0,100%_100%,42%_100%)]">
        <SettingsPreview
          layoutMode={layoutMode}
          themeMode="dark"
          selected={false}
          className="border-0! rounded-none!"
        />
      </span>
      <span className="absolute left-1/2 top-1/2 flex h-7 w-7 translate-x-[-50%] translate-y-[-50%] items-center justify-center rounded-full border border-solid border-border bg-surface text-text-secondary shadow-sm">
        <span className="i-lucide-arrow-left-right text-14px" />
      </span>
      <span
        style={themeVariablesByMode.light as CSSProperties}
        className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-text-secondary"
      >
        <span className="i-lucide-sun text-13px" />
      </span>
      <span
        style={themeVariablesByMode.dark as CSSProperties}
        className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-text-secondary"
      >
        <span className="i-lucide-moon text-13px" />
      </span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent shadow-sm">
          <span className="i-lucide-check text-13px" />
        </span>
      )}
    </span>
  );
}

export function LayoutSettings({ onSave }: { onSave: (changes: Partial<UserSettings>) => void }) {
  const {
    status,
    error,
    layoutMode,
    themeMode,
    navigationIconOnly,
    headerToolsIconOnly,
    failedSettings,
  } = useAppSelector((state) => state.preferences);
  const resolvedTheme = useResolvedTheme(themeMode);
  const dispatch = useAppDispatch();
  const labelId = useId();
  const themeLabelId = useId();
  const loading = status === 'idle' || status === 'loading';
  const saving = status === 'saving';
  const disabled = loading || saving || status === 'load-error';
  return (
    <div className="flex flex-col gap-3" aria-busy={loading || saving}>
      <Tabs
        defaultActiveKey="appearance"
        items={[
          {
            key: 'appearance',
            label: '外观',
            children: (
              <section className="flex flex-col gap-4 pb-2" aria-labelledby={themeLabelId}>
                <Divider className="my-2!">
                  <h3 id={themeLabelId} className="m-0 text-14px font-600 text-text">
                    主题模式
                  </h3>
                </Divider>
                <Radio.Group
                  name={themeLabelId}
                  aria-labelledby={themeLabelId}
                  value={themeMode}
                  disabled={disabled}
                  onChange={(event) => {
                    const mode = event.target.value;
                    if (mode === 'light' || mode === 'dark' || mode === 'system') {
                      onSave({ themeMode: mode });
                    }
                  }}
                  className="grid! w-full! grid-cols-2 gap-3"
                >
                  {themeOptions.map(({ value: mode, label, icon, description }) => (
                    <Radio.Button
                      key={mode}
                      value={mode}
                      aria-label={label}
                      className={`settings-choice ${mode === 'system' ? 'col-span-2' : ''}`}
                    >
                      <span className="flex w-full min-w-0 flex-col gap-3">
                        {mode === 'system' ? (
                          <SystemThemePreview
                            layoutMode={layoutMode}
                            selected={themeMode === mode}
                          />
                        ) : (
                          <SettingsPreview
                            layoutMode={layoutMode}
                            themeMode={mode}
                            selected={themeMode === mode}
                          />
                        )}
                        <span className="flex items-center justify-center gap-1.5 text-14px font-500">
                          <span aria-hidden="true" className={`${icon} text-16px`} />
                          {label}
                        </span>
                        <span className="workspace-muted text-12px! leading-18px!">
                          {description}
                        </span>
                      </span>
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </section>
            ),
          },
          {
            key: 'layout',
            label: '布局',
            children: (
              <section className="flex flex-col gap-4 pb-2" aria-labelledby={labelId}>
                <Divider className="my-2!">
                  <h3 id={labelId} className="m-0 text-14px font-600 text-text">
                    布局模式
                  </h3>
                </Divider>
                <Radio.Group
                  name={labelId}
                  aria-labelledby={labelId}
                  value={layoutMode}
                  disabled={disabled}
                  onChange={(event) => {
                    onSave({
                      layoutMode: event.target.value === 'compact' ? 'compact' : 'default',
                    });
                  }}
                  className="grid! w-full! grid-cols-2 gap-3"
                >
                  {(['default', 'compact'] as const).map((mode) => (
                    <Radio.Button
                      key={mode}
                      value={mode}
                      aria-label={mode === 'default' ? '默认布局' : '紧凑布局'}
                      className="settings-choice"
                    >
                      <span className="flex w-full min-w-0 flex-col gap-3">
                        <SettingsPreview
                          layoutMode={mode}
                          themeMode={resolvedTheme}
                          selected={layoutMode === mode}
                        />
                        <span className="text-14px font-500">
                          {mode === 'default' ? '默认布局' : '紧凑布局'}
                        </span>
                        <span className="workspace-muted text-12px! leading-18px!">
                          {mode === 'default' ? '模块留有间距，层次分明' : '模块无间距，边框线分隔'}
                        </span>
                      </span>
                    </Radio.Button>
                  ))}
                </Radio.Group>
                <Divider className="mb-2! mt-5!">
                  <h3 className="m-0 text-14px font-600 text-text">菜单显示</h3>
                </Divider>
                <div className="flex min-h-44px items-center justify-between gap-3">
                  <span className="text-14px text-text">导航栏仅显示图标</span>
                  <Switch
                    aria-label="导航栏仅显示图标"
                    checked={navigationIconOnly}
                    disabled={disabled}
                    onChange={(checked) => onSave({ navigationIconOnly: checked })}
                  />
                </div>
                <div className="flex min-h-44px items-center justify-between gap-3">
                  <span className="text-14px text-text">头部工具栏仅显示图标</span>
                  <Switch
                    aria-label="头部工具栏仅显示图标"
                    checked={headerToolsIconOnly}
                    disabled={disabled}
                    onChange={(checked) => onSave({ headerToolsIconOnly: checked })}
                  />
                </div>
              </section>
            ),
          },
        ]}
      />
      {status === 'load-error' && (
        <Alert
          type="error"
          showIcon
          title="用户设置读取失败，已使用默认配置"
          description={error}
          action={
            <Button
              size="small"
              onClick={() => {
                void dispatch(loadUserSettings());
              }}
            >
              重新读取
            </Button>
          }
        />
      )}
      {status === 'save-error' && (
        <Alert
          type="error"
          showIcon
          title="保存失败，已恢复上次保存的配置"
          description={error}
          action={
            <Button
              size="small"
              onClick={() => {
                if (failedSettings) onSave(failedSettings);
              }}
            >
              重试保存
            </Button>
          }
        />
      )}
    </div>
  );
}
