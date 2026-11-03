/** 诊断序列化覆盖跨 realm、非标准抛出值和 cause，禁止通过详情展开请求配置或执行 HTML。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { formatFailureDetails } from '../src/utils/failureDetails.ts';

test('保留跨 realm 错误的消息、堆栈、HTTP 状态和 cause，不序列化请求配置', () => {
  const cause = runInNewContext('new TypeError("upstream failure")');
  const error = Object.assign(new Error('request failed', { cause }), {
    status: 500,
    code: 'ERR_NETWORK',
    config: { headers: { Authorization: 'private-token' } },
  });
  const details = formatFailureDetails(error);
  for (const value of [
    'request failed',
    'TypeError: upstream failure',
    'status: 500',
    'code: ERR_NETWORK',
  ])
    assert.ok(details.includes(value), value);
  assert.doesNotMatch(details, /private-token|Authorization/);
});

test('兼容字符串和无消息异常，循环原因、异常 getter 和过长堆栈不会破坏失败反馈', () => {
  assert.equal(formatFailureDetails('plain failure'), 'plain failure');
  assert.match(formatFailureDetails(null), /未提供/);
  assert.match(formatFailureDetails({ status: 503 }), /status: 503/);
  const circular = { message: 'cycle' };
  circular.cause = circular;
  assert.match(formatFailureDetails(circular), /循环原因/);
  assert.match(
    formatFailureDetails({
      get message() {
        throw Error('getter');
      },
    }),
    /无法读取/,
  );
  assert.equal(formatFailureDetails({ message: 'x'.repeat(20000) }), 'x'.repeat(20000));
});

test('字段 getter 分别隔离，读取消息或状态失败仍保留堆栈、code 和 cause', () => {
  const details = formatFailureDetails({
    get message() {
      throw Error('message getter');
    },
    stack: 'Error: original\n at load (/src/load.ts:1:2)',
    get status() {
      throw Error('status getter');
    },
    code: 'ERR_KEEP',
    cause: new Error('nested cause'),
  });
  for (const value of [
    '无法读取异常字段 message',
    'original',
    '/src/load.ts:1:2',
    '无法读取异常字段 status',
    'ERR_KEEP',
    'nested cause',
  ])
    assert.ok(details.includes(value), value);
});

test('聚合异常兼容跨 realm，重复引用不当作循环，真正的循环有明确提示', () => {
  const shared = new Error('shared error');
  const aggregate = runInNewContext('new AggregateError([new TypeError("inner")], "aggregate")');
  assert.match(formatFailureDetails(aggregate), /聚合异常 1：[\s\S]*TypeError: inner/);
  const repeated = formatFailureDetails(new AggregateError([shared, shared], 'two failures'));
  assert.doesNotMatch(repeated, /循环原因/);
  assert.match(repeated, /聚合异常 2：[\s\S]*shared error/);
  const recursive = new AggregateError([], 'recursive');
  recursive.errors.push(recursive);
  assert.match(formatFailureDetails(recursive), /循环原因/);
});

test('字符上限、深度和聚合数量限制都有可见提示，异常 Proxy 仍可输出诊断文本', () => {
  const long = formatFailureDetails({ stack: 'Error: ' + 'x'.repeat(300000) });
  assert.ok(long.length <= 262144);
  assert.match(long, /后续内容已截断/);
  assert.match(
    formatFailureDetails(
      new AggregateError(
        Array.from({ length: 2001 }, (_, i) => ({ message: String(i) })),
        'many',
      ),
    ),
    /异常节点超过 2000 项/,
  );
  let deep = new Error('deep');
  for (let i = 0; i < 40; i++) deep = new Error('outer', { cause: deep });
  assert.match(formatFailureDetails(deep), /原因深度超过 32 层.*已省略/);
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  assert.match(formatFailureDetails(proxy), /无法读取/);
  const errors = new Proxy([], {
    get() {
      throw Error('array getter');
    },
  });
  assert.match(
    formatFailureDetails({ message: 'preserved', errors }),
    /preserved[\s\S]*无法读取异常字段 length/,
  );
});

test('常规长文本、较深 cause 与超过旧 20 项限制的聚合异常不再提前丢失', () => {
  const long = 'x'.repeat(30000) + '保留尾部';
  assert.equal(formatFailureDetails(long), long);
  let error = { message: '最深根因' };
  for (let index = 0; index < 8; index++) error = { message: `第${index}层`, cause: error };
  assert.match(formatFailureDetails(error), /最深根因/);
  const many = formatFailureDetails(
    new AggregateError(
      Array.from({ length: 50 }, (_, index) => ({ message: `子异常${index}` })),
      'aggregate',
    ),
  );
  assert.match(many, /聚合异常 50：[\s\S]*子异常49/);
  assert.doesNotMatch(many, /保护上限|已省略|已截断/);
});
