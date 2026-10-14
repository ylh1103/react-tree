/**
 * 把原始应用 API 组装成分组列表服务，不在 UI 内重复实现清单/分组合并。
 * 系统服务绑定一个 systemName；组件通过 useMemo 保持实例稳定，缓存身份由列表查询键决定。
 */
import { applicationApi, createSystemApplicationApi } from '../api/applications.ts';
import { mergeApplications } from '../components/GroupedList/model/model.ts';
import { createListService } from '../components/GroupedList/model/service.ts';

export const applicationService = createListService(
  applicationApi,
  'appGroupInfo',
  mergeApplications,
);

/** 每个系统工作区绑定自己的服务；组件通过 useMemo 保持实例稳定。 */
export function createSystemApplicationService(systemName: string) {
  return createListService(
    createSystemApplicationApi(systemName),
    'appGroupInfo',
    mergeApplications,
  );
}
