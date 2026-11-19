/** 将目录查询失败同步到全局消息，权限错误由面板展示 403。 */
import { useEffect } from 'react';
import { App } from 'antd';
import { isAccessDenied } from '@/utils/systems';

export function useSystemQueryError(error: Error | null, errorUpdatedAt: number, title: string) {
  const { message } = App.useApp();

  useEffect(() => {
    if (!error || isAccessDenied(error)) return;
    void message.error({ key: title, content: `${title}：${error.message}` });
  }, [error, errorUpdatedAt, message, title]);
}
