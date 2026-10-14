/** 平台核心流程回归：断言请求顺序与授权结果，不镜像组件实现。 */
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { mockConfig } from '../src/mocks/config.ts';
import { writeMock, readMock } from '../src/mocks/storage.ts';
import { currentMockUser } from '../src/mocks/session.ts';
import { loadSystems, loadAllSystems, loadSystemAccess, createSystem } from '../src/api/systems.ts';
import { loadSystemParameters } from '../src/api/parameters.ts';
import { createSystemApplicationApi } from '../src/api/applications.ts';
import { httpClient, requestData } from '../src/http/request.ts';
import {
  requireSession,
  invalidateSession,
  retrySession,
  startAccessFailureHandling,
} from '../src/store/session.ts';
import { store, createAppStore } from '../src/store/index.ts';
import { queryClient } from '../src/queries/client.ts';
import { requireSystemAccess, systemAccessOptions } from '../src/queries/systems.ts';
import { preloadApplications, preloadDatabase } from '../src/router/loaders.ts';
import {
  saveUserSettings,
  initializePreferences,
  cancelPreferencesRequests,
  resetPreferences,
} from '../src/store/slices/preferencesSlice.ts';
import { initializeSession, expireSession } from '../src/store/slices/sessionSlice.ts';
import { defaultUserSettings } from '../src/types/preferences.ts';

mockConfig.delayMs = 0;
afterEach(() => {
  mockConfig.scenario = 'platform';
  invalidateSession();
});

test('平台与普通成员的入口权限，未加入和不存在分别返回 403/404', async () => {
  mockConfig.scenario = 'platform';
  assert.equal((await loadSystemAccess('ParamPlat')).role, null);
  assert.equal(
    (await loadAllSystems()).find((item) => item.systemName === 'ParamPlat').userRelation,
    false,
  );
  mockConfig.scenario = 'member';
  const mine = await loadSystems();
  assert.deepEqual(new Set(mine.map((item) => item.role)), new Set(['D', 'R', 'V']));
  for (const system of mine)
    assert.equal((await loadSystemAccess(system.systemName)).role, system.role);
  await assert.rejects(loadSystemAccess('ParamPlat'), (error) => error.status === 403);
  await assert.rejects(loadSystemParameters('ParamPlat'), (error) => error.status === 403);
  await assert.rejects(loadSystemAccess('不存在'), (error) => error.status === 404);
});

test('新用户可创建系统并成为 R；统计为空且重复校验不依赖按钮', async () => {
  mockConfig.scenario = 'new-user';
  assert.equal((await loadSystems()).length, 0);
  const name = `TEST_${Date.now()}`;
  const system = await createSystem({
    systemName: ` ${name} `,
    systemChineseName: '新系统',
    systemArchNo: ` ${name}.ARCH `,
  });
  assert.equal(system.role, 'R');
  assert.equal(system.systemCharges, '新用户/new-user');
  assert.equal(
    (await loadSystems()).some((item) => item.systemName === name),
    true,
  );
  assert.equal(
    (await loadAllSystems()).find((item) => item.systemName === name).userRelation,
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

test('外包员工不附加创建限制，统计与实际列表相符', async () => {
  mockConfig.scenario = 'contractor';
  assert.equal((await loadSystemAccess('CAC')).role, 'V');
  const system = await loadSystemAccess('CAC');
  assert.equal((await createSystemApplicationApi('CAC').getItems()).length, system.appCount);
  assert.equal((await loadSystemParameters('CAC')).length, system.paramTypeCount);
  assert.equal(
    (
      await createSystem({
        systemName: `EXTERNAL_${Date.now()}`,
        systemChineseName: '外包创建',
        systemArchNo: `EXTERNAL.${Date.now()}`,
      })
    ).role,
    'R',
  );
});

test('父子 loader 共用授权请求，非成员授权失败前没有业务请求', async (t) => {
  mockConfig.scenario = 'member';
  await retrySession();
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
  requests.length = 0;
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

test('权限撤销后立即发布拒绝结果并移除系统业务缓存', async (t) => {
  mockConfig.scenario = 'member';
  await retrySession();
  t.after(startAccessFailureHandling());
  await requireSystemAccess('CAC');
  const key = ['grouped-list', '310798', 'applications:CAC'];
  queryClient.setQueryData(key, ['旧数据']);
  const relations = readMock('members', {
    310798: { CAC: 'D', CCCMonitor: 'R', LT11_01: 'V' },
    IT009682: { CAC: 'V' },
  });
  t.after(() => writeMock('members', relations));
  writeMock('members', { ...relations, 310798: {} });
  await assert.rejects(requireSystemAccess('CAC'), (error) => error.status === 403);
  assert.equal(queryClient.getQueryData(key), undefined);
  assert.deepEqual(queryClient.getQueryData(systemAccessOptions('CAC').queryKey), { denied: true });
});

test('身份变化清缓存，失效会话拒绝获取用户，取消 Mock 读写不产生副作用', async () => {
  await retrySession();
  queryClient.setQueryData(['private'], ['旧数据']);
  invalidateSession();
  assert.equal(queryClient.getQueryData(['private']), undefined);
  await assert.rejects(requireSession(), (error) => error.status === 401);
  mockConfig.scenario = 'expired';
  await assert.rejects(requestData({ url: '/api/session' }), (error) => error.status === 401);
  mockConfig.scenario = 'platform';
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    requestData({ url: '/api/systems', signal: controller.signal }),
    (error) => error.code === 'ERR_CANCELED',
  );
});

test('登录一次初始化设置，保存后会话保留编辑器 theme 和未知字段', async () => {
  writeMock(
    'settings:310798',
    JSON.stringify({ theme: 'vs-dark', defaultCheckAllEnvTag: false, future: { value: 3 } }),
  );
  await retrySession();
  assert.equal(store.getState().preferences.themeMode, 'system');
  await store.dispatch(saveUserSettings({ themeMode: 'dark' })).unwrap();
  const document = JSON.parse(store.getState().session.user.userSetting);
  assert.equal(document.theme, 'vs-dark');
  assert.equal(document.themeMode, 'dark');
  assert.deepEqual(document.future, { value: 3 });
  writeMock('settings:310798', '{');
  await retrySession();
  assert.equal(store.getState().preferences.status, 'load-error');
  const ignored = await store.dispatch(saveUserSettings({ themeMode: 'light' }));
  assert.equal(ignored.meta.condition, true);
  assert.equal(readMock('settings:310798', ''), '{');
  writeMock('settings:310798', '{}');
});

test('旧用户在途保存取消后不会恢复偏好或启动队列下一次写入', async () => {
  let release;
  let signal;
  let writes = 0;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const local = createAppStore({
    load: async () => defaultUserSettings,
    save: async (settings, requestSignal) => {
      writes++;
      signal = requestSignal;
      await pending;
      return settings;
    },
  });
  local.dispatch(initializeSession.pending('test', undefined));
  local.dispatch(initializeSession.fulfilled(currentMockUser(), 'test', undefined));
  local.dispatch(initializePreferences(defaultUserSettings));
  const first = local.dispatch(saveUserSettings({ themeMode: 'dark' }));
  const next = local.dispatch(saveUserSettings({ layoutMode: 'compact' }));
  cancelPreferencesRequests(local.getState);
  local.dispatch(expireSession());
  local.dispatch(resetPreferences());
  assert.equal(signal.aborted, true);
  // 同一个用户立即重新登录也不能复活旧队列，身份编号不足以区分会话。
  local.dispatch(initializeSession.pending('new-session', undefined));
  local.dispatch(initializeSession.fulfilled(currentMockUser(), 'new-session', undefined));
  local.dispatch(initializePreferences(defaultUserSettings));
  release();
  await Promise.all([first, next]);
  assert.equal(writes, 1);
  assert.equal(local.getState().preferences.initialized, true);
  assert.equal(local.getState().preferences.status, 'ready');
  assert.equal(local.getState().preferences.themeMode, 'system');
});

test('模拟请求支持超时和延迟中取消，取消的创建不产生成员关系', async () => {
  mockConfig.delayMs = 50;
  try {
    await assert.rejects(requestData({ url: '/api/session', timeout: 5 }), /请求超时/);
    const name = `CANCELLED_${Date.now()}`;
    const writing = requestData({
      url: '/api/systems',
      method: 'POST',
      data: { systemName: name, systemChineseName: '取消创建', systemArchNo: name },
    });
    invalidateSession();
    await assert.rejects(writing, (error) => error.code === 'ERR_CANCELED');
    assert.equal(
      (await loadAllSystems()).some((item) => item.systemName === name),
      false,
    );
  } finally {
    mockConfig.delayMs = 0;
  }
});
