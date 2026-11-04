/** 系统授权边界回归：真实 Router 导航验证请求次数、身份变化、失效、POP、取消及焦点复查。 */
import assert from 'node:assert/strict';
import test, { beforeEach, afterEach } from 'node:test';
import { redirect } from 'react-router';
import { QueryObserver, focusManager } from '@tanstack/react-query';
import { createSystemTestRouter, waitForRouter } from './helpers/systemRouter.mjs';
import { httpClient } from '../src/http/request.ts';
import { mockConfig } from '../src/mocks/config.ts';
import { store } from '../src/store/index.ts';
import { setUserInfo } from '../src/store/slices/userSlice.ts';
import { createDemoLoginUser } from '../src/mocks/login.ts';
import { queryClient } from '../src/queries/client.ts';
import { systemAccessOptions } from '../src/queries/systems.ts';
import { preloadSystems } from '../src/router/loaders.ts';

beforeEach(() => {
  mockConfig.delayMs = 0;
  store.dispatch(setUserInfo(createDemoLoginUser('1')));
});
afterEach(() => {
  queryClient.clear();
  mockConfig.systemAccessError = null;
  mockConfig.delayMs = 0;
  focusManager.setFocused(undefined);
});

function fixture(t, options = {}) {
  const requests = [];
  const loaders = [];
  const original = httpClient.request.bind(httpClient);
  t.mock.method(httpClient, 'request', (config) => {
    requests.push({ url: config.url, params: config.params });
    return original(config);
  });
  const loader = ({ request }) => {
    loaders.push(request.url);
    return null;
  };
  const router = createSystemTestRouter(
    [
      {
        path: 'application/:appName/:envTag?',
        loader,
        children: [
          { path: 'create/:version?', loader },
          { path: 'publish/:version?', loader },
          { path: 'inspect', loader },
        ],
      },
      { path: 'db/:paramTypeName?', loader },
      { path: 'redirect', loader: () => redirect('/systems/CACTEST1/application/redirected') },
    ],
    { loader: preloadSystems, ...options },
  );
  t.after(() => router.dispose());
  const accessRequests = () => requests.filter((item) => item.url === '/api/systems/page');
  return { router, requests, loaders, accessRequests };
}

test('首次直达和重新初始化 Router 均校验，不因已有成功缓存跳过', async (t) => {
  const initialEntries = ['/systems/CAC/application/one/dev'];
  const first = fixture(t, { initialEntries });
  await waitForRouter(first.router);
  assert.equal(first.router.state.errors, null);
  assert.equal(first.accessRequests().length, 1);
  first.router.dispose();
  const second = fixture(t, { initialEntries });
  await waitForRouter(second.router);
  assert.equal(second.router.state.errors, null);
  assert.equal(second.accessRequests().length, 1);
});

test('同系统应用、环境、创建、发布、检查、数据库及查询参数导航不重复授权或目录请求', async (t) => {
  const { router, requests, accessRequests } = fixture(t);
  await router.navigate('/systems/CAC/application/one/dev');
  assert.equal(router.state.errors, null);
  assert.equal(accessRequests().length, 1);
  const directoryCount = requests.filter((item) => item.url === '/api/systems/mine').length;
  for (const path of [
    '/systems/CAC/application/two/dev',
    '/systems/CAC/application/two/prd',
    '/systems/CAC/application/two/prd/create/v1',
    '/systems/CAC/application/two/prd/publish/v1',
    '/systems/CAC/application/two/prd/inspect',
    '/systems/CAC/db/types',
    '/systems/CAC/application/two/dev?tab=config',
  ]) {
    await router.navigate(path);
    assert.equal(router.state.errors, null);
  }
  await router.navigate(-1);
  await router.navigate(1);
  assert.equal(accessRequests().length, 1);
  assert.equal(requests.filter((item) => item.url === '/api/systems/mine').length, directoryCount);
});

test('跨系统、返回历史系统和离开后重进都重新校验', async (t) => {
  const { router, accessRequests } = fixture(t);
  await router.navigate('/systems/CAC/application/one');
  await router.navigate('/systems/CACTEST1/application/two');
  await router.navigate(-1);
  await router.navigate('/outside');
  await router.navigate('/systems/CAC/application/three');
  assert.equal(router.state.errors, null);
  assert.deepEqual(
    accessRequests().map((item) => item.url),
    Array(4).fill('/api/systems/page'),
  );
});

test('显式失效后重查，最新 403 即使保留旧数据也阻止所有业务 loader', async (t) => {
  const { router, loaders, accessRequests } = fixture(t);
  await router.navigate('/systems/CAC/application/one');
  const key = systemAccessOptions('CAC').queryKey;
  await queryClient.invalidateQueries({ queryKey: key, refetchType: 'none' });
  await router.navigate('/systems/CAC/application/two');
  assert.equal(accessRequests().length, 2);
  mockConfig.systemAccessError = 403;
  await queryClient.invalidateQueries({ queryKey: key, refetchType: 'none' });
  const count = loaders.length;
  await router.navigate('/systems/CAC/application/three');
  assert.equal(Object.values(router.state.errors)[0].status, 403);
  assert.equal(loaders.length, count);
  assert.ok(queryClient.getQueryData(key));
  assert.equal(queryClient.getQueryState(key).error.status, 403);
  // 再次导航不能只凭旧 data 放行。
  await router.navigate('/systems/CAC/application/four');
  assert.equal(Object.values(router.state.errors)[0].status, 403);
  assert.equal(loaders.length, count);
});

test('身份在根 middleware 恢复时变化，即使对应身份曾有成功缓存也重新校验', async (t) => {
  let nextUser;
  const { router, accessRequests } = fixture(t, {
    middleware: [
      () => {
        if (nextUser) {
          store.dispatch(setUserInfo(nextUser));
          nextUser = null;
        }
      },
    ],
  });
  const oldUser = createDemoLoginUser('1');
  await router.navigate('/systems/CAC/application/one');
  // 预置另一个身份的旧成功结果，验证不能仅按“该键有数据”放行。
  const otherUser = { ...oldUser, openId: 'another-user' };
  queryClient.setQueryData(systemAccessOptions('CAC', otherUser).queryKey, { systemName: 'CAC' });
  nextUser = otherUser;
  await router.navigate('/systems/CAC/application/two');
  assert.equal(accessRequests().length, 2);
  nextUser = { ...otherUser, userType: '0' };
  await router.navigate('/systems/CAC/application/three');
  assert.equal(accessRequests().length, 3);
  assert.equal(router.state.errors, null);
});

test('重定向以已提交来源判断，跨系统目标必须独立校验', async (t) => {
  const { router, accessRequests } = fixture(t);
  await router.navigate('/systems/CAC/application/one');
  await router.navigate('/systems/CAC/redirect');
  assert.equal(router.state.location.pathname, '/systems/CACTEST1/application/redirected');
  assert.deepEqual(
    accessRequests().map((item) => item.url),
    ['/api/systems/page', '/api/systems/page'],
  );
});

test('取消的跨系统授权即使迟到成功，也不运行业务 loader 或成为下一次导航来源', async (t) => {
  const { router, accessRequests, loaders } = fixture(t);
  await router.navigate('/systems/CAC/application/one');
  let release;
  let started;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const original = httpClient.request.bind(httpClient);
  let hold = true;
  t.mock.method(httpClient, 'request', async (config) => {
    if (hold && config.url === '/api/systems/page' && config.params.keyword === 'CACTEST1') {
      hold = false;
      started();
      await gate;
    }
    return original(config);
  });
  const cancelled = router.navigate('/systems/CACTEST1/application/cancelled');
  await ready;
  await router.navigate('/outside');
  release();
  await cancelled;
  // 等待共享 Query 结束，确保后续重进遇到的是迟到成功缓存。
  await queryClient.query({ ...systemAccessOptions('CACTEST1'), staleTime: Infinity });
  assert.equal(router.state.location.pathname, '/outside');
  assert.equal(
    loaders.some((url) => url.includes('/cancelled')),
    false,
  );
  await router.navigate('/systems/CACTEST1/application/confirmed');
  assert.equal(router.state.errors, null);
  assert.equal(accessRequests().filter((item) => item.url === '/api/systems/page').length, 3);
});

test('布局订阅不在挂载时重复授权，窗口恢复焦点仍强制复查并暴露 403', async (t) => {
  const { router, accessRequests } = fixture(t);
  await router.navigate('/systems/CAC/application/one');
  const observer = new QueryObserver(queryClient, systemAccessOptions('CAC'));
  queryClient.mount();
  t.after(() => {
    observer.destroy();
    queryClient.unmount();
  });
  const denied = new Promise((resolve) => {
    observer.subscribe((result) => {
      if (result.error?.status === 403) resolve();
    });
  });
  assert.equal(accessRequests().length, 1);
  mockConfig.systemAccessError = 403;
  focusManager.setFocused(false);
  focusManager.setFocused(true);
  await denied;
  assert.equal(accessRequests().length, 2);
  assert.equal(observer.getCurrentResult().error.status, 403);
});

test('无 loader 的系统子页面也受 middleware 保护，失败后可恢复但不能跳过访问校验', async (t) => {
  const router = createSystemTestRouter([{ path: 'plain' }]);
  t.after(() => router.dispose());
  await router.navigate('/systems/demo_1/plain');
  assert.equal(Object.values(router.state.errors)[0].status, 403);
  store.dispatch(setUserInfo(createDemoLoginUser('0')));
  await router.navigate('/systems/demo_1/plain');
  assert.equal(router.state.errors, null);
  assert.equal(
    queryClient.getQueryData(systemAccessOptions('demo_1').queryKey).systemName,
    'demo_1',
  );
  await router.navigate('/systems/not-existing/plain');
  assert.equal(Object.values(router.state.errors)[0].status, 404);
});

test('同一次表单导航的 action 和 loader 阶段共用授权，action 主动失效后才重新检查', async (t) => {
  const requests = [];
  const original = httpClient.request.bind(httpClient);
  t.mock.method(httpClient, 'request', (config) => {
    requests.push(config.url);
    return original(config);
  });
  let invalidate = false;
  let actions = 0;
  let loads = 0;
  const router = createSystemTestRouter([
    {
      path: 'submit',
      action: async () => {
        actions++;
        if (invalidate)
          await queryClient.invalidateQueries({
            queryKey: systemAccessOptions('CAC').queryKey,
            refetchType: 'none',
          });
        return null;
      },
      loader: () => {
        loads++;
        return null;
      },
    },
  ]);
  t.after(() => router.dispose());
  await router.navigate('/systems/CAC/submit', { formMethod: 'post', body: new URLSearchParams() });
  assert.equal(router.state.errors, null);
  assert.equal(actions, 1);
  assert.equal(loads, 1);
  assert.equal(requests.filter((url) => url === '/api/systems/page').length, 1);
  invalidate = true;
  await router.navigate('/systems/CAC/submit', { formMethod: 'post', body: new URLSearchParams() });
  assert.equal(router.state.errors, null);
  assert.equal(actions, 2);
  assert.equal(loads, 2);
  assert.equal(requests.filter((url) => url === '/api/systems/page').length, 2);
});

test('我的系统入口仅查询一次所有系统鉴权，切换器复用既有目录不再请求', async (t) => {
  const { mySystemsOptions } = await import('../src/queries/systems.ts');
  const { router, requests } = fixture(t);
  // 首页已展示我的系统；鉴权只查询所有系统，目录继续独立复用。
  await queryClient.query(mySystemsOptions());
  assert.equal(requests.length, 1);
  await router.navigate('/systems/CAC/application/one');
  assert.equal(router.state.errors, null);
  assert.deepEqual(
    requests.map((item) => item.url),
    ['/api/systems/mine', '/api/systems/page'],
  );
  const observer = new QueryObserver(queryClient, { ...mySystemsOptions(), refetchOnMount: false });
  const unsubscribe = observer.subscribe(() => {});
  t.after(() => {
    unsubscribe();
    observer.destroy();
  });
  assert.ok(observer.getCurrentResult().data.some((item) => item.systemName === 'CAC'));
  assert.equal(requests.length, 2);
});
