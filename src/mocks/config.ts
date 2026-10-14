/** Mock 场景集中维护，不使用环境变量或正式界面的身份切换按钮。 */
export type MockScenario = 'platform' | 'member' | 'new-user' | 'contractor' | 'expired';
export const mockConfig: { scenario: MockScenario; delayMs: number; applicationCount: number } = {
  scenario: 'platform',
  delayMs: 200,
  applicationCount: 785,
};
