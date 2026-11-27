import { Avatar, Button, Popover } from 'antd';
import { useId, useRef, useState } from 'react';
import PersonChatButton from '@/components/PersonChatButton';
import { peopleList } from '@/utils/systemPeople';
import { systemAvatarTone } from '../../systemAppearance';

/** 整组头像共用一个可容纳交互内容的浮层，负责人编号供后续会话入口使用。 */
export default function SystemOwners({ value }: { value: string | undefined }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const people = peopleList(value);
  if (people.length === 0) {
    return <span className="shrink-0 text-12px text-text-muted">负责人未配置</span>;
  }

  const visiblePeople = people.slice(0, 3);
  const hiddenCount = people.length - visiblePeople.length;
  const ownerAvatarClassName = `${systemAvatarTone} text-12px!`;

  return (
    <div
      className="inline-flex shrink-0"
      onKeyDown={(event) => {
        if (!open) return;
        if (event.key === 'Escape') {
          event.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
          return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

        // 保留 Tab 的自然顺序，方向键可从头像进入名单并在联系人之间循环。
        const buttons = Array.from(listRef.current?.querySelectorAll('button') ?? []);
        if (!buttons.length) return;
        event.preventDefault();
        event.stopPropagation();
        const current = buttons.findIndex((button) => button === event.target);
        const next =
          event.key === 'ArrowDown'
            ? (current + 1) % buttons.length
            : current <= 0
              ? buttons.length - 1
              : current - 1;
        buttons[next]?.focus();
      }}
    >
      <Popover
        placement="topLeft"
        arrow={false}
        trigger={['hover', 'click']}
        open={open}
        onOpenChange={setOpen}
        // 浮层挂在按钮之后，Tab 按 DOM 顺序进入负责人列表。
        getPopupContainer={(trigger) => trigger.parentElement ?? trigger}
        title={
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <span className="text-14px font-600">系统负责人</span>
            <span className="shrink-0 text-12px font-400 text-text-secondary tabular-nums">
              {people.length} 人
            </span>
          </div>
        }
        content={() => (
          <ul
            id={listId}
            ref={listRef}
            inert={!open}
            className="m-0 grid max-h-[min(18rem,38dvh)] w-232px max-w-[calc(100vw-48px)] list-none gap-1 overflow-y-auto overscroll-contain p-0.5 [scrollbar-width:thin]"
          >
            {people.map((person) => (
              <li key={person.key} className="min-w-0">
                <PersonChatButton
                  compact
                  name={person.name}
                  id={person.id}
                  initial={person.initial}
                />
              </li>
            ))}
          </ul>
        )}
      >
        <Button
          ref={triggerRef}
          type="text"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={`负责人：${peopleNames(value)}`}
          className="h-auto! shrink-0 rounded-full! p-0! layout-focus"
        >
          <Avatar.Group size={24} aria-hidden="true">
            {visiblePeople.map((person) => (
              <Avatar key={person.key} className={ownerAvatarClassName}>
                {person.initial}
              </Avatar>
            ))}
            {hiddenCount > 0 && <Avatar className={ownerAvatarClassName}>+{hiddenCount}</Avatar>}
          </Avatar.Group>
        </Button>
      </Popover>
    </div>
  );
}

/** 目录展示姓名，完整的姓名/编号串仍在提示与详情中保留。 */
function peopleNames(value: string | undefined) {
  return (
    value
      ?.split(',')
      .map((person) => person.trim().split('/')[0])
      .filter(Boolean)
      .join('、') || '暂未配置'
  );
}
