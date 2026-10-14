/** 当前会话接口，真实 SSO 接入时只调整 HTTP 接入，不依赖页面或 Mock。 */
import { requestData } from '../http/request.ts';
import { parseSession, type SessionUser } from '../types/session.ts';

export async function loadSession(signal?: AbortSignal) {
  return parseSession(await requestData<SessionUser>({ url: '/api/session', signal }));
}
