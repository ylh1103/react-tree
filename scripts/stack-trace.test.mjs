/** 展示转换保留原始顺序与文本，兼容常见浏览器堆栈；只做保守精简，不隐藏未知行。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseStackTrace,
  safelyParseStackTrace,
} from '../src/components/FailureDetails/parseStackTrace.ts';

test('项目调用与依赖调用保持顺序，仅移除本地 origin，查询参数和构建版本原样保留', () => {
  const source = [
    'ReferenceError: missing value',
    '    at AppThemeProvider (http://localhost:5173/src/providers/AppThemeProvider.tsx?t=123:32:23)',
    '    at renderWithHooks (http://127.0.0.1:5173/node_modules/.vite/deps/client.js?v=abc:4213:19)',
  ];
  const rows = parseStackTrace(source.join('\n'));
  assert.deepEqual(
    rows.map((row) => row.raw),
    source,
  );
  assert.equal(rows[0].kind, 'text');
  assert.equal(rows[1].name, 'AppThemeProvider');
  assert.equal(rows[1].location, 'src/providers/AppThemeProvider.tsx?t=123:32:23');
  assert.equal(rows[1].project, true);
  assert.equal(rows[2].location, 'node_modules/.vite/deps/client.js?v=abc:4213:19');
  assert.equal(rows[2].project, false);
});

test('兼容 Firefox、匿名调用、Windows 和含括号的文件名；外站来源与非版本参数保留', () => {
  const rows = parseStackTrace(
    [
      'render@http://localhost:5173/src/view(test).tsx?mode=edit&v=abc:8:2',
      '    at https://cdn.example.com/library.js?v=abc&mode=module:10:20',
      '    at load (C:\\repo\\src\\view.ts:4:5)',
      '    at direct (/src/main.ts:12)',
    ].join('\n'),
  );
  assert.equal(rows[0].name, 'render');
  assert.equal(rows[0].location, 'src/view(test).tsx?mode=edit&v=abc:8:2');
  assert.equal(rows[1].name, '匿名调用');
  assert.equal(rows[1].location, 'https://cdn.example.com/library.js?v=abc&mode=module:10:20');
  assert.equal(rows[1].project, false);
  assert.equal(rows[2].location, 'C:\\repo\\src\\view.ts:4:5');
  assert.equal(rows[2].project, true);
  assert.equal(rows[3].location, 'src/main.ts:12');
});

test('未知格式、native、eval、错误原因和空行原样保留，依赖内部的 src 不误认成项目代码', () => {
  const source = [
    'status: 500',
    '原因：upstream failed',
    '    at invoke (native)',
    '    at eval (eval at load (http://localhost/src/main.ts:2:3), <anonymous>:1:1)',
    '',
    'unrecognized@location',
    '    at vendor (/node_modules/library/src/index.ts:1:2)',
  ];
  const rows = parseStackTrace(source.join('\n'));
  assert.deepEqual(
    rows.map((row) => row.raw),
    source,
  );
  assert.ok(rows.slice(0, -1).every((row) => row.kind === 'text'));
  assert.equal(rows.at(-1).project, false);
});

test('兼容特殊源协议、Node 内部调用、JSC 无函数名调用和异步函数，保留原地址字节', () => {
  const source = [
    '    at async run (webpack-internal:///./src/main.ts:8:2)',
    'load@blob:https://example.com/id:3:4',
    '    at next (node:internal/process/task_queues:95:5)',
    'file:///tmp/app.js:5:6',
    '    at boot (ms-appx://app/main.js:7:8)',
    '    at extension (chrome-extension://id/file.js:9:10)',
    '    at unc (\\\\server\\share\\file.js:11:12)',
    '    at relative (bundle.js:13:14)',
    'run@http://[::1]:5173/src/a.ts?v=%2f&t=business#hash:15:16',
  ];
  const result = parseStackTrace(source.join('\n'));
  assert.ok(result.every((row) => row.kind === 'frame'));
  assert.deepEqual(
    result.map((row) => row.raw),
    source,
  );
  assert.equal(result[0].name, 'async run');
  assert.equal(result[2].location, 'node:internal/process/task_queues:95:5');
  assert.equal(result[3].name, '匿名调用');
  assert.equal(result[8].location, 'src/a.ts?v=%2f&t=business#hash:15:16');
});

test('超长行保持原文，格式化意外失败时整段回退，不丢失已经识别的行', () => {
  const long = '    at ' + 'x'.repeat(5000) + ' (/src/main.ts:1:2)';
  assert.deepEqual(parseStackTrace(long), [{ kind: 'text', raw: long }]);
  const source = 'Error: example\n    at run (/src/main.ts:1:2)';
  const originalTrim = String.prototype.trim;
  let result;
  try {
    String.prototype.trim = () => {
      throw new Error('format failure');
    };
    result = safelyParseStackTrace(source);
  } finally {
    String.prototype.trim = originalTrim;
  }
  assert.equal(result.failed, true);
  assert.deepEqual(result.lines, [{ kind: 'text', raw: source }]);
});
