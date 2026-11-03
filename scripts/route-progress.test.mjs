import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryRouter, redirect } from 'react-router';
import { startRouteProgress } from '../src/router/progress.ts';

/** 使用真实 Router 的等待阶段验证订阅生命周期，驱动替身避免依赖浏览器 DOM。 */
function fixture() {
  const calls = [];
  let options;
  const progress = {
    configure: (value) => {
      options = value;
    },
    start: () => calls.push('start'),
    done: () => calls.push('done'),
    remove: () => calls.push('remove'),
  };
  let resolve;
  const waiting = new Promise((done) => {
    resolve = done;
  });
  return { calls, progress, waiting, resolve, options: () => options };
}

test('首次 Router 初始化由启动画面负责，不重复显示导航进度', async (t) => {
  const f = fixture();
  const router = createMemoryRouter([{ path: '/', loader: () => f.waiting }]);
  t.after(() => router.dispose());
  const initialized = new Promise((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (state.initialized) {
        unsubscribe();
        resolve();
      }
    });
  });
  const stop = startRouteProgress(router, f.progress);
  t.after(stop);
  assert.deepEqual(f.calls, []);
  f.resolve(null);
  await initialized;
  assert.deepEqual(f.calls, []);
  assert.equal(f.options().showSpinner, false);
  assert.match(f.options().template, /role="bar"/);
  assert.match(f.options().template, /bg-accent/);
});

test('异步接入时补齐正在进行的导航，清理后不再接收通知', async (t) => {
  const f = fixture();
  const router = createMemoryRouter([{ path: '/' }, { path: '/slow', loader: () => f.waiting }]);
  t.after(() => router.dispose());
  const navigation = router.navigate('/slow');
  const stop = startRouteProgress(router, f.progress);
  assert.deepEqual(f.calls, ['start']);
  stop();
  assert.deepEqual(f.calls, ['start', 'done', 'remove']);
  f.resolve(null);
  await navigation;
  assert.deepEqual(f.calls, ['start', 'done', 'remove']);
});

test('表单提交及其重定向共用一次进度，不在提交与加载之间提前结束', async (t) => {
  const action = fixture();
  const data = fixture();
  let loaderStarted;
  const started = new Promise((resolve) => {
    loaderStarted = resolve;
  });
  const router = createMemoryRouter([
    { path: '/' },
    {
      path: '/submit',
      action: async () => {
        await action.waiting;
        return redirect('/result');
      },
    },
    {
      path: '/result',
      loader: () => {
        loaderStarted();
        return data.waiting;
      },
    },
  ]);
  t.after(() => router.dispose());
  const stop = startRouteProgress(router, data.progress);
  t.after(stop);
  const navigation = router.navigate('/submit', {
    formMethod: 'post',
    body: new URLSearchParams(),
  });
  assert.equal(router.state.navigation.state, 'submitting');
  assert.deepEqual(data.calls, ['start']);
  action.resolve();
  await started;
  assert.equal(router.state.navigation.state, 'loading');
  assert.deepEqual(data.calls, ['start']);
  data.resolve(null);
  await navigation;
  assert.equal(router.state.location.pathname, '/result');
  assert.deepEqual(data.calls, ['start', 'done']);
});
