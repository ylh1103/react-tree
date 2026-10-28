/** 两类编辑器共用的加载占位，保持调用方指定的尺寸，避免异步加载期间布局塌陷。 */
import type { ReactNode } from 'react';
import { Spin } from 'antd';

interface EditorLoadingProps {
  width?: number | string;
  height?: number | string;
  children?: ReactNode;
}

export function EditorLoading({ width = '100%', height = 400, children }: EditorLoadingProps) {
  return (
    <div
      className="grid place-items-center min-w-0"
      style={{ width, height }}
      role="status"
      aria-label="正在加载编辑器"
      aria-busy="true"
    >
      {children === undefined ? <Spin /> : children}
    </div>
  );
}
