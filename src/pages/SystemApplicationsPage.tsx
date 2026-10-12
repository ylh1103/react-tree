import { useMemo } from 'react';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { createSystemApplicationService } from '../features/applications/api';
import {
  applicationListId,
  groupedListKeys,
  groupedListOptions,
} from '../features/grouped-list/queries';
import type { ListNode } from '../features/grouped-list/types';
import ApplicationListPage from './ApplicationListPage';
import { useSystemWorkspace } from '../features/systems/SystemContext';
import { applicationPath } from '../features/systems/paths';
import {
  ApplicationParametersEmptyState,
  ApplicationParametersToolbar,
  ApplicationParametersWorkspace,
} from '../features/applications/ApplicationParametersWorkspace';
import { CollectionWorkspace, type CollectionItem } from './CollectionWorkspace';

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
      renderApplicationToolbar={(props) => <ApplicationParametersToolbar {...props} />}
      renderApplicationContent={(props) => <ApplicationParametersWorkspace {...props} />}
      renderApplicationEmptyState={(props) => <ApplicationParametersEmptyState {...props} />}
      renderSidebar={(close) => (
        <ApplicationListPage
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
