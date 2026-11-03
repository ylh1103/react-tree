/** 登录流程回归：持久化、Redux 恢复、安全回跳及 middleware 对并行 loader 的前置拦截。 */
import assert from 'node:assert/strict';
import test, { beforeEach, afterEach } from 'node:test';
import { createMemoryRouter } from 'react-router';
import {
  loginMiddleware,
  restoreLoginMiddleware,
  loginPath,
  loginReturnTo,
  logoutUser,
} from '../src/router/login.ts';
import { createDemoLoginUser } from '../src/mocks/login.ts';
import { readLoginUser, writeLoginUser, loginStorageKey } from '../src/utils/loginStorage.ts';
import { store } from '../src/store/index.ts';
import { setUserInfo } from '../src/store/slices/userSlice.ts';
import { openUserSettings, closeUserSettings } from '../src/store/slices/preferencesSlice.ts';

let records;
function mockGlobal(t, key, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, key, original);
    else delete globalThis[key];
  });
}
beforeEach((t) => {
  records = new Map();
  mockGlobal(t, 'localStorage', {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
    removeItem: (key) => records.delete(key),
  });
});
afterEach(() => {
  store.dispatch(setUserInfo(null));
  store.dispatch(closeUserSettings());
});

function waitForIdle(router) {
  if (router.state.initialized && router.state.navigation.state === 'idle')
    return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (state.initialized && state.navigation.state === 'idle') {
        unsubscribe();
        resolve();
      }
    });
  });
}

/** 与正式路由保持相同边界：根恢复身份，公开页独立于受保护分组。 */
function createLoginRouter(protectedRoutes, options, publicRoutes = []) {
  return createMemoryRouter(
    [
      {
        middleware: [restoreLoginMiddleware],
        children: [
          { path: '/login' },
          ...publicRoutes,
          { middleware: [loginMiddleware], children: protectedRoutes },
        ],
      },
    ],
    { ...options, future: { v8_middleware: true } },
  );
}

test('两个平台角色均保存完整资料，网络和员工类型保持独立', () => {
  for (const role of ['0', '1']) {
    const user = createDemoLoginUser(role);
    writeLoginUser(user);
    assert.deepEqual(readLoginUser(), user);
    assert.equal(user.userType, role);
    assert.equal(user.netEnv, '0');
    assert.equal(user.cmbUserType, '2');
    for (const netEnv of ['0', '1', '2']) {
      const profile = { ...user, netEnv, cmbUserType: 'other' };
      writeLoginUser(profile);
      assert.deepEqual(readLoginUser(), profile);
    }
  }
});

test('登录选择的角色与三种网络独立组合，保存及恢复 Redux 后仍保留所选网络', () => {
  for (const role of ['0', '1']) {
    for (const netEnv of ['0', '1', '2']) {
      const user = createDemoLoginUser(role, netEnv);
      writeLoginUser(user);
      store.dispatch(setUserInfo(readLoginUser()));
      assert.equal(user.userType, role);
      assert.equal(user.netEnv, netEnv);
      assert.equal(user.cmbUserType, '2');
      assert.deepEqual(readLoginUser(), user);
      assert.deepEqual(store.getState().user.userInfo, user);
    }
  }
});

test('退出清除登录资料并关闭配置，整页回到保留来源地址的登录页，其他存储保持不变', (t) => {
  const user = createDemoLoginUser('0');
  writeLoginUser(user);
  records.set('display-preferences', 'keep');
  store.dispatch(setUserInfo(user));
  store.dispatch(openUserSettings());
  const target = '/systems/CAC/application/demo?tab=config#editor';
  let destination;
  mockGlobal(t, 'window', {
    location: {
      replace: (path) => {
        assert.equal(readLoginUser(), null);
        assert.equal(store.getState().user.userInfo, null);
        assert.equal(store.getState().preferences.settingsOpen, false);
        destination = path;
      },
    },
  });
  logoutUser(target);
  assert.equal(destination, loginPath(target));
  assert.equal(records.has(loginStorageKey), false);
  assert.equal(records.get('display-preferences'), 'keep');
});

test('退出时存储移除失败不伪造成功，不清空 Redux 或跳转', (t) => {
  const user = createDemoLoginUser('1');
  writeLoginUser(user);
  store.dispatch(setUserInfo(user));
  t.mock.method(localStorage, 'removeItem', () => {
    throw new Error('blocked');
  });
  mockGlobal(t, 'window', { location: { replace: () => assert.fail('移除失败不得跳转') } });
  assert.throws(() => logoutUser('/systems/CAC'), /blocked/);
  assert.deepEqual(readLoginUser(), user);
  assert.deepEqual(store.getState().user.userInfo, user);
});

test('缺失、损坏、无登录标志、无用户资料及未知版本均视为未登录', () => {
  const user = createDemoLoginUser('1');
  for (const raw of [
    null,
    '{',
    'null',
    'true',
    JSON.stringify({ version: 1, loggedIn: true }),
    JSON.stringify({ version: 1, loggedIn: false, user }),
    JSON.stringify({ version: 2, loggedIn: true, user }),
  ]) {
    records.set(loginStorageKey, raw);
    assert.equal(readLoginUser(), null);
    assert.equal(records.get(loginStorageKey), raw);
  }
});

test('登录资料原样保存和恢复，不校验字段完整性、类型或枚举值', () => {
  for (const user of [
    {},
    { userName: '', openId: '', ystId: '' },
    { ...createDemoLoginUser('1'), userType: '2', netEnv: '3', employeeId: 123 },
  ]) {
    writeLoginUser(user);
    assert.deepEqual(readLoginUser(), user);
    assert.deepEqual(JSON.parse(records.get(loginStorageKey)).user, user);
  }
});

test('存储不可用时读取按未登录处理，写入失败传播给登录页', (t) => {
  mockGlobal(t, 'localStorage', {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });
  assert.equal(readLoginUser(), null);
  assert.throws(() => writeLoginUser(createDemoLoginUser('1')), /blocked/);
});

test('安全回跳保留路径、查询和锚点，阻止站外目标及登录循环', () => {
  const target = '/systems/CAC/application/app?tab=one%20two#editor';
  assert.equal(loginReturnTo(target), target);
  assert.equal(
    new URL(loginPath(target), 'https://local.invalid').searchParams.get('redirect'),
    target,
  );
  for (const target of [
    null,
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/login',
    '/LOGIN/',
    '/%6cogin?redirect=/login',
    '/a/../login',
    '/\n/evil.example',
  ]) {
    assert.equal(loginReturnTo(target), '/');
  }
});

test('已登录仍可直达和导航到登录页，保留身份与回跳参数', async (t) => {
  const user = createDemoLoginUser('0');
  writeLoginUser(user);
  const destination = loginPath('/systems/CAC/application/demo?view=config');
  const router = createLoginRouter([{ path: '/' }], { initialEntries: [destination] });
  t.after(() => router.dispose());
  await waitForIdle(router);
  assert.equal(router.state.location.pathname + router.state.location.search, destination);
  assert.deepEqual(store.getState().user.userInfo, user);
  assert.deepEqual(readLoginUser(), user);

  await router.navigate('/');
  await router.navigate('/login');
  assert.equal(router.state.location.pathname, '/login');
  assert.equal(router.state.location.search, '');
  assert.deepEqual(store.getState().user.userInfo, user);
});

test('公开小工具和产品介绍无需登录，公开 loader 也能读取最新身份', async (t) => {
  const users = [];
  const publicRoutes = [
    { path: '/tools' },
    {
      path: '/product',
      loader: () => {
        users.push(store.getState().user.userInfo);
        return null;
      },
    },
  ];
  // 旧内存身份不能让匿名访问公开页时继续展示上一用户。
  store.dispatch(setUserInfo(createDemoLoginUser('0')));
  const router = createLoginRouter([{ path: '/' }], { initialEntries: ['/tools'] }, publicRoutes);
  t.after(() => router.dispose());
  await waitForIdle(router);
  assert.equal(router.state.location.pathname, '/tools');
  assert.equal(store.getState().user.userInfo, null);

  await router.navigate('/product');
  assert.equal(router.state.location.pathname, '/product');
  assert.deepEqual(users, [null]);

  const user = createDemoLoginUser('1');
  writeLoginUser(user);
  await router.navigate('/tools');
  assert.deepEqual(store.getState().user.userInfo, user);
  await router.navigate('/product');
  assert.deepEqual(users, [null, user]);

  records.clear();
  await router.navigate('/');
  assert.equal(router.state.location.pathname, '/login');
  assert.equal(new URLSearchParams(router.state.location.search).get('redirect'), '/');
});

test('未登录直达深层页面时父子 loader 均不执行，登录提交导航后恢复 Redux 并回跳', async (t) => {
  const calls = [];
  const target = '/systems/CAC/application/demo?view=config';
  const router = createLoginRouter(
    [
      {
        path: '/systems/:systemName',
        loader: () => {
          calls.push('parent');
          return null;
        },
        children: [
          {
            path: 'application/:appName',
            loader: () => {
              calls.push('child');
              return null;
            },
          },
        ],
      },
    ],
    { initialEntries: [target] },
  );
  t.after(() => router.dispose());
  await waitForIdle(router);
  assert.equal(router.state.location.pathname, '/login');
  assert.equal(new URLSearchParams(router.state.location.search).get('redirect'), target);
  assert.deepEqual(calls, []);
  assert.equal(store.getState().user.userInfo, null);
  const user = createDemoLoginUser('1');
  writeLoginUser(user);
  // 模拟登录页提交成功后，消费 redirect 并显式导航到原目标。
  await router.navigate(
    loginReturnTo(new URLSearchParams(router.state.location.search).get('redirect')),
    {
      replace: true,
    },
  );
  assert.equal(router.state.location.pathname, '/systems/CAC/application/demo');
  assert.equal(router.state.location.search, '?view=config');
  assert.deepEqual(store.getState().user.userInfo, user);
  assert.deepEqual(calls.sort(), ['child', 'parent']);
});

test('已挂载后本地凭据被移除，无 loader 的页面切换也会被拦截', async (t) => {
  writeLoginUser(createDemoLoginUser('0'));
  const router = createLoginRouter([{ path: '/' }, { path: '/other' }]);
  t.after(() => router.dispose());
  await waitForIdle(router);
  assert.equal(store.getState().user.userInfo.userType, '0');
  records.clear();
  await router.navigate('/other');
  assert.equal(router.state.location.pathname, '/login');
  assert.equal(new URLSearchParams(router.state.location.search).get('redirect'), '/other');
  assert.equal(store.getState().user.userInfo, null);
});

test('首次直达时 Router 移除的锚点由相同浏览器地址补齐', (t) => {
  mockGlobal(t, 'window', {
    location: { pathname: '/systems/CAC', search: '?a=1', hash: '#detail' },
  });
  assert.throws(
    () => loginMiddleware({ request: new Request('https://local.invalid/systems/CAC?a=1') }),
    (response) => {
      assert.equal(
        new URL(response.headers.get('Location'), 'https://local.invalid').searchParams.get(
          'redirect',
        ),
        '/systems/CAC?a=1#detail',
      );
      return true;
    },
  );
});

test('重复导航仍检查登录记录，资料相同时不 dispatch 且保留用户引用', async (t) => {
  writeLoginUser(createDemoLoginUser('1'));
  const router = createLoginRouter([{ path: '/one' }, { path: '/two' }], {
    initialEntries: ['/one'],
  });
  t.after(() => router.dispose());
  await waitForIdle(router);
  const previousState = store.getState();
  const previousUser = previousState.user.userInfo;
  let notifications = 0;
  const unsubscribe = store.subscribe(() => notifications++);
  t.after(unsubscribe);
  const read = t.mock.method(localStorage, 'getItem');
  await router.navigate('/two');
  await router.navigate('/one');
  assert.equal(read.mock.callCount(), 2);
  assert.equal(notifications, 0);
  assert.equal(store.getState(), previousState);
  assert.equal(store.getState().user.userInfo, previousUser);
  // 本地记录失效必须仍被下一次导航发现，不能把“减少写入”变成跳过登录检查。
  records.delete(loginStorageKey);
  await router.navigate('/two');
  assert.equal(store.getState().user.userInfo, null);
  assert.equal(router.state.location.pathname, '/login');
  assert.equal(notifications, 1);
});

test('同一用户任一资料字段变化都能同步，不仅比较用户编号或角色', () => {
  const original = createDemoLoginUser('1');
  writeLoginUser(original);
  restoreLoginMiddleware();
  for (const [field, value] of Object.entries(original)) {
    const nextValue = field === 'userType' ? '0' : field === 'netEnv' ? '2' : `${value}-changed`;
    writeLoginUser({ ...original, [field]: nextValue });
    const before = store.getState().user.userInfo;
    restoreLoginMiddleware();
    assert.notEqual(store.getState().user.userInfo, before);
    assert.equal(store.getState().user.userInfo[field], nextValue);
    const restored = store.getState().user.userInfo;
    restoreLoginMiddleware();
    assert.equal(store.getState().user.userInfo, restored);
  }
});
