/** 验证安装版 Worker 的真实格式化器及共享服务同步，防止仅修改 Monaco.tabSize 后格式化仍为 2 空格。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { syncYamlIndentation } from '../src/components/MonacoEditor/yamlIndentation.ts';

// Worker 入口依赖浏览器消息通道；抽取固定安装版的完整 formatter 类，使用其真实依赖执行。
// 不复制格式化实现，升级后若 bundle 结构变更则明确失败，要求重新核对适配契约。
const workerRequire = createRequire(import.meta.resolve('monaco-yaml'));
const source = readFileSync(workerRequire.resolve('monaco-yaml/yaml.worker.js'), 'utf8');
const start = source.indexOf('var YAMLFormatter = class {');
assert.ok(start >= 0, '安装版 Worker 的 YAMLFormatter 入口已变化');
const end = source.indexOf('\n};', start);
assert.ok(end > start, '安装版 Worker 的 YAMLFormatter 类结构已变化');
const load = async (name) => {
  const module = await import(pathToFileURL(workerRequire.resolve(name)).href);
  return module.default ?? module;
};
const [{ format }, yamlPlugin, estreePlugin, lsp, { TextDocument }] = await Promise.all([
  load('prettier/standalone'),
  load('prettier/plugins/yaml'),
  load('prettier/plugins/estree'),
  load('vscode-languageserver-types'),
  load('vscode-languageserver-textdocument'),
]);
const YAMLFormatter = new Function(
  'format',
  'yamlPlugin',
  'estreePlugin',
  'TextEdit2',
  'Range8',
  'Position3',
  `${source.slice(start, end + 3)}\nreturn YAMLFormatter;`,
)(format, yamlPlugin, estreePlugin, lsp.TextEdit, lsp.Range, lsp.Position);

test('2、4、8 空格偏好同步到实际 YAML 格式化器，切回 2 空格后保持内容语义', async () => {
  let options = {
    indentation: '  ',
    format: { enable: true, singleQuote: true },
    schemas: [{ uri: 'local:test' }],
    enableSchemaRequest: false,
  };
  let updates = 0;
  const service = {
    getOptions: () => options,
    update: async (next) => {
      updates++;
      options = { ...options, ...next };
    },
  };
  const formatter = new YAMLFormatter();
  let text = 'application:\n  server:\n    port: 8080\n';
  for (const tabSize of [4, 8, 2]) {
    await syncYamlIndentation(service, tabSize);
    await syncYamlIndentation(service, tabSize); // 同屏第二个编辑器不能再次更新 Worker。
    const document = TextDocument.create('file:///test.yaml', 'yaml', 1, text);
    const edits = await formatter.format(document, options.format);
    assert.equal(edits.length, 1);
    text = TextDocument.applyEdits(document, edits);
    assert.equal(
      text,
      `application:\n${' '.repeat(tabSize)}server:\n${' '.repeat(tabSize * 2)}port: 8080\n`,
    );
    assert.equal(options.indentation, ' '.repeat(tabSize));
    assert.equal(options.format.singleQuote, true);
    assert.deepEqual(options.schemas, [{ uri: 'local:test' }]);
    assert.equal(options.enableSchemaRequest, false);
  }
  assert.equal(updates, 3);
});

test('快速切换缩进时，旧重校验完成不能覆盖新选项', async () => {
  let options = { indentation: '  ', format: { enable: true, tabWidth: 2 } };
  const finish = [];
  const service = {
    getOptions: () => options,
    update: (next) => {
      // 与 monaco-yaml 5.5.0 一致：先同步合并配置，再异步重校验。
      options = { ...options, ...next };
      return new Promise((resolve) => finish.push(resolve));
    },
  };
  const first = syncYamlIndentation(service, 4);
  const last = syncYamlIndentation(service, 8);
  finish[1]();
  await last;
  finish[0]();
  await first;
  assert.equal(options.format.tabWidth, 8);
  assert.equal(options.indentation, '        ');
});
