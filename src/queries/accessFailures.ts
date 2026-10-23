/** 系统接口拒绝访问时撤下工作区缓存并取消相关请求，不依赖登录资料或前端身份推导。 */
import { queryClient } from './client.ts';
import { cancelHttpRequests, onAccessFailure } from '@/http/request.ts';

/** 只处理接口明确返回的 403；其他状态仍交给各请求及路由展示。 */
export function startSystemAccessFailureHandling() {
  return onAccessFailure((error, config) => {
    if (error.status !== 403) return;
    const access = /^\/api\/systems\/(.+)\/access$/.exec(config.url ?? '');
    const name = config.params?.systemName ?? (access ? decodeURIComponent(access[1]) : undefined);
    if (!name) return;
    cancelHttpRequests(name, config);
    queryClient.setQueryData(['system-access', name], { denied: true });
    const related = (key: readonly unknown[]) =>
      key.some((part) => part === name || part === `applications:${name}`);
    void queryClient.cancelQueries({
      predicate: (query) => query.queryKey[0] !== 'system-access' && related(query.queryKey),
    });
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'system-access' && related(query.queryKey),
    });
  });
}
