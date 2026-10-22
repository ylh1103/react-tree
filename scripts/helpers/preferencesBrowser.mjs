/** 配置副作用测试共用的浏览器替身：提供启动缓存及事件目标，结束后恢复全局对象。 */
export function mockPreferencesBrowser(t) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const values = new Map();
  globalThis.window = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  });
  globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete globalThis.window;
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete globalThis.document;
  });
  return values;
}
