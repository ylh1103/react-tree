/** 环境参数演示数据故意乱序，覆盖生产、审批、空配置与负数差异状态。 */
import type { ApplicationEnvironment } from '@/types/applicationEnvironments.ts';

export function createMockApplicationEnvironments(
  systemName: string,
  appName: string,
): ApplicationEnvironment[] {
  return [
    { envTag: 'uat', envOrder: 30, envDesc: '验收测试' },
    { envTag: 'dev', envOrder: 10, envDesc: '开发环境' },
    { envTag: 'prd', envOrder: 50, envDesc: '生产环境' },
    { envTag: 'st', envOrder: 20, envDesc: '系统测试' },
    { envTag: 'stp', envOrder: 40, envDesc: '预生产环境' },
  ].map((env) => ({
    ...env,
    systemName,
    appName,
    isPrd: env.envTag === 'prd' ? '1' : '0',
    approvalRequiredFlag: env.envTag === 'st' ? 'Y' : 'N',
    configInfo:
      env.envTag === 'st'
        ? ' '
        : `spring:\n  application:\n    name: ${appName}\n  profiles:\n    active: ${env.envTag}\n`,
    saveStatus: 'Y',
    unsavedReason: '',
    techCrtTime: '2022-05-09T03:05:07.000+00:00',
    techMntTime: '2026-02-03T01:57:05.000+00:00',
    techVersion: 18,
    maintDate: '2026-02-03',
    maintUser: '谢伟业/80310798',
    currentVersion: 5,
    latestVersion: 12,
    latestShotMessage: '[谢伟业/80310798]2026-02-03：cs',
    currentShotMessage: '[吴图威/AAFNTD]2023-04-11：批量快照',
    enablePublish: 'Y',
    runtimeDifferNum: env.envTag === 'st' ? -2 : 3,
    risk: '1',
    gtwDifferFlag: '0',
  }));
}
