/** 按系统保存应用变更，旧种子清单和已有分组无需迁移。 */
import {
  applicationEnvironmentTags,
  defaultApplicationEnvironmentTags,
  type ApplicationDetails,
  type ApplicationItem,
} from '@/types/applications.ts';
import { parseGroups } from '@/components/GroupedList/model/model.ts';
import type { ListNode } from '@/components/GroupedList/types';
import { createMockApplications } from './applications.ts';
import { readMock, writeMock } from './storage.ts';

export function mockApplicationCatalog(systemName: string, appCount: number) {
  const storageKey = `application-details:${systemName}`;
  const changes = readMock<ApplicationDetails[]>(storageKey, []);
  const items = new Map<string, ApplicationItem>(
    createMockApplications(appCount).map((item) => [item.appName, item]),
  );
  for (const { appName, appDesc, appType } of changes) {
    items.set(appName, { appName, appDesc, appType });
  }
  return {
    items,
    details(appName: string): ApplicationDetails | undefined {
      const item = items.get(appName);
      if (!item) return;
      return (
        changes.find((app) => app.appName === appName) ?? {
          ...item,
          releaseUnit: '',
          envTags: defaultApplicationEnvironmentTags,
          sharedModules: [],
        }
      );
    },
    save(
      input: Partial<ApplicationDetails> | undefined,
      editing: boolean,
      fail: (status: number, message: string) => never,
    ) {
      const { appName, appType, appDesc, releaseUnit, envTags, sharedModules } = input ?? {};
      if (
        typeof appName !== 'string' ||
        !appName ||
        (!editing && !/^[a-z0-9_-]+$/i.test(appName)) ||
        typeof appDesc !== 'string' ||
        !appDesc.trim() ||
        typeof releaseUnit !== 'string' ||
        !releaseUnit.trim() ||
        (appType !== '0' && appType !== '1') ||
        !Array.isArray(envTags) ||
        !envTags.length ||
        !envTags.every((tag) => applicationEnvironmentTags.includes(tag)) ||
        !Array.isArray(sharedModules) ||
        !sharedModules.every((name) => name !== appName && items.get(name)?.appType === '1')
      )
        return fail(400, '应用信息无效，请检查表单');
      const existing = items.get(appName);
      if (editing && !existing) return fail(404, '应用不存在或已移除');
      if (editing && existing?.appType !== appType) return fail(400, '应用类型不可修改');
      if (
        !editing &&
        (existing || groupHasKey(parseGroups(readMock(`groups:${systemName}`, null)), appName))
      )
        return fail(409, '应用名称已被使用');
      const item = { appName, appDesc: appDesc.trim(), appType };
      writeMock(storageKey, [
        ...changes.filter((app) => app.appName !== appName),
        {
          ...item,
          releaseUnit: releaseUnit.trim(),
          envTags: [...new Set(envTags)],
          sharedModules: [...new Set(sharedModules)],
        },
      ]);
      return item;
    },
  };
}

function groupHasKey(nodes: ListNode[], key: string): boolean {
  return nodes.some(
    (node) => node.children && (node.key === key || groupHasKey(node.children, key)),
  );
}
