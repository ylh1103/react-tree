/**
 * 系统应用参数页面：以 systemName 绑定列表服务，以 appName 同步选中项。
 * 侧栏和详情订阅同一合并清单；写入期间暂停查询，选中后通过 URL 导航。
 */
import { useMemo, useState } from 'react';
import { Button, Empty, Spin } from 'antd';
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
import { SplitPane } from '@/components/SplitPane';
import { CollectionSkeleton } from '@/components/CollectionSkeleton';

export default function SystemApplicationsPage() {
  const { system } = useSystemWorkspace();
  const { appName } = useParams();
  const navigate = useNavigate();
  // 环境选择仅属于应用页；绑定系统与应用，切换目标时直接使用默认值，不用 Effect 同步。
  const [environmentSelection, setEnvironmentSelection] = useState<{
    systemName?: string;
    applicationName?: string;
    keys: string[];
  }>({ keys: ['dev', 'st', 'uat'] });
  const selectedEnvironments =
    environmentSelection.systemName === system.systemName &&
    environmentSelection.applicationName === appName
      ? environmentSelection.keys
      : ['dev', 'st', 'uat'];
  const selection = {
    selectedEnvironments,
    onChange: (keys: string[]) =>
      setEnvironmentSelection({ systemName: system.systemName, applicationName: appName, keys }),
  };
  const service = useMemo(
    () => createSystemApplicationService(system.systemName),
    [system.systemName],
  );
  const listId = applicationListId(system.systemName);
  const writing = useIsMutating({ mutationKey: groupedListKeys.write(listId) }) > 0;
  const query = useQuery({
    ...groupedListOptions(listId, service),
    enabled: !writing,
    select: applicationNames,
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
  const selected = appName !== undefined && query.data?.includes(appName);
  // 刷新尚未确认目标是否存在时先等待，失败后由列表显示错误与重试，避免误报已删除。
  const checkingTarget = Boolean(appName && !selected && query.isFetching);
  const blockingError = Boolean(
    query.error && (query.data === undefined || (appName && !selected)),
  );
  return (
    <SplitPane
      storageKey="parameter-management:split-pane:application:v1"
      defaultWidth={290}
      sidebarLabel="应用列表"
      title={appName}
      integratedHeader={!appName}
      toolbar={
        selected && !blockingError ? (
          <ApplicationParametersToolbar key={appName} {...selection} />
        ) : null
      }
      sidebar={
        <ApplicationList
          systemName={system.systemName}
          service={service}
          selectedAppName={appName ?? null}
          embedded
        />
      }
    >
      {checkingTarget ? (
        <div
          className="grid place-items-center min-h-240px"
          role="status"
          aria-label="正在加载应用"
        >
          <Spin />
        </div>
      ) : blockingError ? null : !appName ? (
        <div className="grid min-h-full min-w-0 place-items-center px-6 py-12">
          <ApplicationParametersEmptyState
            applicationCount={query.data?.length ?? 0}
            onRefresh={() => void query.refetch()}
            refreshing={query.isFetching}
          />
        </div>
      ) : !selected ? (
        <div className="py-16 text-center">
          <Empty description={`应用「${appName}」不存在或已移除`} />
          <Button className="mt-5" onClick={() => navigate(applicationPath(system.systemName))}>
            返回应用首页
          </Button>
        </div>
      ) : (
        <div className="min-w-0 h-full">
          <ApplicationParametersWorkspace {...selection} />
        </div>
      )}
    </SplitPane>
  );
}

/** 详情只读取合并后清单中的叶子，分组不会被识别为应用。 */
function applicationNames(nodes: ListNode[]): string[] {
  return nodes.flatMap((node) => (node.children ? applicationNames(node.children) : [node.key]));
}
