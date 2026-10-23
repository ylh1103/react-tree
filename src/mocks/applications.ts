/**
 * 固定种子应用示例；数量由模拟配置或测试参数提供。
 * 使用固定种子的随机英文名，保证刷新后选择、路由和分组引用稳定。
 */
import type { ApplicationItem } from '@/types/applications.ts';
import { mockConfig } from './config.ts';

export function createMockApplications(mockApplicationCount = mockConfig.applicationCount) {
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
