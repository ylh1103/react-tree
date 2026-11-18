/** 申请链接是只读分享内容，URL 中的字段不作为身份凭据或授权依据。 */
import { systemRoleLabels } from './systemRoles.ts';
import type { SystemRole } from '@/types/systems.ts';

export const systemJoinRequestRoute = 'system-join-request';

interface SystemJoinLinkFields {
  ystId: string;
  userName: string;
  systemName: string;
  /** 中文名仅作展示，兼容未携带此字段的旧链接。 */
  systemChineseName?: string;
  role: SystemRole;
}

export function systemJoinRequestPath({
  ystId,
  userName,
  systemName,
  systemChineseName,
  role,
}: SystemJoinLinkFields) {
  const params = new URLSearchParams({ ystId, userName, systemName, role });
  if (systemChineseName?.trim()) params.set('systemChineseName', systemChineseName.trim());
  return `/${systemJoinRequestRoute}?${params}`;
}

export function readSystemJoinLink(params: URLSearchParams): SystemJoinLinkFields | null {
  const ystId = params.get('ystId');
  const userName = params.get('userName')?.trim() ?? '';
  const systemName = params.get('systemName');
  const systemChineseName = params.get('systemChineseName')?.trim() ?? '';
  const role = params.get('role');
  if (!ystId?.trim() || !systemName?.trim() || !role || !Object.hasOwn(systemRoleLabels, role)) {
    return null;
  }
  return { ystId, userName, systemName, systemChineseName, role: role as SystemRole };
}
