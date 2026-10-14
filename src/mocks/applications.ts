/**
 * 默认生成 785 条应用以预览长列表；环境变量可覆盖数量。
 * 使用固定种子的随机英文名，保证刷新后选择、路由和分组引用稳定。
 */
import type { ApplicationItem } from '../types/applications';

export function createMockApplications() {
  const requestedCount = Number(import.meta.env?.VITE_MOCK_APPLICATION_COUNT);
  const mockApplicationCount =
    Number.isSafeInteger(requestedCount) && requestedCount > 0 ? requestedCount : 785;
  const descriptions = [
    '系统的 BFF 服务',
    '统一身份与用户信息管理',
    '核心业务参数配置',
    '持续集成与发布服务',
    '跨应用共享参数',
    '批量作业与任务调度',
    '开发、测试、预发布及生产环境的配置同步与版本管理，末尾搜索关键词：尾部命中LW641',
  ];
  let seed = 785;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const usedNames = new Set<string>();
  const nameCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
  const applications: ApplicationItem[] = [];
  for (let index = 0; index < mockApplicationCount; index++) {
    let appName: string;
    do {
      const length = 1 + Math.floor(random() * 30);
      appName = Array.from(
        { length },
        () => nameCharacters[Math.floor(random() * nameCharacters.length)],
      ).join('');
    } while (usedNames.has(appName));
    usedNames.add(appName);
    const appType = index % 3 === 1 ? '1' : '0';
    applications.push({
      appName,
      appDesc:
        descriptions[index] ??
        `${appType === '1' ? '公共应用' : '业务应用'} ${index + 1} 的参数配置、服务管理与发布设置`,
      appType,
    });
  }
  return applications;
}

export async function createApi(systemName?: string) {
  if (systemName !== undefined) {
    const storageKey = `react-tree:mock:appGroupInfo:system:${encodeURIComponent(systemName)}`;
    return {
      async getItems(signal?: AbortSignal) {
        const { mockSystems } = await import('./systems');
        if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
        return mockSystems.find((system) => system.systemName === systemName)?.appCount === 0
          ? []
          : createMockApplications();
      },
      async getGroups(signal?: AbortSignal) {
        if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
        return { appGroupInfo: localStorage.getItem(storageKey) };
      },
      async saveGroups(payload: { appGroupInfo: string }) {
        localStorage.setItem(storageKey, payload.appGroupInfo);
      },
      async deleteItem() {
        throw new Error('应用删除接口尚未接入');
      },
    };
  }
  const { createMockListApi } = await import('./groupedList');
  return createMockListApi('/mock-api/applications', createMockApplications(), 'appGroupInfo');
}
