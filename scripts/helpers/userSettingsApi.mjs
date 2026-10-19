/**
 * 设置状态流程测试使用 Node 原生方法 mock 替换 API；替身在测试结束后由 TestContext 自动恢复。
 * 同一测试中的 Store 共用接口实现，与多个页签访问同一个后端的业务方式一致。
 * HTTP、Mock adapter 和完整配置文档的契约测试继续调用实际 API，不使用此辅助函数。
 */
import { userSettingsApi } from '../../src/api/preferences.ts';

/** 替换当前测试的设置读写方法，不在生产 Store 中增加测试参数或依赖注入。 */
export function mockUserSettingsApi(t, implementation) {
  t.mock.method(userSettingsApi, 'load', implementation.load);
  t.mock.method(userSettingsApi, 'save', implementation.save);
}
