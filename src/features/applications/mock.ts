import type { ApplicationItem } from '../grouped-list/types';
import { createMockListApi } from '../grouped-list/mockApi';

export function createApi() {
  const applications: ApplicationItem[] = [
    { appName: 'ABS-BFF', appDesc: 'ABS 系统的 BFF 服务', appType: '0' },
    { appName: '用户中心', appDesc: '统一身份与用户信息管理', appType: '1' },
    { appName: '核心服务', appDesc: '核心业务参数配置', appType: '0' },
    { appName: 'CICI服务', appDesc: '持续集成与发布服务', appType: '1' },
    { appName: '公共配置', appDesc: '跨应用共享参数', appType: '1' },
    { appName: '自动化任务', appDesc: '批量作业与任务调度', appType: '0' },
    {
      appName: '企业级统一应用参数配置与跨环境发布管理平台—长名称测试',
      appType: '0',
      appDesc: '开发、测试、预发布及生产环境的配置同步与版本管理，末尾搜索关键词：尾部命中LW641',
    },
  ];

  const requestedCount = Number(import.meta.env.VITE_MOCK_APPLICATION_COUNT);
  const mockApplicationCount =
    Number.isSafeInteger(requestedCount) && requestedCount > applications.length
      ? requestedCount
      : applications.length;
  const initialApplicationCount = applications.length;
  for (let index = 0; index < mockApplicationCount - initialApplicationCount; index++) {
    const number = String(index + initialApplicationCount + 1).padStart(3, '0');
    const appType = index % 3 === 0 ? '1' : '0';
    const category = appType === '1' ? 'public' : 'bussiness';
    applications.push({
      appName: `${category}-${number}`,
      appDesc: `${category} ${number} 的参数配置、服务管理与发布设置`,
      appType,
    });
  }

  return createMockListApi('/mock-api/applications', applications, 'appGroupInfo');
}
