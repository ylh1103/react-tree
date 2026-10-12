import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getSystemTheme,
  subscribeSystemTheme,
  useResolvedTheme,
} from '../src/features/preferences/useResolvedTheme.ts';

function Theme({ mode }) {
  return createElement('span', null, useResolvedTheme(mode));
}

test('服务端及不支持 matchMedia 的环境安全回退，手动模式保留原值', (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete globalThis.window;
  });
  delete globalThis.window;
  assert.equal(getSystemTheme(), 'light');
  subscribeSystemTheme(() => {})();
  assert.equal(
    renderToStaticMarkup(createElement(Theme, { mode: 'system' })),
    '<span>light</span>',
  );
  assert.equal(renderToStaticMarkup(createElement(Theme, { mode: 'dark' })), '<span>dark</span>');
  assert.equal(renderToStaticMarkup(createElement(Theme, { mode: 'light' })), '<span>light</span>');
  globalThis.window = {};
  assert.equal(getSystemTheme(), 'light');
  subscribeSystemTheme(() => {})();
});

test('系统主题初始值与后续变化一致，取消订阅后清理监听', (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete globalThis.window;
  });
  const listeners = new Set();
  const media = {
    matches: true,
    addEventListener: (event, listener) => {
      assert.equal(event, 'change');
      listeners.add(listener);
    },
    removeEventListener: (event, listener) => {
      assert.equal(event, 'change');
      listeners.delete(listener);
    },
  };
  globalThis.window = {
    matchMedia: (query) => {
      assert.equal(query, '(prefers-color-scheme: dark)');
      return media;
    },
  };
  assert.equal(getSystemTheme(), 'dark');
  const observed = [];
  const unsubscribe = subscribeSystemTheme(() => observed.push(getSystemTheme()));
  media.matches = false;
  listeners.forEach((listener) => listener());
  media.matches = true;
  listeners.forEach((listener) => listener());
  assert.deepEqual(observed, ['light', 'dark']);
  unsubscribe();
  assert.equal(listeners.size, 0);
});
