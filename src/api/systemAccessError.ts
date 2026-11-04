/** 标记系统存在性与访问校验失败，避免路由错误页将系统 404 混同为页面 404。 */
import { HttpError } from '@/http/request.ts';

export class SystemAccessError extends HttpError {
  constructor(status: 403 | 404, message: string) {
    super(status, message);
  }
}
