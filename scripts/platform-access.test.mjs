import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
/** 系统接口回归：不构造登录身份，保留接口错误、请求去重、配置完整性及取消边界。 */
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { mockConfig } from '../src/mocks/config.ts';
import { writeMock, readMock } from '../src/mocks/storage.ts';
import { loadSystems, loadSystemAccess, createSystem } from '../src/api/systems.ts';
import { loadSystemParameters } from '../src/api/parameters.ts';
import { createSystemApplicationApi } from '../src/api/applications.ts';
import { httpClient, requestData } from '../src/http/request.ts';
import { createAppStore } from '../src/store/index.ts';
import { queryClient } from '../src/queries/client.ts';
import { requireSystemAccess, systemAccessOptions } from '../src/queries/systems.ts';
import { preloadApplications, preloadDatabase } from '../src/router/loaders.ts';
import {
  loadUserSettings,
  saveUserSettings,
  cancelPreferencesRequests,
  resetPreferences,
} from '../src/store/slices/preferencesSlice.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';

mockConfig.delayMs = 0;
afterEach(() => {
  mockConfig.systemAccessError = null;
  mockConfig.delayMs = 0;
  queryClient.clear();
});

test('系统列表及 Store 不含访问者资料，已移除的登录接口不返回伪造身份', async () => {
  const items = await loadSystems();
  assert.ok(items.length > 0);
  for (const item of items) {
    assert.equal('ystId' in item, false);
    assert.equal('role' in item, false);
    assert.equal('userRelation' in item, false);
  }
  assert.deepEqual(Object.keys(createAppStore().getState()), ['preferences']);
  await assert.rejects(requestData({ url: '/api/session' }), (error) => error.status === 404);
  await assert.rejects(loadSystemAccess('不存在'), (error) => error.status === 404);
});

test('创建系统保留业务校验和空清单，不从虚构用户填充负责人或角色', async () => {
  const name = `TEST_${Date.now()}`;
  const system = await createSystem({
    systemName: ` ${name} `,
    systemChineseName: '新系统',
    systemArchNo: ` ${name}.ARCH `,
  });
  assert.equal(system.systemName, name);
  assert.equal(system.systemCharges, '');
  assert.equal('role' in system, false);
  assert.equal(
    (await loadSystems()).some((item) => item.systemName === name),
    true,
  );
  assert.deepEqual(await createSystemApplicationApi(name).getItems(), []);
  assert.deepEqual(await loadSystemParameters(name), []);
  await assert.rejects(
    createSystem({ systemName: name, systemChineseName: '重复', systemArchNo: 'OTHER' }),
    (error) => error.status === 409,
  );
  await assert.rejects(
    createSystem({
      systemName: 'OTHER',
      systemChineseName: '重复',
      systemArchNo: system.systemArchNo,
    }),
    (error) => error.status === 409,
  );
});

test('旧模拟持久化只返回系统业务资料，不恢复已删除的访问者字段', async (t) => {
  const original = await loadSystems();
  t.after(() => writeMock('systems', original));
  writeMock('systems', [{ ...original[0], ystId: 'legacy', role: 'R', userRelation: true }]);
  const [system] = await loadSystems();
  assert.equal(system.systemName, original[0].systemName);
  assert.equal(system.systemCharges, original[0].systemCharges);
  assert.equal('ystId' in system, false);
  assert.equal('role' in system, false);
  assert.equal('userRelation' in system, false);
});

test('系统统计与应用、参数实际返回数量一致', async () => {
  const system = await loadSystemAccess('CAC');
  assert.equal((await createSystemApplicationApi('CAC').getItems()).length, system.appCount);
  assert.equal((await loadSystemParameters('CAC')).length, system.paramTypeCount);
});

test('父子 loader 共用系统访问请求，接口拒绝前不发送业务请求', async (t) => {
  const requests = [];
  const original = httpClient.request.bind(httpClient);
  t.mock.method(httpClient, 'request', (config) => {
    requests.push(config.url);
    return original(config);
  });
  await Promise.all([
    requireSystemAccess('CAC'),
    preloadApplications({ params: { systemName: 'CAC' } }),
    preloadDatabase({ params: { systemName: 'CAC' } }),
  ]);
  assert.equal(requests.filter((url) => url === '/api/systems/CAC/access').length, 1);
  assert.equal(requests[0], '/api/systems/CAC/access');
  assert.equal(requests.includes('/api/session'), false);
  requests.length = 0;
  mockConfig.systemAccessError = 403;
  await Promise.all([
    assert.rejects(
      preloadApplications({ params: { systemName: 'ParamPlat' } }),
      (error) => error.status === 403,
    ),
    assert.rejects(
      preloadDatabase({ params: { systemName: 'ParamPlat' } }),
      (error) => error.status === 403,
    ),
  ]);
  assert.deepEqual(requests, ['/api/systems/ParamPlat/access']);
});

test('接口返回 403 时传播错误，系统与业务缓存不再由全局监听改写', async () => {
  const system = await requireSystemAccess('CAC');
  const key = ['grouped-list', 'applications:CAC'];
  queryClient.setQueryData(key, ['旧数据']);
  mockConfig.systemAccessError = 403;
  await assert.rejects(requireSystemAccess('CAC'), (error) => error.status === 403);
  assert.deepEqual(queryClient.getQueryData(key), ['旧数据']);
  assert.deepEqual(queryClient.getQueryData(systemAccessOptions('CAC').queryKey), system);
  assert.equal(queryClient.getQueryState(systemAccessOptions('CAC').queryKey).error.status, 403);
});

test('显示偏好保留完整文档；配置损坏时禁止覆盖并允许独立重试', async () => {
  writeMock(
    'display-settings',
    JSON.stringify({ theme: 'vs-dark', defaultCheckAllEnvTag: false, future: { value: 3 } }),
  );
  const local = createAppStore();
  await local.dispatch(loadUserSettings()).unwrap();
  await local.dispatch(saveUserSettings({ themeMode: 'dark' })).unwrap();
  const document = JSON.parse(readMock('display-settings', ''));
  assert.equal(document.theme, 'vs-dark');
  assert.equal(document.themeMode, 'dark');
  assert.equal(document.defaultCheckAllEnvTag, false);
  assert.deepEqual(document.future, { value: 3 });
  writeMock('display-settings', '{');
  local.dispatch(resetPreferences());
  await local.dispatch(loadUserSettings());
  assert.equal(local.getState().preferences.status, 'load-error');
  assert.equal(
    (await local.dispatch(saveUserSettings({ themeMode: 'light' }))).meta.condition,
    true,
  );
  assert.equal(readMock('display-settings', ''), '{');
  writeMock('display-settings', '{}');
  await local.dispatch(loadUserSettings()).unwrap();
  assert.equal(local.getState().preferences.status, 'ready');
});

test('整体取消后迟到保存不能恢复配置，排队写入也不会继续发送', async (t) => {
  let release;
  let signal;
  let writes = 0;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  mockUserSettingsApi(t, {
    load: async () => defaultUserSettings,
    save: async (settings, requestSignal) => {
      writes++;
      signal = requestSignal;
      await pending;
      return settings;
    },
  });
  const local = createAppStore();
  await local.dispatch(loadUserSettings()).unwrap();
  const first = local.dispatch(saveUserSettings({ themeMode: 'dark' }));
  const next = local.dispatch(saveUserSettings({ layoutMode: 'compact' }));
  cancelPreferencesRequests(local.getState);
  local.dispatch(resetPreferences());
  assert.equal(signal.aborted, true);
  await local.dispatch(loadUserSettings()).unwrap();
  release();
  await Promise.all([first, next]);
  assert.equal(writes, 1);
  assert.equal(local.getState().preferences.status, 'ready');
  assert.equal(local.getState().preferences.themeMode, 'system');
});

test('模拟请求超时和取消保持有效，取消的创建不产生业务数据', async () => {
  mockConfig.delayMs = 50;
  await assert.rejects(requestData({ url: '/api/systems', timeout: 5 }), /请求超时/);
  const name = `CANCELLED_${Date.now()}`;
  const controller = new AbortController();
  const writing = requestData({
    url: '/api/systems',
    method: 'POST',
    data: { systemName: name, systemChineseName: '取消创建', systemArchNo: name },
    signal: controller.signal,
  });
  controller.abort();
  await assert.rejects(writing, (error) => error.code === 'ERR_CANCELED');
  assert.equal(
    (await loadSystems()).some((item) => item.systemName === name),
    false,
  );
});
