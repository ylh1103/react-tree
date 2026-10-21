/** 版本化模拟持久化；隐私模式或 Node 环境无法使用 localStorage 时回退内存。 */
const memory = new Map<string, unknown>();
export function readMock<T>(key: string, fallback: T): T {
  try {
    const value = globalThis.localStorage?.getItem(`parameter-management:mock:v2:${key}`);
    if (value) return JSON.parse(value) as T;
  } catch {
    // 不可用或损坏的存储不阻塞模拟接口。
  }
  return structuredClone((memory.get(key) as T | undefined) ?? fallback);
}
export function writeMock(key: string, value: unknown) {
  memory.set(key, structuredClone(value));
  try {
    globalThis.localStorage?.setItem(`parameter-management:mock:v2:${key}`, JSON.stringify(value));
  } catch {
    // 内存中的写入仍然有效。
  }
}
