import { createSystemTestRouter } from './helpers/systemRouter.mjs';
import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
/** 系统接口回归：平台角色与成员关系决定系统访问，保留接口错误、请求去重、配置完整性及取消边界。 */
import assert from 'node:assert/strict';
import { CancelledError } from '@tanstack/react-query';
import test, { beforeEach, afterEach } from 'node:test';
import { mockConfig } from '../src/mocks/config.ts';
import { writeMock, readMock } from '../src/mocks/storage.ts';
import { loadSystems, loadMySystems, loadSystemPage, createSystem } from '../src/api/systems.ts';
import { loadSystemAccess } from '../src/api/systemAccess.ts';
import { loadSystemParameters } from '../src/api/parameters.ts';
import { createSystemApplicationApi } from '../src/api/applications.ts';
import { httpClient, requestData } from '../src/http/request.ts';
import { createDemoLoginUser } from '../src/mocks/login.ts';
import { setUserInfo } from '../src/store/slices/userSlice.ts';
import { store, createAppStore } from '../src/store/index.ts';
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
beforeEach(() => store.dispatch(setUserInfo(createDemoLoginUser('1'))));
afterEach(() => {
  mockConfig.systemAccessError = null;
  mockConfig.delayMs = 0;
  queryClient.clear();
});

test('全部目录只包含加入标记，空 Store 不自行构造身份，访问接口不返回登录资料', async () => {
  const items = await loadSystems();
  assert.ok(items.length > 0);
  for (const item of items) {
    assert.equal('ystId' in item, false);
    assert.equal('role' in item, false);
    assert.equal(typeof item.userRelation, 'boolean');
  }
  const state = createAppStore().getState();
  assert.deepEqual(Object.keys(state), ['preferences', 'user']);
  assert.deepEqual(state.user, { userInfo: null });
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

test('系统 middleware 在并行父子 loader 前统一授权，接口拒绝时不发送业务请求', async (t) => {
  const requests = [];
  const original = httpClient.request.bind(httpClient);
  t.mock.method(httpClient, 'request', (config) => {
    requests.push(config.url);
    return original(config);
  });
  const router = createSystemTestRouter([{ path: 'db', loader: preloadDatabase }], {
    loader: preloadApplications,
  });
  t.after(() => router.dispose());
  await router.navigate('/systems/CAC/db');
  assert.equal(router.state.errors, null);
  assert.equal(requests.filter((url) => url === '/api/systems/page').length, 0);
  assert.equal(requests[0], '/api/systems/mine');
  assert.equal(requests.filter((url) => url === '/api/systems/mine').length, 1);
  assert.equal(requests.includes('/api/session'), false);
  requests.length = 0;
  mockConfig.systemAccessError = 403;
  await router.navigate('/systems/ParamPlat/db');
  assert.equal(Object.values(router.state.errors)[0].status, 403);
  assert.deepEqual(requests, ['/api/systems/mine']);
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
    'display-settings:anonymous',
    JSON.stringify({ theme: 'vs-dark', defaultCheckAllEnvTag: false, future: { value: 3 } }),
  );
  const local = createAppStore();
  await local.dispatch(loadUserSettings()).unwrap();
  await local.dispatch(saveUserSettings({ themeMode: 'dark' })).unwrap();
  const document = JSON.parse(readMock('display-settings:anonymous', ''));
  assert.equal(document.theme, 'vs-dark');
  assert.equal(document.themeMode, 'dark');
  assert.equal(document.defaultCheckAllEnvTag, false);
  assert.deepEqual(document.future, { value: 3 });
  writeMock('display-settings:anonymous', '{');
  local.dispatch(resetPreferences());
  await local.dispatch(loadUserSettings());
  assert.equal(local.getState().preferences.status, 'load-error');
  assert.equal(
    (await local.dispatch(saveUserSettings({ themeMode: 'light' }))).meta.condition,
    true,
  );
  assert.equal(readMock('display-settings:anonymous', ''), '{');
  writeMock('display-settings:anonymous', '{}');
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

test('平台人员可访问未加入系统，普通用户仅能访问 V/D/R 成员系统，未登录不放行', async () => {
  for (const name of ['CACTEST1', 'ParamPlat', 'CAC'])
    assert.equal((await requireSystemAccess(name)).systemName, name);
  await assert.rejects(requireSystemAccess('demo_1'), (error) => error.status === 403);
  store.dispatch(setUserInfo(createDemoLoginUser('0')));
  assert.equal((await requireSystemAccess('demo_1')).systemName, 'demo_1');
  assert.equal(
    (await loadMySystems()).some((item) => item.systemName === 'demo_1'),
    false,
  );
  await assert.rejects(requireSystemAccess('not-a-system'), (error) => error.status === 404);
  store.dispatch(setUserInfo(createDemoLoginUser('1')));
  await assert.rejects(requireSystemAccess('demo_1'), (error) => error.status === 403);
  store.dispatch(setUserInfo(null));
  await assert.rejects(requireSystemAccess('CAC'), (error) => error.status === 401);
});

test('授权重新读取成员关系，撤销成员后旧访问成功缓存不能放行', async (t) => {
  const relations = readMock(
    'system-relations',
    (await import('../src/mocks/systems.ts')).mockSystemRelations,
  );
  t.after(() => writeMock('system-relations', relations));
  await requireSystemAccess('CAC');
  const next = { ...relations };
  delete next.CAC;
  writeMock('system-relations', next);
  await assert.rejects(requireSystemAccess('CAC'), (error) => error.status === 403);
  assert.equal(queryClient.getQueryState(systemAccessOptions('CAC').queryKey).error.status, 403);
});

test('存在性检索每页 999 条并精确匹配，跨页候选及取消、服务失败不误报 404', async (t) => {
  const requests = [];
  const original = httpClient.defaults.adapter;
  const sample = (await loadSystems())[0];
  httpClient.defaults.adapter = async (config) => {
    requests.push(config.params);
    assert.equal(config.url, '/api/systems/page');
    assert.equal(config.params.pageSize, 999);
    const pageNum = config.params.pageNum;
    const records =
      pageNum === 1
        ? Array.from({ length: 999 }, (_, index) => ({
            ...sample,
            systemName: `prefix_TARGET_${index}`,
            userRelation: false,
          }))
        : [{ ...sample, systemName: 'TARGET', userRelation: false }];
    return {
      data: { records, total: 1000, pageNum, pageSize: 999 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
  t.after(() => {
    httpClient.defaults.adapter = original;
  });
  assert.equal((await loadSystemAccess('TARGET')).systemName, 'TARGET');
  assert.deepEqual(
    requests.map((params) => params.pageNum),
    [1, 2],
  );
  httpClient.defaults.adapter = original;
  await assert.rejects(loadSystemAccess('cac'), (error) => error.status === 404);
  mockConfig.systemAccessError = 503;
  await assert.rejects(requireSystemAccess('CAC'), (error) => error.status === 503);
  mockConfig.systemAccessError = null;
  mockConfig.delayMs = 50;
  const controller = new AbortController();
  const pending = loadSystemAccess('CAC', controller.signal);
  controller.abort();
  await assert.rejects(pending, (error) => error.code === 'ERR_CANCELED');
});

test('鉴权按平台角色选择请求，普通用户命中成员列表只请求一次并共享目录', async (t) => {
  const requests = [];
  const original = httpClient.request.bind(httpClient);
  t.mock.method(httpClient, 'request', (config) => {
    requests.push({ url: config.url, keyword: config.params?.keyword });
    assert.ok(config.signal);
    return original(config);
  });
  const system = await requireSystemAccess('CAC');
  assert.deepEqual(requests, [{ url: '/api/systems/mine', keyword: undefined }]);
  assert.equal(system.systemName, 'CAC');
  assert.equal('role' in system, false);
  assert.equal('ystId' in system, false);
  const mine = await queryClient.query({ ...mySystemsOptions(), staleTime: Infinity });
  assert.ok(mine.some((item) => item.systemName === 'CAC' && item.role === 'R'));
  assert.equal(requests.length, 1);
  // 重新进入的显式鉴权仍读取最新关系，不能因为目录缓存已有数据就跳过。
  await requireSystemAccess('CAC');
  assert.equal(requests.length, 2);
  requests.length = 0;
  store.dispatch(setUserInfo(createDemoLoginUser('0')));
  assert.equal((await requireSystemAccess('demo_1')).systemName, 'demo_1');
  assert.deepEqual(requests, [{ url: '/api/systems/page', keyword: 'demo_1' }]);
});

test('普通用户未加入时才追加存在性查询，分别返回 403 和 404', async (t) => {
  const requests = [];
  const original = httpClient.request.bind(httpClient);
  t.mock.method(httpClient, 'request', (config) => {
    requests.push({ url: config.url, keyword: config.params?.keyword });
    return original(config);
  });
  for (const [name, status] of [
    ['demo_1', 403],
    ['NOT_EXISTING', 404],
  ]) {
    requests.length = 0;
    await assert.rejects(requireSystemAccess(name), (error) => error.status === status);
    assert.deepEqual(requests, [
      { url: '/api/systems/mine', keyword: undefined },
      { url: '/api/systems/page', keyword: name },
    ]);
  }
});

test('成员读取失败不使用旧缓存放行，存在性服务失败不误报无权限或不存在', async (t) => {
  await requireSystemAccess('CAC');
  mockConfig.systemAccessError = 503;
  await assert.rejects(requireSystemAccess('CAC'), (error) => error.status === 503);
  assert.ok(queryClient.getQueryData(mySystemsOptions().queryKey).length > 0);
  mockConfig.systemAccessError = null;
  const original = httpClient.defaults.adapter;
  httpClient.defaults.adapter = (config) => {
    if (config.url === '/api/systems/page') throw new Error('存在性服务网络失败');
    return original(config);
  };
  t.after(() => {
    httpClient.defaults.adapter = original;
  });
  await assert.rejects(requireSystemAccess('demo_1'), /存在性服务网络失败/);
});

test('共享成员查询取消会取消 HTTP，不能继续存在性查询或返回授权成功', async (t) => {
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const original = httpClient.request.bind(httpClient);
  const requests = [];
  let membershipSignal;
  t.mock.method(httpClient, 'request', (config) => {
    requests.push(config.url);
    const pending = original(config);
    if (config.url === '/api/systems/mine') {
      membershipSignal = config.signal;
      started();
    }
    return pending;
  });
  mockConfig.delayMs = 50;
  const pending = requireSystemAccess('demo_1');
  const rejected = assert.rejects(pending, (error) => error instanceof CancelledError);
  await ready;
  await queryClient.cancelQueries({ queryKey: mySystemsOptions().queryKey });
  await rejected;
  assert.equal(membershipSignal.aborted, true);
  assert.deepEqual(requests, ['/api/systems/mine']);
  assert.equal(queryClient.getQueryData(systemAccessOptions('demo_1').queryKey), undefined);
});

test('身份切换清理查询后，迟到的成员响应不会填充新用户目录或恢复旧授权', async (t) => {
  const firstUser = store.getState().user.userInfo;
  const otherUser = { ...firstUser, openId: 'another-login-user' };
  let release;
  let started;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const original = httpClient.defaults.adapter;
  t.after(() => {
    httpClient.defaults.adapter = original;
  });
  let hold = true;
  httpClient.defaults.adapter = async (config) => {
    if (hold && config.url === '/api/systems/mine') {
      hold = false;
      started();
      await gate;
    }
    return original(config);
  };
  const pending = requireSystemAccess('CAC');
  const rejected = assert.rejects(pending, (error) => error instanceof CancelledError);
  await ready;
  queryClient.clear();
  store.dispatch(setUserInfo(otherUser));
  release();
  await rejected;
  assert.equal(queryClient.getQueryData(mySystemsOptions(firstUser.openId).queryKey), undefined);
  assert.equal(queryClient.getQueryData(mySystemsOptions(otherUser.openId).queryKey), undefined);
  assert.equal(queryClient.getQueryData(systemAccessOptions('CAC', firstUser).queryKey), undefined);
  assert.equal((await requireSystemAccess('CAC')).systemName, 'CAC');
  assert.ok(queryClient.getQueryData(mySystemsOptions(otherUser.openId).queryKey).length > 0);
});
