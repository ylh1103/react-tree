/** 验证当前安装版官方中文包、ESM 作用域隔离、占位符及原文兼容行为。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { monacoLocalePlugin } from '../build/monaco-locale-plugin.mjs';

async function loadLocalizedNls(scope) {
  const plugin = monacoLocalePlugin();
  const id = plugin.resolveId('../../nls.js', `/node_modules/monaco-editor/esm/${scope}.js`);
  const code = plugin.load(id);
  const originalPath = JSON.parse(code.match(/import \* as nls from (.+);/)[1]);
  const originalUrl = `data:text/javascript;base64,${Buffer.from(readFileSync(originalPath)).toString('base64')}`;
  const executable = code.replaceAll(JSON.stringify(originalPath), JSON.stringify(originalUrl));
  return import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);
}

test('查找控件使用当前版本中文翻译，未知文案回退原文', async () => {
  const nls = await loadLocalizedNls('vs/editor/contrib/find/browser/findWidget');
  assert.equal(nls.localize('label.find', 'Find'), '查找');
  assert.equal(nls.localize('label.replace', 'Replace'), '替换');
  assert.equal(nls.localize('unknown', 'Unknown {0}', 'value'), 'Unknown value');
  assert.equal(nls.getConfiguredDefaultLocale(), 'zh-cn');
});

test('占位符和 localize2 原文保持 Monaco 行为', async () => {
  const nls = await loadLocalizedNls('vs/base/browser/ui/inputbox/inputBox');
  assert.equal(nls.localize('error', 'Error: {0}', 'test'), '错误: test');
  assert.deepEqual(nls.localize2('error', 'Error: {0}', 'test'), {
    value: '错误: test',
    original: 'Error: test',
  });
});

test('没有官方译文的模块安全回退，适配不影响业务模块', async () => {
  const nls = await loadLocalizedNls('vs/unknown');
  assert.equal(nls.localize('find', 'Find'), 'Find');
  const plugin = monacoLocalePlugin();
  assert.equal(plugin.resolveId('./nls.js', '/src/example.js'), undefined);
  assert.equal(
    plugin.resolveId('./other.js', '/node_modules/monaco-editor/esm/vs/test.js'),
    undefined,
  );
});
