/** 标记系统存在性与访问校验失败，避免路由错误页将系统 404 混同为页面 404。 */
import { HttpError } from '@/http/request.ts';
import type { SystemJoinTarget } from '@/types/systems.ts';

export class SystemAccessError extends HttpError {
  /** 仅在已确认系统存在且当前用户未加入时提供申请所需资料。 */
  readonly joinTarget?: SystemJoinTarget;

  constructor(status: 403 | 404, message: string, joinTarget?: SystemJoinTarget) {
    super(status, message);
    this.joinTarget = joinTarget;
  }
}
