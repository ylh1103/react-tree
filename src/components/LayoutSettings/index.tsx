/**
 * 设置页面与抽屉共用的布局、主题和图标显示配置面板。
 * 所有更改通过 Redux 保存；失败反馈和重试读取同一个状态机，主题预览复用主题定义。
 */
import { Alert, Button, InputNumber, Radio, Segmented, Slider, Tabs } from 'antd';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  loadUserSettings,
  previewLayoutGap,
  previewBorderRadius,
  previewControlBorderRadius,
} from '@/store/slices/preferencesSlice';
import { navigationThemeVariables, themeVariablesByMode } from '@/styles/theme';
import type {
  LayoutMode,
  NavigationTheme,
  ResolvedThemeMode,
  UserSettings,
} from '@/types/preferences';
import { defaultUserSettings, layoutGapRange, borderRadiusRange } from '@/types/preferences';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { LoadingStyleSetting } from './components/LoadingStyleSetting';
import { SettingsOptionCard, SettingsDefaultBadge } from './components/SettingsOptionCard';
import { navigationItems } from '@/router/config';

/** 预览取实际导航前两个入口，图标和名称随路由配置更新，不另维护一份示例菜单。 */
const navigationPreviewItems = navigationItems.filter((item) => !item.bottom).slice(0, 2);

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
  className = '',
  navigationTheme: previewNavigationTheme,
}: {
  layoutMode: LayoutMode;
  themeMode: ResolvedThemeMode;
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
      className={`relative block h-80px w-full shrink-0 overflow-hidden rounded-ui border border-solid border-border bg-canvas ${className}`}
    >
      <span className="flex h-17px items-center gap-1 border-b border-b-solid border-divider bg-header px-2">
        <span className="h-5px w-5px rounded-full bg-accent" />
        <span className="h-3px w-8 rounded-full bg-text-muted opacity-40" />
      </span>
      <span className={`flex h-63px ${compact ? 'gap-0 p-0' : 'gap-1 p-1'}`}>
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
    </span>
  );
}

/** 明暗拼接复用原尺寸布局，与浅色、暗色缩略图使用相同宽高，不再单独缩放内容。 */
function SystemThemePreview({ layoutMode }: { layoutMode: LayoutMode }) {
  return (
    <span
      aria-hidden="true"
      className="relative block h-80px w-full shrink-0 overflow-hidden rounded-ui border border-solid border-border isolate"
    >
      <span className="absolute inset-0">
        <SettingsPreview
          layoutMode={layoutMode}
          themeMode="light"
          className="border-0! rounded-none!"
        />
      </span>
      <span className="absolute inset-0 [clip-path:polygon(58%_0,100%_0,100%_100%,42%_100%)]">
        <SettingsPreview
          layoutMode={layoutMode}
          themeMode="dark"
          className="border-0! rounded-none!"
        />
      </span>
    </span>
  );
}

/** 按缩略图比例收紧实际导航排列，保留清晰字号；文字显隐直接消费菜单配置。 */
function NavigationColorPreview({
  mode,
  themeMode,
  iconOnly,
}: {
  mode: NavigationTheme;
  themeMode: ResolvedThemeMode;
  iconOnly: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      style={
        { ...themeVariablesByMode[themeMode], ...navigationThemeVariables[mode] } as CSSProperties
      }
      className="relative block h-104px w-full shrink-0 overflow-hidden rounded-ui border border-solid border-border flex! bg-surface"
    >
      <span
        className={`flex shrink-0 flex-col gap-0.5 bg-nav px-0.75 py-1 ${iconOnly ? 'w-40px' : 'w-52px'}`}
      >
        {navigationPreviewItems.map(({ id, label, icon }, index) => (
          <span
            key={id}
            className={`flex w-full shrink-0 flex-col items-center justify-center gap-0.5 ${iconOnly ? 'min-h-36px' : 'min-h-46px'} ${index === 0 ? 'font-600 text-nav-emphasis' : 'text-nav-text'}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-control ${index === 0 ? 'bg-nav-active text-nav-active-text' : ''}`}
            >
              <span
                className={`${icon} shrink-0 ${iconOnly ? 'h-22px w-22px' : 'h-20px w-20px'}`}
              />
            </span>
            {!iconOnly && <span className="whitespace-nowrap text-11px leading-14px">{label}</span>}
          </span>
        ))}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2 border-l border-l-solid border-divider bg-surface p-2">
        <span className="h-1 w-2/3 rounded-full bg-text-muted opacity-40" />
        <span className="flex flex-1 flex-col gap-2 rounded-control border border-solid border-divider bg-sidebar p-1.5">
          <span className="h-1 w-3/4 rounded-full bg-text-muted opacity-30" />
          <span className="h-1 w-full rounded-full bg-text-muted opacity-15" />
          <span className="h-1 w-2/3 rounded-full bg-text-muted opacity-15" />
        </span>
      </span>
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
  // 输入框允许暂时为空，用本地草稿承接编辑；只有合法数字进入 Redux 预览，失焦时再提交。
  const [inputDraft, setInputDraft] = useState<number | null | undefined>(undefined);
  const marks = Object.fromEntries(
    [compact ? 0 : range.min, defaultUserSettings[setting], range.max].map((gap) => [
      gap,
      <span key={gap} className="whitespace-nowrap text-12px leading-4 text-text-muted">
        {gap}
        {!compact && gap === defaultUserSettings[setting] && ' 默认'}
      </span>,
    ]),
  );
  useEffect(
    () => () => {
      dispatch(previewAction(null));
    },
    [dispatch, previewAction],
  );
  // 只有完成交互且数值改变才请求保存；滑块 onChange 仅预览，避免拖动时逐帧请求。
  const commit = (next: number) => {
    if (disabled) return;
    if (next !== value) onSave({ [setting]: next });
    else dispatch(previewAction(null));
  };
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <span id={id} className="text-14px font-500 text-text">
          {title}
        </span>
        <InputNumber
          size="small"
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
          className={`w-84px! ${disabled ? '[&_input]:text-text-muted!' : '[&_input]:text-accent-text!'} [&_input]:font-600 [&_input]:tabular-nums`}
        />
      </div>
      <p
        id={`${id}-description`}
        className={compact ? 'm-0 mt-1 text-12px leading-5 text-text-muted' : 'sr-only'}
      >
        {compact
          ? `标准布局已保存 ${value} px，切换后恢复`
          : setting === 'borderRadius'
            ? '内容面板和列表节点的圆角，松开滑块或结束输入后保存'
            : setting === 'controlBorderRadius'
              ? '按钮、输入框等控件的圆角，松开滑块或结束输入后保存'
              : '模块间距，松开滑块或结束输入后保存'}
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
          className={`mx-0! mt-3! mb-5! [&_.ant-slider-mark-text]:text-12px [&_.ant-slider-mark-text]:tabular-nums [&_.ant-slider-dot]:w-2px! [&_.ant-slider-dot]:h-6px! [&_.ant-slider-dot]:top-3px! [&_.ant-slider-dot]:rounded-1px! [&_.ant-slider-dot]:border-0! [&_.ant-slider-dot]:bg-border! ${disabled ? '' : '[&_.ant-slider-dot-active]:bg-accent!'}`}
        />
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

/** 控件只提交修改字段；每个标签面板独立滚动，切页不会继承其他分组的位置或被标签栏遮挡。
 * 保存、回退与重试由抽屉及 Redux 状态机统一处理。
 */
export function LayoutSettings({ onSave }: { onSave: (changes: Partial<UserSettings>) => void }) {
  // 按字段订阅，滑块预览、请求编号和抽屉状态更新不会反复重渲染整个配置面板。
  const status = useAppSelector((state) => state.preferences.status);
  const error = useAppSelector((state) => state.preferences.error);
  const layoutMode = useAppSelector((state) => state.preferences.layoutMode);
  const layoutGap = useAppSelector((state) => state.preferences.layoutGap);
  const borderRadius = useAppSelector((state) => state.preferences.borderRadius);
  const controlBorderRadius = useAppSelector((state) => state.preferences.controlBorderRadius);
  const themeMode = useAppSelector((state) => state.preferences.themeMode);
  const navigationTheme = useAppSelector((state) => state.preferences.navigationTheme);
  const navigationIconOnly = useAppSelector((state) => state.preferences.navigationIconOnly);
  const headerToolsIconOnly = useAppSelector((state) => state.preferences.headerToolsIconOnly);
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
  // 读取错误时禁用写入，防止默认显示值覆盖损坏配置；保存中继续允许编辑，由队列串行发送。
  const disabled = loading || status === 'load-error';
  return (
    <div
      className="flex h-full min-h-0 flex-col gap-3 [--color-text-muted:var(--color-text-secondary)] [--color-accent-text:var(--color-settings-accent-text)]"
      aria-busy={loading || saving}
    >
      <Tabs
        defaultActiveKey="appearance"
        tabBarGutter={0}
        className="min-h-0 flex-1 [&_.ant-tabs-body-holder]:min-h-0 [&_.ant-tabs-body-holder]:overflow-hidden [&_.ant-tabs-nav-list]:w-full [&_.ant-tabs-nav-list]:gap-1 [&_.ant-tabs-nav-list]:rounded-ui [&_.ant-tabs-nav-list]:bg-sidebar [&_.ant-tabs-nav-list]:p-1"
        classNames={{
          header: 'shrink-0! mx-1! pt-3! pb-2! mb-1! before:border-0!',
          body: 'h-full! min-h-0!',
          content: 'h-full! overflow-y-auto! overscroll-contain px-1 [scrollbar-width:thin]',
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
              <section className="flex flex-col gap-3 pb-4" aria-labelledby={themeLabelId}>
                <h3 id={themeLabelId} className="m-0 text-14px font-600 leading-5 text-text">
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
                    <SettingsOptionCard
                      key={mode}
                      value={mode}
                      aria-label={label}
                      className={mode === 'system' ? 'col-span-2 text-left!' : ''}
                    >
                      {mode === 'system' ? (
                        // 列间距含上排网格的 12px 与卡片两侧内边距 20px，使三张缩略图精确同宽。
                        <span className="grid w-full grid-cols-2 items-center gap-32px">
                          <SystemThemePreview layoutMode={layoutMode} />
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="flex items-center gap-2 text-14px font-500 leading-5">
                              {label}
                              {mode === defaultUserSettings.themeMode && <SettingsDefaultBadge />}
                            </span>
                            <span className="text-12px leading-4 text-text-muted">
                              {description}
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="flex w-full min-w-0 flex-col gap-2">
                          <SettingsPreview layoutMode={layoutMode} themeMode={mode} />
                          <span className="flex items-center justify-center gap-1.5 text-14px font-500 leading-5">
                            <span aria-hidden="true" className={`${icon} text-16px`} />
                            {label}
                          </span>
                        </span>
                      )}
                    </SettingsOptionCard>
                  ))}
                </Radio.Group>
                <h3
                  id={navigationThemeLabelId}
                  className="m-0 text-14px font-600 leading-5 text-text mt-3!"
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
                    <SettingsOptionCard key={value} value={value}>
                      <span className="flex w-full min-w-0 flex-col gap-2">
                        <NavigationColorPreview
                          mode={value}
                          themeMode={resolvedTheme}
                          iconOnly={navigationIconOnly}
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
                    </SettingsOptionCard>
                  ))}
                </Radio.Group>
                <LoadingStyleSetting disabled={disabled} onSave={onSave} />
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
              <section className="flex flex-col gap-3 pb-4" aria-labelledby={labelId}>
                <h3 id={labelId} className="m-0 text-14px font-600 leading-5 text-text">
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
                    <SettingsOptionCard
                      key={mode}
                      value={mode}
                      aria-label={mode === 'default' ? '标准布局' : '紧凑布局'}
                    >
                      <span className="flex w-full min-w-0 flex-col gap-2">
                        <SettingsPreview layoutMode={mode} themeMode={resolvedTheme} />
                        <span className="flex min-h-20px items-center justify-center gap-1.5 text-14px font-500 leading-5">
                          {mode === 'default' ? '标准布局' : '紧凑布局'}
                          {mode === defaultUserSettings.layoutMode && <SettingsDefaultBadge />}
                        </span>
                        <span className="text-12px leading-18px text-text-muted">
                          {mode === 'default' ? '模块留有间距，层次分明' : '模块无间距，边框线分隔'}
                        </span>
                      </span>
                    </SettingsOptionCard>
                  ))}
                </Radio.Group>
                <div className="mt-2">
                  <h3 className="m-0 text-14px font-600 leading-5 text-text">间距与圆角</h3>
                  <p className="m-0 mt-1 text-12px leading-5 text-text-muted">
                    松开滑块或结束输入后自动保存。
                  </p>
                </div>
                <div className="rounded-ui bg-sidebar px-3 [&>div+div]:border-t [&>div+div]:border-t-solid [&>div+div]:border-divider">
                  <PreferenceSlider
                    setting="layoutGap"
                    id={gapInputId}
                    value={layoutGap}
                    compact={layoutMode === 'compact'}
                    disabled={disabled || layoutMode === 'compact'}
                    onSave={onSave}
                  />
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
                  />{' '}
                </div>
                <h3 className="m-0 text-14px font-600 leading-5 text-text mt-1!">菜单显示</h3>
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
