/** 模拟已完成 SSO 的会话，设置按用户保存；编辑器 theme 与平台 themeMode 独立。 */
import type { SessionUser } from '../types/session.ts';
import { mockConfig } from './config.ts';
import { readMock, writeMock } from './storage.ts';

export function currentMockUser(): SessionUser {
  const scenario = mockConfig.scenario;
  const ystId =
    scenario === 'new-user' ? 'new-user' : scenario === 'contractor' ? 'IT009682' : '310798';
  return {
    expireTime: String(Math.floor(Date.now() / 1000) + (scenario === 'expired' ? -60 : 3600)),
    userSetting: readMock(
      `settings:${ystId}`,
      JSON.stringify({ theme: 'vs', defaultCheckAllEnvTag: true }),
    ),
    openId: `mock:${ystId}`,
    ystId,
    employeeId: ystId === '310798' ? '80310798' : ystId,
    netEnv: '0',
    userType: scenario === 'platform' ? '0' : '1',
    userName:
      scenario === 'new-user' ? '新用户' : scenario === 'contractor' ? '外包员工' : '谢伟业',
    department: '招商银行/总行/信息技术部/零售应用研发中心/信用卡开发团队',
    cmbUserType: scenario === 'contractor' ? '3' : '2',
  };
}

export function saveMockSettings(userSetting: string, identity = currentMockUser().ystId) {
  JSON.parse(userSetting);
  writeMock(`settings:${identity}`, userSetting);
  return { userSetting };
}
