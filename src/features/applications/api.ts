import { mergeApplications } from '../grouped-list/model';
import type { ApplicationItem } from '../grouped-list/model';
import { createHttpListApi, createListService } from '../grouped-list/service';
import { createMockListApi } from '../grouped-list/mockApi';

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

const baseUrl = import.meta.env.VITE_LIST_API_BASE_URL?.replace(/\/$/, '');
const api = baseUrl
  ? createHttpListApi<ApplicationItem, 'appGroupInfo'>({
      items: `${baseUrl}/applications`,
      groups: `${baseUrl}/applications/groups`,
    })
  : createMockListApi('/mock-api/applications', applications, 'appGroupInfo');

export const applicationService = createListService(api, 'appGroupInfo', mergeApplications);
