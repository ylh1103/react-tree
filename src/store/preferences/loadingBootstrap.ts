/**
 * 启动图标缓存：HTML 头部脚本与 Redux 初始化共用缓存键和校验逻辑，减少刷新前后的图标变化。
 * 确认后的写入由 effects.ts 统一订阅；缓存仅是配置读取前的显示提示；完整用户配置始终以设置接口为准，不据此开放配置保存。
 */
import { loadingStyleIds, type LoadingStyleId } from '../../types/loading.ts';
import { defaultUserSettings } from '../../types/preferences.ts';

/** 只缓存显示提示，不替代完整用户配置，也不据此允许配置写入。 */
export const bootstrapLoadingKey = 'parameter-management:bootstrap-loading:v1';

/**
 * 只接受 allowed 中的方案 ID，空值、未知值及存储读取异常均返回 fallback，不修改缓存。
 * 函数源码会被内联到 HTML，校验所需的键、白名单和默认值必须通过参数传入，不能引用模块常量。
 */
export function readLoadingStyle(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  allowed: readonly LoadingStyleId[],
  fallback: LoadingStyleId,
): LoadingStyleId {
  try {
    const value = storage.getItem(key);
    return allowed.find((id) => id === value) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * 为 Redux 初始化读取显示提示，与 HTML 脚本分别读取同一缓存并执行相同校验。
 * 外层 try 还处理 window 不存在或获取 localStorage 对象本身就抛错的情况，保证 Store 可正常创建。
 */
export function readBootstrapLoading(): LoadingStyleId {
  try {
    return readLoadingStyle(
      window.localStorage,
      bootstrapLoadingKey,
      loadingStyleIds,
      defaultUserSettings.loadingStyle,
    );
  } catch {
    return defaultUserSettings.loadingStyle;
  }
}
