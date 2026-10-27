import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
/** 系统接口回归：不构造登录身份，保留接口错误、请求去重、配置完整性及取消边界。 */
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { mockConfig } from '../src/mocks/config.ts';
import { writeMock, readMock } from '../src/mocks/storage.ts';
import {
  loadSystems,
  loadMySystems,
  loadSystemPage,
  loadSystemAccess,
  createSystem,
} from '../src/api/systems.ts';
import { loadSystemParameters } from '../src/api/parameters.ts';
import { createSystemApplicationApi } from '../src/api/applications.ts';
import { httpClient, requestData } from '../src/http/request.ts';
import { createAppStore } from '../src/store/index.ts';
import { queryClient } from '../src/queries/client.ts';
import {
  requireSystemAccess,
  systemAccessOptions,
  mySystemsOptions,
  systemsOptions,
  systemPageOptions,
} from '../src/queries/systems.ts';
import { preloadApplications, preloadDatabase, preloadSystems } from '../src/router/loaders.ts';
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

test('全部目录只包含加入标记，Store 与访问接口不构造登录身份', async () => {
  const items = await loadSystems();
  assert.ok(items.length > 0);
  for (const item of items) {
    assert.equal('ystId' in item, false);
    assert.equal('role' in item, false);
    assert.equal(typeof item.userRelation, 'boolean');
  }
  assert.deepEqual(Object.keys(createAppStore().getState()), ['preferences']);
  await assert.rejects(requestData({ url: '/api/session' }), (error) => error.status === 404);
  await assert.rejects(loadSystemAccess('不存在'), (error) => error.status === 404);
  const access = await loadSystemAccess('CAC');
  for (const field of ['ystId', 'role', 'userRelation']) assert.equal(field in access, false);
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
  const mine = (await loadMySystems()).find((item) => item.systemName === name);
  assert.equal(mine.role, 'R');
  assert.equal(mine.ystId, '');
  assert.equal((await loadSystems()).find((item) => item.systemName === name).userRelation, true);
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
  const originalMine = await loadMySystems();
  t.after(() => writeMock('systems', original));
  writeMock('systems', [{ ...original[0], ystId: 'legacy', role: 'R', userRelation: true }]);
  const [system] = await loadSystems();
  assert.equal(system.systemName, original[0].systemName);
  assert.equal(system.systemCharges, original[0].systemCharges);
  assert.equal('ystId' in system, false);
  assert.equal('role' in system, false);
  assert.equal(system.userRelation, true);
  const [mine] = await loadMySystems();
  const relation = originalMine.find((item) => item.systemName === system.systemName);
  assert.equal(mine.ystId, relation.ystId);
  assert.equal(mine.role, relation.role);
});

test('我的系统按独立接口关系返回角色，负责人相同的系统不会自动加入', async () => {
  const [mine, all] = await Promise.all([loadMySystems(), loadSystems()]);
  const example = mine.find((item) => item.systemName === 'CACTEST1');
  assert.equal(example.ystId, '310798');
  assert.equal(example.role, 'V');
  assert.equal(example.ownRoom, '992484/信用卡账务开发一室');
  assert.equal('userRelation' in example, false);
  for (const item of all) {
    assert.equal(
      item.userRelation,
      mine.some((related) => related.systemName === item.systemName),
    );
  }
  assert.equal(all.find((item) => item.systemName === 'demo_1').userRelation, false);
  mockConfig.systemAccessError = 403;
  await assert.rejects(requireSystemAccess(example.systemName), (error) => error.status === 403);
});

test('系统统计与应用、参数实际返回数量一致', async () => {
  const system = await loadSystemAccess('CAC');
  assert.equal((await createSystemApplicationApi('CAC').getItems()).length, system.appCount);
  assert.equal((await loadSystemParameters('CAC')).length, system.paramTypeCount);
});

test('首页只预取我的系统，与页面查询去重且保留取消信号', async (t) => {
  const requests = [];
  const original = httpClient.request.bind(httpClient);
  t.mock.method(httpClient, 'request', (config) => {
    requests.push(config.url);
    assert.ok(config.signal);
    return original(config);
  });
  await Promise.all([preloadSystems(), queryClient.query(mySystemsOptions())]);
  assert.deepEqual(requests, ['/api/systems/mine']);
  assert.ok(queryClient.getQueryData(mySystemsOptions().queryKey).length > 0);
  assert.equal(queryClient.getQueryData(systemsOptions().queryKey), undefined);
  mockConfig.delayMs = 50;
  const controller = new AbortController();
  const mine = loadMySystems(controller.signal);
  controller.abort();
  await assert.rejects(mine, (error) => error.code === 'ERR_CANCELED');
});

test('全部目录由接口先筛选再分页，返回全量 total 与当前页 records', async () => {
  const params = { pageNum: 1, pageSize: 2, keyword: '' };
  const [all, first, second] = await Promise.all([
    loadSystems(),
    loadSystemPage(params),
    loadSystemPage({ ...params, pageNum: 2 }),
  ]);
  assert.equal(first.total, all.length);
  assert.equal(first.records.length, 2);
  assert.deepEqual(first.records, all.slice(0, 2));
  assert.deepEqual(second.records, all.slice(2, 4));
  assert.equal(second.pageNum, 2);
  const filtered = await loadSystemPage({ ...params, keyword: 'demo_1', userRelation: false });
  assert.equal(filtered.total, 1);
  assert.equal(filtered.records[0].systemName, 'demo_1');
  assert.equal(filtered.records[0].userRelation, false);
  const empty = await loadSystemPage({ ...params, pageNum: 4, keyword: '无匹配的唯一系统名称' });
  assert.deepEqual(empty, { records: [], total: 0, pageNum: 1, pageSize: 2 });
  const last = await loadSystemPage({ ...params, pageNum: 999 });
  assert.equal(last.pageNum, Math.ceil(all.length / 2));
  assert.deepEqual(last.records, all.slice((last.pageNum - 1) * 2));
  await assert.rejects(loadSystemPage({ ...params, pageSize: 0 }), (error) => error.status === 400);
});

test('分页缓存包含所有查询维度，取消的分页读取不影响其他页或我的目录', async () => {
  const params = { pageNum: 1, pageSize: 2, keyword: '' };
  const options = [
    params,
    { ...params, pageNum: 2 },
    { ...params, pageSize: 8 },
    { ...params, keyword: 'CAC' },
    { ...params, userRelation: false },
  ].map(systemPageOptions);
  assert.equal(new Set(options.map((option) => JSON.stringify(option.queryKey))).size, 5);
  await Promise.all(options.map((option) => queryClient.query(option)));
  assert.equal(queryClient.getQueryData(options[0].queryKey).records.length, 2);
  assert.equal(queryClient.getQueryData(options[1].queryKey).pageNum, 2);
  mockConfig.delayMs = 50;
  const controller = new AbortController();
  const pending = loadSystemPage(params, controller.signal);
  controller.abort();
  await assert.rejects(pending, (error) => error.code === 'ERR_CANCELED');
  assert.equal(queryClient.getQueryData(options[0].queryKey).records.length, 2);
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
