/** 操作型 Tooltip：统一延迟、即时隐藏和再次交互前的显示抑制，避免布局切换留下旧浮层。 */
import { useRef, useState } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import type { TooltipProps } from 'antd';

type TriggerHandlers = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onMouseEnter' | 'onFocusCapture'
>;

/**
 * 将 tooltipProps 传给 Tooltip，getTriggerProps() 的返回值传给按钮；已有事件通过参数合并。
 * 点击和快捷键共用的操作函数中调用 run(action)，在同步操作及程序聚焦期间抑制提示。
 * 布局会从外部变化时，scope 与触发区域的 key 保持一致，防止重建后恢复旧的打开状态。
 */
export function useActionTooltip(scope?: string) {
  const suppressedRef = useRef(false);
  const runningActionRef = useRef(false);
  const [visibility, setVisibility] = useState({ scope, open: false });
  const open = visibility.scope === scope && visibility.open;

  function dismiss() {
    suppressedRef.current = true;
    setVisibility({ scope, open: false });
  }

  /** 聚焦和状态切换必须同步执行；异步请求可在 action 中发起，但后续异步聚焦不属于本次操作。 */
  function run<Result>(action: () => Result): Result {
    dismiss();
    const wasRunning = runningActionRef.current;
    runningActionRef.current = true;
    try {
      return action();
    } finally {
      // 支持同一操作内嵌套调用，且异常不会让后续 Tab 聚焦一直被抑制。
      runningActionRef.current = wasRunning;
    }
  }

  const tooltipProps: TooltipProps = {
    mouseEnterDelay: 0.3,
    trigger: ['hover', 'focus'],
    open,
    onOpenChange(nextOpen) {
      // 同时拦截操作前已排队的 hover/focus 延迟任务。
      if (!nextOpen || !suppressedRef.current) setVisibility({ scope, open: nextOpen });
    },
    // 跳过关闭时的退场画面，防止提示在旧坐标显示新动作文字。
    classNames: { root: open ? undefined : 'hidden!' },
  };

  /** 只合并提示所需的交互事件，内部逻辑先执行；点击由调用处显式绑定到共享操作函数。 */
  function getTriggerProps(handlers: TriggerHandlers = {}): TriggerHandlers {
    return {
      ...handlers,
      onMouseEnter(event) {
        suppressedRef.current = false;
        handlers.onMouseEnter?.(event);
      },
      onFocusCapture(event) {
        // 捕获阶段早于 Ant Design 的 focus 处理，防止恢复逻辑执行得太晚。
        if (!runningActionRef.current) suppressedRef.current = false;
        handlers.onFocusCapture?.(event);
      },
    };
  }

  return { tooltipProps, getTriggerProps, run, dismiss };
}
