/** 人员卡片：头像、姓名、编号与会话入口，供负责人、审批人列表和申请弹窗统一使用。 */
import { App, Avatar, Button } from 'antd';

export interface PersonChatButtonProps {
  name: string;
  id?: string;
  initial: string;
  /** 紧凑尺寸，用于浮层等空间有限的场景。 */
  compact?: boolean;
}

export default function PersonChatButton({
  name,
  id,
  initial,
  compact = false,
}: PersonChatButtonProps) {
  const { message } = App.useApp();
  return (
    <Button
      type="text"
      block
      className={`group h-auto! min-w-0! justify-start! gap-2.5! rounded-ui! border! border-solid! border-border-subtle! bg-surface! ${compact ? 'min-h-44px! px-2.5! py-1!' : 'min-h-54px! px-3! py-2!'} text-left! transition-[border-color,background-color] duration-150 motion-reduce:transition-none hover:border-accent-border-hover! hover:bg-hover! layout-focus`}
      aria-label={`打开与 ${name}${id ? `（${id}）` : ''} 的会话`}
      // 会话功能接入后在此打开对话窗口。
      onClick={() => void message.info('会话功能尚未接入')}
    >
      <Avatar
        size={compact ? 28 : 32}
        className="shrink-0 bg-hover! text-13px! font-600! text-accent-text!"
        aria-hidden="true"
      >
        {initial}
      </Avatar>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-13px font-600 leading-18px text-text" title={name}>
          {name}
        </span>
        {id && (
          <span className="truncate text-12px leading-16px text-text-muted tabular-nums">{id}</span>
        )}
      </span>
      <span
        className={`flex ${compact ? 'size-24px' : 'size-28px'} shrink-0 items-center justify-center rounded-full text-text-muted transition-[color,background-color] duration-150 motion-reduce:transition-none group-hover:bg-surface group-hover:text-accent-text`}
        aria-hidden="true"
      >
        <span className="i-lucide-message-circle size-14px" />
      </span>
    </Button>
  );
}
