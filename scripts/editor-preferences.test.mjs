/** 编辑器偏好回归：兼容旧文档、完整保存、串行失败恢复与取消后的旧响应保护。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { TokenTheme } from 'monaco-editor/esm/vs/editor/common/languages/supports/tokenization.js';
import { vs, vs_dark } from 'monaco-editor/esm/vs/editor/standalone/common/themes.js';
import { defaultUserSettings, parseUserSettings } from '../src/types/preferences.ts';
import { defaultEditorPreferences, editorThemeIds } from '../src/types/editorPreferences.ts';
import { customEditorThemes } from '../src/components/MonacoEditor/themeCatalog.ts';
import { registerEditorThemes } from '../src/components/MonacoEditor/themeDefinitions.ts';
import { settingsFromDocument } from '../src/types/userSettings.ts';
import { createUserSettingsApi } from '../src/api/preferences.ts';
import { createAppStore } from '../src/store/index.ts';
import {
  loadUserSettings,
  refreshUserSettings,
  saveUserSettings,
} from '../src/store/slices/preferencesSlice.ts';
import { mockUserSettingsApi } from './helpers/userSettingsApi.mjs';
import { mockConfig } from '../src/mocks/config.ts';
import { readMock, writeMock } from '../src/mocks/storage.ts';

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('旧编辑器主题原样保留，新组及部分字段补齐默认值，非法配置拒绝读取', () => {
  assert.deepEqual(settingsFromDocument('{"theme":"vs-dark"}').editor, defaultEditorPreferences);
  assert.deepEqual(settingsFromDocument('{"editor":{"wordWrap":"on"}}').editor, {
    ...defaultEditorPreferences,
    wordWrap: 'on',
  });
  for (const editor of [null, [], 'dark', undefined])
    assert.throws(() => parseUserSettings({ ...defaultUserSettings, editor }), /格式错误/);
  for (const [key, values] of Object.entries({
    theme: ['dark', '', null],
    wordWrap: [true, 'bounded', null],
    lineNumbers: [true, '', null],
    fontSize: [9, 25, 13.5, '13', NaN],
    tabSize: [0, 3, '2', null],
    minimap: [1, 'false', null],
  })) {
    for (const value of [...values, undefined])
      assert.throws(
        () => parseUserSettings({ ...defaultUserSettings, editor: { [key]: value } }),
        /格式错误/,
      );
  }
  for (const theme of editorThemeIds)
    assert.equal(settingsFromDocument(JSON.stringify({ editor: { theme } })).editor.theme, theme);
});

test('精选主题注册及保存重读：每款保留源色板和持久化设置', async (t) => {
  const registered = new Map();
  registerEditorThemes((id, definition) => registered.set(id, definition));
  let persisted = defaultUserSettings;
  mockUserSettingsApi(t, {
    load: async () => persisted,
    save: async (settings) => {
      persisted = settings;
      return settings;
    },
  });
  const store = createAppStore();
  await store.dispatch(loadUserSettings());
  assert.equal(registered.size, 5);
  for (const theme of customEditorThemes) {
    const definition = registered.get(theme.value);
    assert.equal(definition.colors['editor.background'], theme.background);
    assert.equal(definition.colors['editor.foreground'].toLowerCase(), theme.foreground);
    assert.equal(definition.base, theme.dark ? 'vs-dark' : 'vs');
    await store.dispatch(
      saveUserSettings({ editor: { ...defaultEditorPreferences, theme: theme.value } }),
    );
    const reloaded = createAppStore();
    await reloaded.dispatch(loadUserSettings());
    assert.equal(reloaded.getState().preferences.editor.theme, theme.value);
    assert.equal(persisted.theme, defaultUserSettings.theme);
    assert.equal(persisted.themeMode, defaultUserSettings.themeMode);
  }
});

/** 使用安装版 Monaco 的匹配器，覆盖基础主题继承及具体 token 优先于通用 token 的真实行为。 */
function compileTheme(definition) {
  const base = definition.base === 'vs' ? vs : vs_dark;
  const compiled = TokenTheme.createFromRawTokenTheme(
    [
      ...(definition.inherit ? base.rules : []),
      {
        token: '',
        foreground: definition.colors['editor.foreground'],
        background: definition.colors['editor.background'],
      },
      ...definition.rules,
    ],
    [],
  );
  const colors = compiled.getColorMap();
  return (token) => {
    const metadata = compiled.match(0, token);
    return { color: colors[(metadata >>> 15) & 511].toString(), fontStyle: (metadata >>> 11) & 15 };
  };
}

test('真实主题匹配：YAML/JSON 使用目标色，其他语言及原主题规则保持不变', () => {
  const registered = new Map();
  registerEditorThemes((id, definition) => registered.set(id, definition));
  for (const theme of customEditorThemes) {
    const source = JSON.parse(
      readFileSync(
        new URL(`../node_modules/monaco-themes/themes/${theme.label}.json`, import.meta.url),
        'utf8',
      ),
    );
    const definition = registered.get(theme.value);
    assert.equal(definition.base, source.base);
    assert.equal(definition.inherit, source.inherit);
    assert.deepEqual(definition.colors, source.colors);
    assert.deepEqual(definition.rules.slice(0, source.rules.length), source.rules);
    const original = compileTheme(source);
    const adapted = compileTheme(definition);
    for (const [token, color] of Object.entries({
      'type.yaml': theme.key,
      'number.yaml': theme.number,
      'number.float.yaml': theme.number,
      'number.hex.yaml': theme.number,
      'number.octal.yaml': theme.number,
      'number.infinity.yaml': theme.number,
      'number.nan.yaml': theme.number,
      'number.date.yaml': theme.number,
      'string.yaml': theme.string,
      'keyword.yaml': theme.keyword,
      'comment.yaml': theme.comment,
      'string.key.json': theme.key,
      'string.value.json': theme.string,
      'number.json': theme.number,
      'keyword.json': theme.keyword,
    })) {
      assert.equal(adapted(token).color, color, `${theme.value}: ${token}`);
    }
    for (const token of [
      'type.ts',
      'number.js',
      'number.hex.js',
      'string.js',
      'string.sql',
      'keyword.js',
      'comment.js',
      'comment.yaml',
      'comment.json',
      'string.escape.yaml',
      'string.invalid.yaml',
    ]) {
      assert.deepEqual(adapted(token), original(token), `${theme.value}: 不改变 ${token}`);
    }
    const added = definition.rules.slice(source.rules.length);
    assert.ok(added.every((rule) => /\.(yaml|json)$/.test(rule.token)));
    assert.ok(!added.some((rule) => rule.token === 'comment.yaml'));
    // 每款主题都按实际最终颜色检查类别区分，防止预览不同色但被基础主题规则覆盖。
    for (const tokens of [
      ['type.yaml', 'string.yaml', 'number.yaml', 'keyword.yaml'],
      ['string.key.json', 'string.value.json', 'number.json', 'keyword.json'],
    ]) {
      assert.equal(
        new Set(tokens.map((token) => adapted(token).color)).size,
        tokens.length,
        `${theme.value}: 键名、字符串、数字和布尔/空值应分别着色`,
      );
    }
    if (theme.value === 'dracula') {
      // YAML true/false/null/~ 及 JSON 布尔值/空值均是 keyword；必须与键名区分，且不改 JS 关键字。
      assert.equal(adapted('keyword.yaml').color, '#8be9fd');
      assert.equal(adapted('keyword.json').color, '#8be9fd');
      assert.notEqual(adapted('keyword.yaml').color, adapted('type.yaml').color);
      assert.notEqual(adapted('keyword.json').color, adapted('string.key.json').color);
      for (const token of [
        'number.yaml',
        'number.float.yaml',
        'string.yaml',
        'number.json',
        'string.value.json',
      ])
        assert.notEqual(
          adapted('keyword.yaml').color,
          adapted(token).color,
          `常量色应区别于 ${token}`,
        );
    } else {
      assert.deepEqual(adapted('keyword.yaml'), original('keyword.yaml'));
      assert.ok(!added.some((rule) => rule.token === 'keyword.yaml'));
    }
    if (['github-dark', 'dracula', 'night-owl'].includes(theme.value))
      assert.ok(!added.some((rule) => rule.token === 'string.yaml'));
  }
});

test('旧相对行号兼容为普通行号，读取不写回，后续保存保留开关值和其他配置', async () => {
  mockConfig.delayMs = 0;
  const api = createUserSettingsApi('/api/user-settings');
  const legacy = JSON.stringify({
    theme: 'vs-dark',
    editor: { lineNumbers: 'relative', fontSize: 18, minimap: true },
  });
  writeMock('display-settings', legacy);
  const settings = await api.load();
  assert.equal(settings.editor.lineNumbers, 'on');
  assert.equal(settings.editor.fontSize, 18);
  assert.equal(settings.editor.minimap, true);
  assert.equal(readMock('display-settings', ''), legacy);
  for (const lineNumbers of ['off', 'on']) {
    const saved = await api.save({
      ...settings,
      editor: { ...settings.editor, lineNumbers },
    });
    assert.equal(saved.editor.lineNumbers, lineNumbers);
    assert.equal((await api.load()).editor.lineNumbers, lineNumbers);
    assert.equal(JSON.parse(readMock('display-settings', '')).theme, 'vs-dark');
  }
});

test('真实设置 API 保存编辑器选项，保留历史及嵌套未知字段，损坏文档不可覆盖', async () => {
  mockConfig.delayMs = 0;
  const api = createUserSettingsApi('/api/user-settings');
  const original = {
    theme: 'vs-dark',
    defaultCheckAllEnvTag: true,
    future: 1,
    editor: { future: { enabled: true } },
  };
  writeMock('display-settings', JSON.stringify(original));
  const editor = {
    ...defaultEditorPreferences,
    wordWrap: 'on',
    lineNumbers: 'off',
    fontSize: 18,
    tabSize: 4,
    minimap: true,
  };
  await api.save({ ...defaultUserSettings, editor });
  assert.deepEqual(JSON.parse(readMock('display-settings', '')), {
    ...original,
    ...defaultUserSettings,
    editor: { ...original.editor, ...editor },
  });
  assert.deepEqual((await api.load()).editor, editor);
  for (const broken of ['{', '{"editor":{"wordWrap":true}}']) {
    writeMock('display-settings', broken);
    await assert.rejects(api.save(defaultUserSettings));
    assert.equal(readMock('display-settings', ''), broken);
  }
});

test('连续编辑串行发送，较早响应不覆盖新值，失败回退最近成功值并可重试、刷新和重置', async (t) => {
  const first = deferred();
  const writes = [];
  let persisted = defaultUserSettings;
  let failing = true;
  mockUserSettingsApi(t, {
    load: async () => persisted,
    save: async (settings) => {
      writes.push(settings);
      if (writes.length === 1) await first.promise;
      if (writes.length === 2 && failing) throw Error('编辑器保存失败');
      persisted = settings;
      return settings;
    },
  });
  const store = createAppStore();
  await store.dispatch(loadUserSettings());
  const editor = { ...defaultEditorPreferences, theme: 'hc-black', wordWrap: 'on' };
  const saving = store.dispatch(saveUserSettings({ editor }));
  const nextEditor = { ...editor, lineNumbers: 'off', minimap: true };
  const next = store.dispatch(saveUserSettings({ editor: nextEditor }));
  assert.deepEqual(store.getState().preferences.editor, nextEditor);
  assert.equal(writes.length, 1);
  first.resolve();
  await saving;
  await next;
  assert.deepEqual(store.getState().preferences.editor, editor);
  assert.deepEqual(store.getState().preferences.failedSettings, { editor: nextEditor });
  failing = false;
  await store.dispatch(saveUserSettings(store.getState().preferences.failedSettings));
  await store.dispatch(saveUserSettings({ themeMode: 'light' }));
  assert.deepEqual(persisted.editor, nextEditor);
  const reloaded = createAppStore();
  await reloaded.dispatch(loadUserSettings());
  assert.deepEqual(reloaded.getState().preferences.editor, nextEditor);
  persisted = { ...persisted, editor: { ...editor, fontSize: 24 } };
  await reloaded.dispatch(refreshUserSettings());
  assert.deepEqual(reloaded.getState().preferences.editor, persisted.editor);
  await reloaded.dispatch(saveUserSettings({ editor: defaultEditorPreferences }));
  assert.equal(persisted.themeMode, 'light');
  assert.deepEqual(persisted.editor, defaultEditorPreferences);
});

test('取消编辑器保存后，迟到的响应不能改变回退值', async (t) => {
  const pending = deferred();
  mockUserSettingsApi(t, {
    load: async () => defaultUserSettings,
    save: async (settings) => {
      await pending.promise;
      return settings;
    },
  });
  const store = createAppStore();
  await store.dispatch(loadUserSettings());
  const saving = store.dispatch(
    saveUserSettings({ editor: { ...defaultEditorPreferences, theme: 'vs-dark' } }),
  );
  saving.abort();
  await saving;
  pending.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(store.getState().preferences.editor, defaultEditorPreferences);
  assert.deepEqual(store.getState().preferences.savedEditor, defaultEditorPreferences);
});
