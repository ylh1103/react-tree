/**
 * 设置页面与抽屉共用的布局、主题和图标显示配置面板。
 * 所有更改通过 Redux 保存；失败反馈和重试读取同一个状态机，主题预览复用主题定义。
 */
import { Alert, Button, InputNumber, Radio, Segmented, Slider, Tabs } from 'antd';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  loadUserSettings,
  previewLayoutGap,
  previewBorderRadius,
  previewControlBorderRadius,
} from '../../store/slices/preferencesSlice';
import { navigationThemeVariables, themeVariablesByMode } from '../../styles/theme';
import type {
  LayoutMode,
  NavigationTheme,
  ResolvedThemeMode,
  UserSettings,
} from '../../types/preferences';
import { defaultUserSettings, layoutGapRange, borderRadiusRange } from '../../types/preferences';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';

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

function SettingsDefaultBadge() {
  return (
    <span className="rounded-control bg-sidebar px-1 text-11px font-400 leading-4 text-text-secondary">
      默认
    </span>
  );
}

function SettingsSelectionMark({ selected }: { selected: boolean }) {
  return selected ? (
    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent shadow-sm">
      <span className="i-lucide-check text-13px" />
    </span>
  ) : null;
}

/** 用实际主题变量绘制缩略图，主题切换后仍能对比浅色与暗色。 */
function SettingsPreview({
  layoutMode,
  themeMode,
  selected,
  className = '',
  navigationTheme: previewNavigationTheme,
}: {
  layoutMode: LayoutMode;
  themeMode: ResolvedThemeMode;
  selected: boolean;
  className?: string;
  navigationTheme?: NavigationTheme;
}) {
  const compact = layoutMode === 'compact';
  const navigationTheme = useAppSelector((state) => state.preferences.navigationTheme);
  const radius = useAppSelector(
    (state) => state.preferences.previewBorderRadius ?? state.preferences.borderRadius,
  );
  return (
    <span
      aria-hidden="true"
      style={
        {
          ...themeVariablesByMode[themeMode],
          ...navigationThemeVariables[previewNavigationTheme ?? navigationTheme],
          '--ui-radius': `${radius}px`,
        } as CSSProperties
      }
      className={`relative block h-92px w-full shrink-0 overflow-hidden rounded-ui border border-solid border-border bg-canvas ${className}`}
    >
      <span className="flex h-17px items-center gap-1 border-b border-b-solid border-divider bg-header px-2">
        <span className="h-5px w-5px rounded-full bg-accent" />
        <span className="h-3px w-8 rounded-full bg-text-muted opacity-40" />
      </span>
      <span className={`flex h-75px ${compact ? 'gap-0 p-0' : 'gap-1 p-1'}`}>
        <span
          className={`flex w-5 shrink-0 flex-col items-center gap-1.5 bg-nav py-2 ${compact ? '' : 'rounded-[calc(var(--ui-radius)/2)]'}`}
        >
          <span className="h-2 w-2 rounded-2px bg-accent" />
          <span className="h-1 w-2 rounded-1px bg-nav-text opacity-50" />
          <span className="h-1 w-2 rounded-1px bg-nav-text opacity-50" />
        </span>
        <span
          className={`w-8 shrink-0 border border-solid border-divider bg-sidebar p-1.5 ${compact ? 'border-y-0 border-l-0' : 'rounded-[calc(var(--ui-radius)/2)]'}`}
        >
          <span className="mb-1.5 block h-1 w-full rounded-1px bg-accent opacity-60" />
          <span className="mb-1.5 block h-1 w-full rounded-1px bg-text-muted opacity-25" />
          <span className="block h-1 w-3/4 rounded-1px bg-text-muted opacity-25" />
        </span>
        <span
          className={`min-w-0 flex-1 border border-solid border-divider bg-surface p-2 ${compact ? 'border-0' : 'rounded-[calc(var(--ui-radius)/2)]'}`}
        >
          <span className="mb-2 block h-1 w-2/3 rounded-1px bg-text-muted opacity-60" />
          <span className="mb-1.5 block h-1 w-full rounded-1px bg-text-muted opacity-20" />
          <span className="mb-1.5 block h-1 w-4/5 rounded-1px bg-text-muted opacity-20" />
          <span className="block h-1 w-1/2 rounded-1px bg-accent opacity-50" />
        </span>
      </span>
      <SettingsSelectionMark selected={selected} />
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
      className="relative block h-92px w-full shrink-0 overflow-hidden rounded-ui border border-solid border-border isolate"
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
      <SettingsSelectionMark selected={selected} />
    </span>
  );
}

/** 聚焦导航的普通与选中状态，旁边保留内容表面用于对比底色。 */
function NavigationColorPreview({
  mode,
  themeMode,
  selected,
}: {
  mode: NavigationTheme;
  themeMode: ResolvedThemeMode;
  selected: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      style={
        { ...themeVariablesByMode[themeMode], ...navigationThemeVariables[mode] } as CSSProperties
      }
      className="relative block h-92px w-full shrink-0 overflow-hidden rounded-ui border border-solid border-border flex! bg-surface"
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 bg-nav p-1.5">
        <span className="flex h-7 items-center gap-2 rounded-control bg-nav-active px-2 text-nav-active-text">
          <span className="i-lucide-layout-grid shrink-0 text-15px" />
          <span className="text-12px font-500">总览</span>
        </span>
        <span className="flex h-7 items-center gap-2 rounded-control px-2 text-nav-text">
          <span className="i-lucide-box shrink-0 text-15px" />
          <span className="text-12px">应用</span>
        </span>
      </span>
      <span className="flex w-7 shrink-0 flex-col gap-2 border-l border-l-solid border-divider bg-surface px-1.5 py-3">
        <span className="h-1 rounded-full bg-text-muted opacity-30" />
        <span className="h-1 rounded-full bg-text-muted opacity-15" />
      </span>
      <SettingsSelectionMark selected={selected} />
    </span>
  );
}

/** 拖动时只更新预览，释放鼠标或方向键后保存一次；离开设置面板时清理预览。 */
function PreferenceSlider({
  id,
  value,
  disabled,
  compact = false,
  setting,
  onSave,
}: {
  id: string;
  value: number;
  disabled: boolean;
  compact?: boolean;
  setting: 'layoutGap' | 'borderRadius' | 'controlBorderRadius';
  onSave: (changes: Partial<UserSettings>) => void;
}) {
  const dispatch = useAppDispatch();
  const preview = useAppSelector((state) =>
    setting === 'layoutGap'
      ? state.preferences.previewLayoutGap
      : setting === 'borderRadius'
        ? state.preferences.previewBorderRadius
        : state.preferences.previewControlBorderRadius,
  );
  const previewAction =
    setting === 'layoutGap'
      ? previewLayoutGap
      : setting === 'borderRadius'
        ? previewBorderRadius
        : previewControlBorderRadius;
  const range = setting === 'layoutGap' ? layoutGapRange : borderRadiusRange;
  const title =
    setting === 'layoutGap' ? '模块间距' : setting === 'borderRadius' ? '面板圆角' : '控件圆角';
  const draft = preview ?? value;
  const displayedGap = compact ? 0 : draft;
  const [inputDraft, setInputDraft] = useState<number | null | undefined>(undefined);
  const marks = Object.fromEntries(
    (setting === 'controlBorderRadius'
      ? [0, defaultUserSettings.controlBorderRadius, 16, borderRadiusRange.max]
      : setting === 'borderRadius'
        ? [0, defaultUserSettings.borderRadius, 16, borderRadiusRange.max]
        : compact
          ? [0, 4, 8, 12, 16]
          : [2, 4, 8, 12, 16]
    ).map((gap) => [
      gap,
      <span key={gap} className="flex flex-col items-center gap-0.5 leading-4">
        <span
          className={
            !disabled && gap === displayedGap ? 'font-600 text-accent-text' : 'text-text-muted'
          }
        >
          {gap}
        </span>
        {!compact && gap === defaultUserSettings[setting] && (
          <span className="text-11px text-text-secondary">默认</span>
        )}
      </span>,
    ]),
  );
  useEffect(
    () => () => {
      dispatch(previewAction(null));
    },
    [dispatch, previewAction],
  );
  const commit = (next: number) => {
    if (disabled) return;
    if (next !== value) onSave({ [setting]: next });
    else dispatch(previewAction(null));
  };
  return (
    <div className="rounded-ui bg-sidebar px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span id={id} className="text-14px font-500 text-text">
          {title}
        </span>
        <InputNumber
          aria-label={`${title}数值`}
          aria-describedby={`${id}-description`}
          value={inputDraft === undefined ? displayedGap : inputDraft}
          min={compact ? 0 : range.min}
          max={compact ? 0 : range.max}
          precision={0}
          step={1}
          disabled={disabled}
          suffix="px"
          onChange={(next) => {
            setInputDraft(next);
            if (next !== null && Number.isInteger(next) && next >= range.min && next <= range.max)
              dispatch(previewAction(next));
          }}
          onBlur={(event) => {
            // 无 formatter，直接读取当前输入；避免边界修正在 blur 内触发 onChange 时取到旧草稿。
            const raw = event.target.value.trim();
            const next = Number(raw);
            if (raw === '' || !Number.isFinite(next)) dispatch(previewAction(null));
            else commit(Math.min(range.max, Math.max(range.min, Math.round(next))));
            setInputDraft(undefined);
          }}
          onPressEnter={(event) => {
            if (event.target instanceof HTMLInputElement) event.target.blur();
          }}
          className={`w-96px! ${disabled ? '[&_input]:text-text-muted!' : '[&_input]:text-accent-text!'} [&_input]:font-600 [&_input]:tabular-nums`}
        />
      </div>
      <p id={`${id}-description`} className="m-0 mt-1 text-12px leading-18px text-text-muted">
        {compact
          ? `标准布局已保存 ${value} px，切换后恢复`
          : setting === 'borderRadius'
            ? '用于内容面板和列表节点，输入后按回车保存'
            : setting === 'controlBorderRadius'
              ? '用于按钮、输入框等控件，输入后按回车保存'
              : '拖动后松开，或输入后按回车保存'}
      </p>
      <div className="px-1">
        <Slider
          ariaLabelledByForHandle={id}
          ariaValueTextFormatterForHandle={(gap) => `${gap} 像素`}
          value={displayedGap}
          min={compact ? 0 : range.min}
          max={range.max}
          step={1}
          marks={marks}
          disabled={disabled}
          tooltip={{ formatter: (gap) => `${gap} px` }}
          onChange={(gap) => {
            setInputDraft(undefined);
            dispatch(previewAction(gap));
          }}
          onChangeComplete={commit}
          classNames={
            disabled
              ? undefined
              : {
                  track: 'bg-accent!',
                  rail: 'bg-border!',
                  handle:
                    '[&::after]:shadow-[0_0_0_2px_var(--color-accent)]! hover:[&::after]:shadow-[0_0_0_3px_var(--color-accent)]! focus-visible:[&::after]:shadow-[0_0_0_4px_var(--color-accent)]!',
                }
          }
          className={`mx-0! mt-4! ${compact ? 'mb-7!' : 'mb-10!'} [&_.ant-slider-mark-text]:text-11px [&_.ant-slider-mark-text]:tabular-nums [&_.ant-slider-dot]:w-2px! [&_.ant-slider-dot]:h-6px! [&_.ant-slider-dot]:top-3px! [&_.ant-slider-dot]:rounded-1px! [&_.ant-slider-dot]:border-0! [&_.ant-slider-dot]:bg-border! ${disabled ? '' : '[&_.ant-slider-dot-active]:bg-accent!'}`}
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-11px leading-4 text-text-muted">
        <span>{compact ? '无间距' : setting !== 'layoutGap' ? '直角' : '更紧凑'}</span>
        <span>
          {compact ? '紧凑布局固定为 0 px' : setting !== 'layoutGap' ? '更圆润' : '更宽松'}
        </span>
      </div>
    </div>
  );
}

function MenuDisplaySetting({
  label,
  icon,
  value,
  disabled,
  onChange,
}: {
  label: string;
  icon: string;
  value: boolean;
  disabled: boolean;
  onChange: (iconOnly: boolean) => void;
}) {
  const labelId = useId();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-1">
      <span id={labelId} className="flex items-center gap-2 text-13px text-text">
        <span aria-hidden="true" className={`${icon} text-15px text-text-secondary`} />
        {label}
      </span>
      <Segmented
        aria-labelledby={labelId}
        value={value ? 'icon' : 'text'}
        disabled={disabled}
        onChange={(mode) => onChange(mode === 'icon')}
        options={[
          { label: '仅图标', value: 'icon' },
          { label: '图标和文字', value: 'text' },
        ]}
        className="settings-segmented w-190px"
      />
    </div>
  );
}

export function LayoutSettings({ onSave }: { onSave: (changes: Partial<UserSettings>) => void }) {
  const {
    status,
    error,
    layoutMode,
    layoutGap,
    borderRadius,
    controlBorderRadius,
    themeMode,
    navigationTheme,
    navigationIconOnly,
    headerToolsIconOnly,
  } = useAppSelector((state) => state.preferences);
  const resolvedTheme = useResolvedTheme(themeMode);
  const dispatch = useAppDispatch();
  const labelId = useId();
  const themeLabelId = useId();
  const navigationThemeLabelId = useId();
  const gapInputId = useId();
  const radiusLabelId = useId();
  const controlRadiusLabelId = useId();
  const loading = status === 'idle' || status === 'loading';
  const saving = status === 'saving';
  const disabled = loading || status === 'load-error';
  return (
    <div
      className="flex flex-col gap-3 [--color-text-muted:var(--color-text-secondary)] [--color-accent-text:var(--color-settings-accent-text)]"
      aria-busy={loading || saving}
    >
      <Tabs
        defaultActiveKey="appearance"
        tabBarGutter={0}
        className="[&_.ant-tabs-nav-list]:w-full [&_.ant-tabs-nav-list]:gap-1 [&_.ant-tabs-nav-list]:rounded-ui [&_.ant-tabs-nav-list]:bg-sidebar [&_.ant-tabs-nav-list]:p-1"
        classNames={{
          header:
            'sticky! top-0! z-10! bg-[var(--color-settings-surface)]! pt-3! pb-2! mb-2! before:border-0!',
          indicator: 'hidden!',
          item: 'm-0! flex-1! justify-center! rounded-control! px-4! py-2! [&_.ant-tabs-tab-btn]:text-text-secondary [&.ant-tabs-tab-active]:bg-surface! [&.ant-tabs-tab-active]:shadow-sm [&.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-accent-text! [&.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-600 [&.ant-tabs-tab-active_.ant-tabs-tab-btn]:[text-shadow:none]!',
        }}
        items={[
          {
            key: 'appearance',
            label: (
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="i-lucide-palette text-14px" />
                <span>外观</span>
              </span>
            ),
            children: (
              <section className="flex flex-col gap-4 pb-2" aria-labelledby={themeLabelId}>
                <h3 id={themeLabelId} className="m-0 text-13px font-600 leading-5 text-text">
                  主题模式
                </h3>
                <Radio.Group
                  name={themeLabelId}
                  aria-labelledby={themeLabelId}
                  value={themeMode}
                  disabled={disabled}
                  onChange={(event) => {
                    const mode = event.target.value;
                    if (mode === 'light' || mode === 'dark' || mode === 'system')
                      onSave({ themeMode: mode });
                  }}
                  className="grid! w-full! grid-cols-2 gap-3"
                >
                  {themeOptions.map(({ value: mode, label, icon, description }) => (
                    <Radio.Button
                      key={mode}
                      value={mode}
                      aria-label={label}
                      className={`flex! h-auto! min-w-0 [&>span:last-child]:w-full px-2.5! py-3! rounded-ui! border! border-solid! border-border! bg-surface! text-text! text-center whitespace-normal! leading-normal! before:hidden! hover:border-accent! [&.ant-radio-button-wrapper-checked]:border-accent! [&.ant-radio-button-wrapper-checked]:bg-hover! [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-solid [&:has(:focus-visible)]:outline-accent [&:has(:focus-visible)]:outline-offset-2 motion-reduce:transition-none! ${mode === 'system' ? 'col-span-2' : ''}`}
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
                        <span className="flex min-h-20px items-center justify-center gap-1.5 text-14px font-500 leading-5">
                          <span aria-hidden="true" className={`${icon} text-16px`} />
                          {label}
                          {mode === defaultUserSettings.themeMode && <SettingsDefaultBadge />}
                        </span>
                        <span className="text-12px leading-18px text-text-muted">
                          {description}
                        </span>
                      </span>
                    </Radio.Button>
                  ))}
                </Radio.Group>
                <h3
                  id={navigationThemeLabelId}
                  className="m-0 text-13px font-600 leading-5 text-text mt-3!"
                >
                  导航栏配色
                </h3>
                <Radio.Group
                  name={navigationThemeLabelId}
                  aria-labelledby={navigationThemeLabelId}
                  value={navigationTheme}
                  disabled={disabled}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === 'contrast' || value === 'theme') {
                      onSave({ navigationTheme: value });
                    }
                  }}
                  className="grid! w-full! grid-cols-2 gap-3"
                >
                  {(['contrast', 'theme'] as const).map((value) => (
                    <Radio.Button
                      key={value}
                      value={value}
                      className="flex! h-auto! min-w-0 [&>span:last-child]:w-full px-2.5! py-3! rounded-ui! border! border-solid! border-border! bg-surface! text-text! text-center whitespace-normal! leading-normal! before:hidden! hover:border-accent! [&.ant-radio-button-wrapper-checked]:border-accent! [&.ant-radio-button-wrapper-checked]:bg-hover! [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-solid [&:has(:focus-visible)]:outline-accent [&:has(:focus-visible)]:outline-offset-2 motion-reduce:transition-none!"
                    >
                      <span className="flex w-full min-w-0 flex-col gap-3">
                        <NavigationColorPreview
                          mode={value}
                          themeMode={resolvedTheme}
                          selected={navigationTheme === value}
                        />
                        <span className="flex min-h-20px items-center justify-center gap-1.5 text-14px font-500 leading-5">
                          {value === 'contrast' ? '独立配色' : '跟随主题'}
                          {value === defaultUserSettings.navigationTheme && (
                            <SettingsDefaultBadge />
                          )}
                        </span>
                        <span className="text-12px leading-18px text-text-muted">
                          {value === 'contrast' ? '保留独立底色，突出导航' : '与其他模块背景同步'}
                        </span>
                      </span>
                    </Radio.Button>
                  ))}
                </Radio.Group>
                <h3 className="m-0 text-13px font-600 leading-5 text-text mt-3!">圆角样式</h3>
                <PreferenceSlider
                  setting="borderRadius"
                  id={radiusLabelId}
                  value={borderRadius}
                  disabled={disabled}
                  onSave={onSave}
                />
                <PreferenceSlider
                  setting="controlBorderRadius"
                  id={controlRadiusLabelId}
                  value={controlBorderRadius}
                  disabled={disabled}
                  onSave={onSave}
                />
              </section>
            ),
          },
          {
            key: 'layout',
            label: (
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="i-lucide-panels-top-left text-14px" />
                <span>布局</span>
              </span>
            ),
            children: (
              <section className="flex flex-col gap-2 pb-2" aria-labelledby={labelId}>
                <h3 id={labelId} className="m-0 text-13px font-600 leading-5 text-text">
                  布局模式
                </h3>
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
                      aria-label={mode === 'default' ? '标准布局' : '紧凑布局'}
                      className="flex! h-auto! min-w-0 [&>span:last-child]:w-full px-2.5! py-3! rounded-ui! border! border-solid! border-border! bg-surface! text-text! text-center whitespace-normal! leading-normal! before:hidden! hover:border-accent! [&.ant-radio-button-wrapper-checked]:border-accent! [&.ant-radio-button-wrapper-checked]:bg-hover! [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-solid [&:has(:focus-visible)]:outline-accent [&:has(:focus-visible)]:outline-offset-2 motion-reduce:transition-none!"
                    >
                      <span className="flex w-full min-w-0 flex-col gap-3">
                        <SettingsPreview
                          layoutMode={mode}
                          themeMode={resolvedTheme}
                          selected={layoutMode === mode}
                        />
                        <span className="flex min-h-20px items-center justify-center gap-1.5 text-14px font-500 leading-5">
                          {mode === 'default' ? '标准布局' : '紧凑布局'}
                          {mode === defaultUserSettings.layoutMode && <SettingsDefaultBadge />}
                        </span>
                        <span className="text-12px leading-18px text-text-muted">
                          {mode === 'default' ? '模块留有间距，层次分明' : '模块无间距，边框线分隔'}
                        </span>
                      </span>
                    </Radio.Button>
                  ))}
                </Radio.Group>
                <PreferenceSlider
                  setting="layoutGap"
                  id={gapInputId}
                  value={layoutGap}
                  compact={layoutMode === 'compact'}
                  disabled={disabled || layoutMode === 'compact'}
                  onSave={onSave}
                />
                <h3 className="m-0 text-13px font-600 leading-5 text-text mt-1!">菜单显示</h3>
                <p className="m-0 text-12px leading-5 text-text-muted">
                  默认仅显示图标，悬停可查看名称。
                </p>
                <MenuDisplaySetting
                  label="导航栏"
                  icon="i-lucide-panel-left"
                  value={navigationIconOnly}
                  disabled={disabled}
                  onChange={(checked) => onSave({ navigationIconOnly: checked })}
                />
                <MenuDisplaySetting
                  label="头部工具栏"
                  icon="i-lucide-panel-top"
                  value={headerToolsIconOnly}
                  disabled={disabled}
                  onChange={(checked) => onSave({ headerToolsIconOnly: checked })}
                />
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
    </div>
  );
}
