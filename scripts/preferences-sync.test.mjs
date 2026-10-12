import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createAppStore } from '../src/store/index.ts';
import {
  loadUserSettings,
  refreshUserSettings,
  saveUserSettings,
  openUserSettings,
} from '../src/store/preferencesSlice.ts';
import { defaultUserSettings } from '../src/features/preferences/types.ts';
import {
  createUserSettingsSyncTransport,
  startUserSettingsSync,
} from '../src/features/preferences/sync.ts';

function deferred() {
  let resolve;
  const promise = new Promise((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}

function createBus() {
  const ports = new Set();
  let publications = 0;
  return {
    get publications() {
      return publications;
    },
    connect() {
      const listeners = new Set();
      const port = {
        publish() {
          publications++;
          for (const other of ports) {
            if (other !== port) queueMicrotask(() => other.receive());
          }
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        receive() {
          for (const listener of listeners) listener();
        },
        close() {
          ports.delete(port);
          listeners.clear();
        },
      };
      ports.add(port);
      return port;
    },
  };
}

const settle = async () => {
  await setImmediate();
  await setImmediate();
};

function assertSettings(store, settings) {
  const state = store.getState().preferences;
  for (const [key, value] of Object.entries(settings)) assert.equal(state[key], value, key);
}

test('保存成功同步所有已打开页签，保留抽屉状态，不回写或循环广播', async (t) => {
  let persisted = { ...defaultUserSettings };
  let saves = 0;
  const api = {
    load: async () => ({ ...persisted }),
    save: async (settings) => {
      saves++;
      persisted = settings;
      return settings;
    },
  };
  const bus = createBus();
  const stores = [createAppStore(api), createAppStore(api), createAppStore(api)];
  for (const store of stores) {
    t.after(startUserSettingsSync(store, bus.connect()));
    await store.dispatch(loadUserSettings());
  }
  stores[1].dispatch(openUserSettings());
  const settings = {
    layoutMode: 'compact',
    themeMode: 'system',
    navigationIconOnly: true,
    headerToolsIconOnly: true,
  };
  await stores[0].dispatch(saveUserSettings(settings));
  await settle();
  for (const store of stores) assertSettings(store, settings);
  assert.equal(stores[1].getState().preferences.settingsOpen, true);
  assert.equal(bus.publications, 1);
  assert.equal(saves, 1);
  // 反向变更和重置也同步。
  await stores[2].dispatch(saveUserSettings(defaultUserSettings));
  await settle();
  for (const store of stores) assertSettings(store, defaultUserSettings);
  assert.equal(bus.publications, 2);
});

test('保存失败不广播；同步读取失败保留配置，后续通知可恢复', async (t) => {
  let persisted = { ...defaultUserSettings };
  let failSave = true;
  let failRead = false;
  const bus = createBus();
  const writer = createAppStore({
    load: async () => persisted,
    save: async (settings) => {
      if (failSave) throw new Error('save failed');
      persisted = settings;
      return settings;
    },
  });
  const reader = createAppStore({
    load: async () => {
      if (failRead) throw new Error('read failed');
      return persisted;
    },
    save: async (settings) => settings,
  });
  t.after(startUserSettingsSync(writer, bus.connect()));
  t.after(startUserSettingsSync(reader, bus.connect()));
  await writer.dispatch(loadUserSettings());
  await reader.dispatch(loadUserSettings());
  await writer.dispatch(saveUserSettings({ themeMode: 'dark' }));
  await settle();
  assert.equal(bus.publications, 0);
  assertSettings(reader, defaultUserSettings);
  failSave = false;
  failRead = true;
  await writer.dispatch(saveUserSettings({ themeMode: 'dark' }));
  await settle();
  assertSettings(reader, defaultUserSettings);
  assert.equal(reader.getState().preferences.status, 'ready');
  failRead = false;
  await writer.dispatch(saveUserSettings({ themeMode: 'system' }));
  await settle();
  assert.equal(reader.getState().preferences.themeMode, 'system');
});

test('启动读取及保存期间的通知排队，合并通知后读取服务端最新配置', async (t) => {
  const initial = deferred();
  const saving = deferred();
  let persisted = { ...defaultUserSettings };
  let reads = 0;
  const store = createAppStore({
    load: () => {
      reads++;
      return reads === 1 ? initial.promise : Promise.resolve(persisted);
    },
    save: () => saving.promise,
  });
  const bus = createBus();
  const sender = bus.connect();
  t.after(startUserSettingsSync(store, bus.connect()));
  t.after(() => sender.close());
  const loading = store.dispatch(loadUserSettings());
  persisted = { ...defaultUserSettings, themeMode: 'dark' };
  sender.publish();
  sender.publish();
  await settle();
  assert.equal(reads, 1);
  initial.resolve(defaultUserSettings);
  await loading;
  await settle();
  assert.equal(reads, 2);
  assert.equal(store.getState().preferences.themeMode, 'dark');
  const save = store.dispatch(saveUserSettings({ layoutMode: 'compact' }));
  sender.publish();
  sender.publish();
  await settle();
  assert.equal(reads, 2);
  persisted = { ...defaultUserSettings, layoutMode: 'compact', themeMode: 'system' };
  saving.resolve({ ...defaultUserSettings, layoutMode: 'compact', themeMode: 'dark' });
  await save;
  await settle();
  assert.equal(reads, 3);
  assertSettings(store, persisted);
});

test('本地保存使之前的后台响应失效，迟到旧配置不能覆盖新设置', async () => {
  const staleRead = deferred();
  let reads = 0;
  const store = createAppStore({
    load: () => (++reads === 1 ? Promise.resolve(defaultUserSettings) : staleRead.promise),
    save: async (settings) => settings,
  });
  await store.dispatch(loadUserSettings());
  const refresh = store.dispatch(refreshUserSettings());
  await store.dispatch(saveUserSettings({ themeMode: 'system' }));
  staleRead.resolve({ ...defaultUserSettings, themeMode: 'dark' });
  await refresh;
  assert.equal(store.getState().preferences.themeMode, 'system');
  assert.equal(store.getState().preferences.savedThemeMode, 'system');
});

test('读取中的新通知合并为下一次读取，停止同步后不再监听或广播', async () => {
  const request = deferred();
  let reads = 0;
  let persisted = { ...defaultUserSettings };
  const store = createAppStore({
    load: () => (++reads === 2 ? request.promise : Promise.resolve(persisted)),
    save: async (settings) => settings,
  });
  await store.dispatch(loadUserSettings());
  const bus = createBus();
  const sender = bus.connect();
  const stop = startUserSettingsSync(store, bus.connect());
  sender.publish();
  await settle();
  sender.publish();
  sender.publish();
  await settle();
  assert.equal(reads, 2);
  persisted = { ...defaultUserSettings, themeMode: 'system' };
  request.resolve(defaultUserSettings);
  await settle();
  assert.equal(reads, 3);
  assertSettings(store, persisted);
  stop();
  sender.publish();
  await settle();
  assert.equal(reads, 3);
  const publications = bus.publications;
  await store.dispatch(saveUserSettings({ themeMode: 'dark' }));
  assert.equal(bus.publications, publications);
  sender.close();
});

function mockWindow(t, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  globalThis.window = value;
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete globalThis.window;
  });
}

test('BroadcastChannel 只处理配置通知，清理监听并关闭通道', (t) => {
  const listeners = new Set();
  const sent = [];
  let closed = false;
  mockWindow(t, {
    BroadcastChannel: class {
      postMessage(value) {
        sent.push(value);
      }
      addEventListener(_, listener) {
        listeners.add(listener);
      }
      removeEventListener(_, listener) {
        listeners.delete(listener);
      }
      close() {
        closed = true;
      }
    },
  });
  const transport = createUserSettingsSyncTransport();
  let received = 0;
  const unsubscribe = transport.subscribe(() => received++);
  transport.publish();
  for (const listener of listeners) {
    listener({ data: 'unrelated' });
    listener({ data: sent[0] });
  }
  assert.equal(received, 1);
  unsubscribe();
  transport.close();
  assert.equal(listeners.size, 0);
  assert.equal(closed, true);
});

test('BroadcastChannel 不可用时回退 storage；存储不可用时安全降级', (t) => {
  const listeners = new Set();
  let write;
  const storage = {
    setItem: (key, value) => {
      write = { key, value };
    },
  };
  mockWindow(t, {
    BroadcastChannel: class {
      constructor() {
        throw new Error('unsupported');
      }
    },
    localStorage: storage,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  });
  const transport = createUserSettingsSyncTransport();
  let received = 0;
  const unsubscribe = transport.subscribe(() => received++);
  transport.publish();
  for (const listener of listeners) {
    listener({ key: 'unrelated', newValue: '1', storageArea: storage });
    listener({ key: write.key, newValue: null, storageArea: storage });
    listener({ key: write.key, newValue: write.value, storageArea: storage });
  }
  assert.equal(received, 1);
  unsubscribe();
  transport.close();
  assert.equal(listeners.size, 0);
  Object.defineProperty(globalThis.window, 'localStorage', {
    get() {
      throw new Error('blocked');
    },
  });
  assert.equal(createUserSettingsSyncTransport(), null);
});

test('页签恢复补读配置，重复恢复事件合并，清理时取消在途读取', async (t) => {
  const windowListeners = new Map();
  const documentListeners = new Map();
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const add = (map) => (event, listener) => map.set(event, listener);
  const remove = (map) => (event) => map.delete(event);
  mockWindow(t, {
    addEventListener: add(windowListeners),
    removeEventListener: remove(windowListeners),
  });
  globalThis.document = {
    visibilityState: 'hidden',
    addEventListener: add(documentListeners),
    removeEventListener: remove(documentListeners),
  };
  t.after(() => {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete globalThis.document;
  });
  const request = deferred();
  let reads = 0;
  let syncSignal;
  const store = createAppStore({
    load: (signal) => {
      if (++reads === 1) return Promise.resolve(defaultUserSettings);
      syncSignal = signal;
      return request.promise;
    },
    save: async (settings) => settings,
  });
  await store.dispatch(loadUserSettings());
  const stop = startUserSettingsSync(store, null);
  t.after(stop);
  documentListeners.get('visibilitychange')();
  assert.equal(reads, 1);
  globalThis.document.visibilityState = 'visible';
  documentListeners.get('visibilitychange')();
  windowListeners.get('focus')();
  windowListeners.get('pageshow')();
  assert.equal(reads, 2);
  assert.equal(store.getState().preferences.status, 'ready');
  stop();
  assert.equal(syncSignal.aborted, true);
  assert.equal(windowListeners.size, 0);
  assert.equal(documentListeners.size, 0);
  request.resolve({ ...defaultUserSettings, themeMode: 'dark' });
  await settle();
  assertSettings(store, defaultUserSettings);
});
