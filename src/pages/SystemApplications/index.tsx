/**
 * 系统应用参数页面：以 systemName 绑定列表服务，以 appName 同步选中项。
 * 侧栏和详情订阅同一合并清单；写入期间暂停查询，选中后通过 URL 导航。
 */
import { useMemo } from 'react';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { createSystemApplicationService } from '@/queries/applications';
import { applicationListId, groupedListKeys, groupedListOptions } from '@/queries/groupedList';
import type { ListNode } from '@/components/GroupedList/types';
import ApplicationList from './components/ApplicationList';
import { useSystemWorkspace } from '@/contexts/SystemContext';
import { applicationPath } from '@/router/paths';
import {
  ApplicationParametersEmptyState,
  ApplicationParametersToolbar,
  ApplicationParametersWorkspace,
} from './components/ApplicationParametersWorkspace';
import { CollectionWorkspace, type CollectionItem } from '@/components/CollectionWorkspace';
import { CollectionSkeleton } from '@/components/CollectionWorkspace/components/CollectionSkeleton';

export default function SystemApplicationsPage() {
  const { system } = useSystemWorkspace();
  const { appName } = useParams();
  const navigate = useNavigate();
  const service = useMemo(
    () => createSystemApplicationService(system.systemName),
    [system.systemName],
  );
  const listId = applicationListId(system.systemName);
  const writing = useIsMutating({ mutationKey: groupedListKeys.write(listId) }) > 0;
  const query = useQuery({
    ...groupedListOptions(listId, service),
    enabled: !writing,
    select: applicationItems,
  });
  // 首次无数据时才占位；路由只加载通用骨架，已有缓存的刷新仍保留交互工作区。
  if (query.isPending)
    return (
      <CollectionSkeleton
        storageKey="parameter-management:split-pane:application:v1"
        defaultWidth={290}
        title={appName || '应用参数'}
        integratedHeader={!appName}
      />
    );
  return (
    <CollectionWorkspace
      database={false}
      items={query.data ?? []}
      selectedName={appName}
      pending={query.isPending}
      hasData={query.data !== undefined}
      refreshing={query.isFetching}
      error={query.error}
      refresh={() => void query.refetch()}
      renderApplicationToolbar={(props) => (
        <ApplicationParametersToolbar key={appName} {...props} />
      )}
      renderApplicationContent={(props) => <ApplicationParametersWorkspace {...props} />}
      renderApplicationEmptyState={(props) => <ApplicationParametersEmptyState {...props} />}
      renderSidebar={(close) => (
        <ApplicationList
          systemName={system.systemName}
          service={service}
          selectedAppName={appName ?? null}
          embedded
          onSelectApplication={(node) => {
            navigate(applicationPath(system.systemName, node.key));
            close();
          }}
        />
      )}
    />
  );
}

/** 详情只读取合并后清单中的叶子，分组不会被识别为应用。 */
function applicationItems(nodes: ListNode[]): CollectionItem[] {
  return nodes.flatMap((node) =>
    node.children
      ? applicationItems(node.children)
      : [{ name: node.key, description: node.desc ?? '' }],
  );
}
