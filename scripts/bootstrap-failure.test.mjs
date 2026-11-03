/** 启动异常回归：直接执行实际内联函数，验证交接前捕获、资源筛选、刷新操作及交接后清理。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { formatFailureDetails } from '../src/utils/failureDetails.ts';
import { startBootstrapFailure } from '../src/utils/bootstrapFailure.ts';
import { isResourceError } from '../src/components/ComponentFailure/resourceError.ts';
import { parseStackTrace } from '../src/components/FailureDetails/parseStackTrace.ts';
import { getDiagnosticPreview } from '../src/components/FailureDetails/preview.ts';

/** 最小 DOM 替身保留文本、属性和子节点，验证内联控制器不通过 HTML 注入错误内容。 */
class Element {
  children = [];
  dataset = {};
  attributes = {};
  hidden = false;
  text = '';
  constructor(tagName = 'div') {
    this.tagName = tagName;
  }
  set textContent(value) {
    this.text = value;
    this.children = [];
  }
  get textContent() {
    return this.text + this.children.map((node) => node.textContent).join('');
  }
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren(...children) {
    this.text = '';
    this.children = children;
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

function setup({ clipboard = async () => {}, parse = parseStackTrace } = {}) {
  const window = new EventTarget();
  const nodes = new Map(
    [
      'failure-details',
      'summary',
      'toggle',
      'diagnostic',
      'raw',
      'more',
      'copy',
      'copy-label',
      'copy-status',
    ].map((id) => [`bootstrap-${id}`, new Element()]),
  );
  const document = Object.assign(new EventTarget(), {
    documentElement: { dataset: {} },
    getElementById: (id) => nodes.get(id),
    createElement: (tag) => new Element(tag),
  });
  let reloads = 0;
  window.location = { reload: () => reloads++ };
  class ErrorEvent extends Event {
    constructor(message) {
      super('error');
      this.message = message;
    }
  }
  // 与构建插件一致，序列化后在独立作用域运行，防止代码意外依赖模块闭包。
  runInNewContext(
    `(${startBootstrapFailure.toString()})(${formatFailureDetails.toString()},${parse.toString()},${getDiagnosticPreview.toString()})`,
    {
      window,
      document,
      ErrorEvent,
      navigator: { clipboard: { writeText: clipboard } },
      setTimeout,
      clearTimeout,
    },
  );
  const click = (id) => {
    const event = new Event('click');
    Object.defineProperty(event, 'target', {
      value: { closest: (selector) => selector === `#bootstrap-${id}` },
    });
    document.dispatchEvent(event);
  };
  return { window, document, ErrorEvent, reloads: () => reloads, nodes, click };
}

function resourceError(window, tagName, type = null) {
  const event = new Event('error');
  Object.defineProperty(event, 'target', {
    value: { tagName, src: 'https://example.test/assets/main.js', getAttribute: () => type },
  });
  window.dispatchEvent(event);
}

test('入口模块下载或执行失败在 HTML 解析前也能标记兜底，图片失败不触发', () => {
  const { window, document, ErrorEvent } = setup();
  resourceError(window, 'IMG');
  resourceError(window, 'SCRIPT', 'application/ld+json');
  assert.equal(document.documentElement.dataset.bootstrapFailed, undefined);
  resourceError(window, 'SCRIPT', 'module');
  assert.equal(document.documentElement.dataset.bootstrapFailed, 'true');
  delete document.documentElement.dataset.bootstrapFailed;
  window.dispatchEvent(new ErrorEvent('入口执行异常'));
  assert.equal(document.documentElement.dataset.bootstrapFailed, 'true');
});

test('未处理的启动异步异常显示兜底，刷新按钮仍可用', () => {
  const { window, document, reloads } = setup();
  window.dispatchEvent(new Event('unhandledrejection'));
  assert.equal(document.documentElement.dataset.bootstrapFailed, 'true');
  const click = new Event('click');
  Object.defineProperty(click, 'target', {
    value: { closest: (selector) => selector === '#bootstrap-reload' },
  });
  document.dispatchEvent(click);
  assert.equal(reloads(), 1);
});

test('React 交接后解除所有启动监听，不把后续业务异常变成启动失败', () => {
  const { window, document, ErrorEvent, reloads } = setup();
  window.dispatchEvent(new ErrorEvent('启动失败'));
  document.dispatchEvent(new Event('app:bootstrap-complete'));
  assert.equal(document.documentElement.dataset.bootstrapFailed, undefined);
  resourceError(window, 'SCRIPT', 'module');
  window.dispatchEvent(new ErrorEvent('后续业务异常'));
  window.dispatchEvent(new Event('unhandledrejection'));
  const click = new Event('click');
  Object.defineProperty(click, 'target', { value: { closest: () => true } });
  document.dispatchEvent(click);
  assert.equal(document.documentElement.dataset.bootstrapFailed, undefined);
  assert.equal(reloads(), 0);
});

test('模块失败使用刷新恢复，普通请求或渲染失败不误判为资源加载异常', () => {
  for (const message of [
    'Failed to fetch dynamically imported module: /assets/page.js',
    'Loading chunk 42 failed.',
    'error loading dynamically imported module',
    'Importing a module script failed.',
  ])
    assert.equal(isResourceError(new Error(message)), true, message);
  for (const error of [
    new Error('Failed to fetch'),
    new Error('Cannot read properties of null'),
    null,
  ])
    assert.equal(isResourceError(error), false);
});

test('模块失败显示具体资源地址，正文尚未解析时仍保留首次原因并安全补写纯文本', () => {
  const { window, document, nodes, click } = setup();
  const node = nodes.get('bootstrap-failure-details');
  nodes.delete('bootstrap-failure-details');
  resourceError(window, 'SCRIPT', 'module');
  nodes.set('bootstrap-failure-details', node);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(nodes.get('bootstrap-toggle').attributes['aria-expanded'], 'false');
  assert.equal(node.textContent, '', '折叠时不创建堆栈节点');
  click('toggle');
  assert.match(node.textContent, /https:\/\/example.test\/assets\/main.js/);
  window.dispatchEvent(new Event('unhandledrejection'));
  assert.match(node.textContent, /main.js/, '后续噪音不能覆盖首次原因');
});

test('启动执行异常保留堆栈和位置，拒绝原因按纯文本展示而不执行 HTML', () => {
  const { window, document, ErrorEvent, nodes, click } = setup();
  const event = new ErrorEvent('outer message');
  event.error = new Error('<img src=x onerror=alert(1)>');
  window.dispatchEvent(event);
  click('toggle');
  assert.match(nodes.get('bootstrap-failure-details').textContent, /Error: <img/);
  assert.equal(nodes.get('bootstrap-failure-details').innerHTML, undefined);
  document.dispatchEvent(new Event('app:bootstrap-complete'));
  const positioned = setup();
  const sourceError = Object.assign(new positioned.ErrorEvent('SyntaxError'), {
    filename: '/entry.js',
    lineno: 12,
    colno: 8,
  });
  positioned.window.dispatchEvent(sourceError);
  positioned.click('toggle');
  assert.match(positioned.nodes.get('bootstrap-failure-details').textContent, /entry.js:12:8/);
  const other = setup();
  const rejection = new Event('unhandledrejection');
  rejection.reason = '异步初始化失败';
  other.window.dispatchEvent(rejection);
  other.click('toggle');
  assert.equal(other.nodes.get('bootstrap-failure-details').textContent, '异步初始化失败');
});

test('摘要、项目调用格式、原文切换及分批预览与 React 详情保持一致，复制完整文本', async (t) => {
  let copied;
  const view = setup({
    clipboard: async (text) => {
      copied = text;
    },
  });
  t.after(() => view.document.dispatchEvent(new Event('app:bootstrap-complete')));
  const text =
    'Error: startup failure\n' +
    Array.from(
      { length: 100 },
      (_, index) => `    at frame${index} (http://localhost:5173/src/main.ts:${index + 1}:2)`,
    ).join('\n');
  const event = Object.assign(new Event('unhandledrejection'), { reason: text });
  view.window.dispatchEvent(event);
  const get = (id) => view.nodes.get(`bootstrap-${id}`);
  assert.equal(get('summary').textContent, 'Error: startup failure');
  assert.equal(get('diagnostic').hidden, true);
  view.click('toggle');
  assert.equal(get('diagnostic').hidden, false);
  assert.equal(get('failure-details').children[0].tagName, 'ol');
  assert.match(
    get('failure-details').children[0].children[1].children[0].className,
    /border-accent bg-canvas/,
  );
  assert.doesNotMatch(get('failure-details').textContent, /localhost|frame99/);
  assert.equal(get('more').hidden, false);
  view.click('raw');
  assert.equal(get('raw').attributes['aria-pressed'], 'true');
  assert.match(get('failure-details').textContent, /localhost/);
  view.click('next');
  assert.equal(get('failure-details').textContent, text);
  assert.equal(get('more').hidden, true);
  view.click('toggle');
  assert.equal(get('raw').hidden, true);
  assert.equal(get('failure-details').textContent, '');
  view.click('copy');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(copied, text);
  assert.equal(get('copy-label').textContent, '已复制');
});

test('解析和复制失败有明确反馈，交接后忽略在途复制结果并解除详情操作', async () => {
  let reject;
  const view = setup({
    parse: () => {
      throw Error('parse failed');
    },
    clipboard: () =>
      new Promise((_, no) => {
        reject = no;
      }),
  });
  view.window.dispatchEvent(
    Object.assign(new Event('unhandledrejection'), { reason: '<img src=x>\nunknown frame' }),
  );
  view.click('toggle');
  const details = view.nodes.get('bootstrap-failure-details');
  assert.match(details.textContent, /格式化失败，已显示诊断原文/);
  assert.equal(details.children[1].tagName, 'pre');
  assert.equal(details.children[1].textContent, '<img src=x>\nunknown frame');
  view.click('copy');
  reject(Error('denied'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(view.nodes.get('bootstrap-copy-label').textContent, '复制失败');
  assert.match(view.nodes.get('bootstrap-copy-status').textContent, /手动复制/);
  view.click('copy');
  view.document.dispatchEvent(new Event('app:bootstrap-complete'));
  reject(Error('late'));
  await new Promise((resolve) => setImmediate(resolve));
  view.nodes.get('bootstrap-copy-label').textContent = '交接完成';
  view.click('copy');
  assert.equal(view.nodes.get('bootstrap-copy-label').textContent, '交接完成');
});
