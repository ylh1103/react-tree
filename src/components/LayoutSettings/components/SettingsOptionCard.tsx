/** 设置面板私有的选项卡片与状态标记，统一主题、导航、布局和加载图标的外观。 */
import { Radio } from 'antd';
import type { ComponentProps } from 'react';

/** 选中统一使用边框与底色，保留单选语义和键盘焦点，不让叠加标记遮住预览内容。 */
export function SettingsOptionCard({
  children,
  className = '',
  ...props
}: ComponentProps<typeof Radio.Button>) {
  return (
    <Radio.Button
      {...props}
      className={`
        relative flex! h-auto! min-w-0 [&>span:last-child]:w-full px-2.5! py-3! rounded-ui! border!
        border-solid! border-border! bg-surface! text-text! text-center whitespace-normal!
        leading-normal! before:hidden!
        [&:not(.ant-radio-button-wrapper-disabled):not(.ant-radio-button-wrapper-checked):hover]:border-text-muted!
        [&.ant-radio-button-wrapper-checked]:border-accent!
        [&.ant-radio-button-wrapper-checked]:bg-hover!
        [&.ant-radio-button-wrapper-disabled]:opacity-50 [&:has(:focus-visible)]:outline-2
        [&:has(:focus-visible)]:outline-solid [&:has(:focus-visible)]:outline-accent
        [&:has(:focus-visible)]:outline-offset-2
        ${className}
      `}
    >
      {children}
    </Radio.Button>
  );
}

/** 默认值与选中态分开标识，切换方案后仍能找到系统默认选项。 */
export function SettingsDefaultBadge() {
  return (
    <span className="rounded-control bg-sidebar px-1 text-11px font-400 leading-4 text-text-secondary">
      默认
    </span>
  );
}
