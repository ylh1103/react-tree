/** 展示原站按住两秒确认的交互，释放、失焦、取消和卸载都会清理计时。 */
import { useEffect, useRef, useState } from 'react';
import Button from 'antd/es/button';

export default function HoldButton() {
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function release() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }
  function start() {
    if (timer.current) return;
    setConfirmed(false);
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      setConfirmed(true);
    }, 2000);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className="flex h-full items-center justify-center">
      <Button
        aria-describedby="hold-instruction"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          start();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onBlur={release}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (!event.repeat) start();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            release();
          }
        }}
        className="relative! h-44px! overflow-hidden! rounded-14px! px-22px! select-none touch-none"
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 bg-white/20 ${holding ? 'w-full transition-[width] duration-2000 ease-linear' : 'w-0'}`}
        />
        <span role="status" className="relative">
          {confirmed ? (
            <>
              <span aria-hidden="true" className="i-lucide-check size-1em align-middle " />{' '}
              Confirmed
            </>
          ) : (
            'Hold to confirm'
          )}
        </span>
      </Button>
      <span id="hold-instruction" className="sr-only">
        Press and hold for 2 seconds to confirm
      </span>
    </div>
  );
}
