/** 用户本地缓存命名空间；匿名页独立保存，不读取或迁移无归属的旧数据。 */
/**
 * 从当前登录记录生成键；HTML 启动脚本也会内联此函数，故不引用模块闭包。
 * 一事通 ID（ystId）是偏好归属标识，角色和网络环境变化不应产生另一份个人偏好。
 * 仅用于缓存隔离，不作为登录或权限校验依据；存储不可用时回退匿名空间。
 */
export function userStorageKey(resource: string, storage?: Pick<Storage, 'getItem'>): string {
  try {
    const session = JSON.parse(storage?.getItem('parameter-management:login') ?? 'null');
    if (
      session?.version === 1 &&
      session.loggedIn === true &&
      typeof session.user?.ystId === 'string' &&
      session.user.ystId.length > 0
    ) {
      return `${resource}:user:${encodeURIComponent(session.user.ystId)}`;
    }
  } catch {
    // 登录记录损坏或存储禁用时不读取其他用户的缓存。
  }
  return `${resource}:anonymous`;
}

/** 浏览器调用入口；Node 与禁用 localStorage 的环境均可安全使用。 */
export function currentUserStorageKey(resource: string): string {
  try {
    return userStorageKey(resource, globalThis.localStorage);
  } catch {
    return userStorageKey(resource);
  }
}
