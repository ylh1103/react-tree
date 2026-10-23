/**
 * 协调列表读取、保存和自定义节点操作，所有写入共用同一 mutation key。
 * 保存前重新读取服务端快照并检查冲突；保存后取消旧查询并更新缓存，失败保留编辑草稿。
 */
import { useCallback, useRef } from 'react';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { fromTreeData, toTreeData } from '../model/model';
import { reconcileGroupSave } from '../model/saveConflict';
import {
  groupedListKeys,
  groupedListOptions,
  refreshGroupedList,
  type GroupedListId,
} from '@/queries/groupedList';
import type { TreeNode, ListNode, ListNodeAction, GroupedListService } from '../types';

const EMPTY_TREE: TreeNode[] = [];

/**
 * 返回服务端列表及读取/写入状态，草稿仍由 useTreeReducer 独立维护。
 * lockRef 阻止同一组件在 React 更新前重复提交，mutation key 阻止其他订阅者并发写入。
 * 保存顺序：取消旧读取 → 获取最新快照 → 冲突合并 → 写入 → 更新缓存 → 标记重新验证。
 */
export function useGroupedList(id: GroupedListId, service: GroupedListService) {
  const { modal } = App.useApp();
  const client = useQueryClient();
  const mutationKey = groupedListKeys.write(id);
  const writing = useIsMutating({ mutationKey }) > 0;
  const lockRef = useRef(false);
  const query = useQuery({
    ...groupedListOptions(id, service),
    enabled: !writing,
    // 稳定的 select 配合结构共享：内容未改变时不重建树和索引。
    select: toTreeData,
  });
  const refresh = useCallback(() => refreshGroupedList(client, id), [client, id]);
  const invalidateAfterWrite = () =>
    client.invalidateQueries({
      queryKey: groupedListKeys.list(id),
      exact: true,
      // 同步操作可能在 React 提交暂停状态前结束，此时直接刷新；
      // 已暂停的查询保持过期，重新启用后刷新。
      refetchType: 'active',
    });

  const { mutateAsync: saveTree } = useMutation({
    mutationKey,
    mutationFn: async ({ tree, baseline }: { tree: TreeNode[]; baseline: TreeNode[] }) => {
      await client.cancelQueries({ queryKey: groupedListKeys.list(id), exact: true });
      // 冲突检查必须读取最新服务端数据，不能用可能仍在 staleTime 内的缓存。
      const latest = await service.load();
      const nodes = reconcileGroupSave(fromTreeData(baseline), fromTreeData(tree), latest);
      await service.save(nodes);
      // 防止保存过程中其他调用方主动 refetch 的旧响应覆盖保存结果。
      await client.cancelQueries({ queryKey: groupedListKeys.list(id), exact: true });
      client.setQueryData(groupedListKeys.list(id), nodes);
      return toTreeData(nodes);
    },
    onError: (error) => {
      modal.error({ title: '保存失败', content: error.message, okText: '知道了' });
    },
    // 包括失败：写入期间收到的外部失效通知也会在查询重新启用后得到处理。
    onSettled: invalidateAfterWrite,
  });
  const { mutateAsync: performAction } = useMutation({
    mutationKey,
    mutationFn: async ({ action, node }: { action: ListNodeAction; node: ListNode }) => {
      await client.cancelQueries({ queryKey: groupedListKeys.list(id), exact: true });
      return action(node);
    },
    onError: (error) => {
      modal.error({ title: '操作失败', content: error.message, okText: '知道了' });
    },
    onSettled: (result, error) => {
      // 取消操作不触发额外请求；已有外部失效标记保持不变。
      if (
        result !== false ||
        error ||
        client.getQueryState(groupedListKeys.list(id))?.isInvalidated
      )
        return invalidateAfterWrite();
    },
  });

  const save = useCallback(
    async (tree: TreeNode[], baseline: TreeNode[]) => {
      if (lockRef.current || client.isMutating({ mutationKey: groupedListKeys.write(id) })) {
        throw new Error('正在处理，请稍候');
      }
      lockRef.current = true;
      try {
        return await saveTree({ tree, baseline });
      } finally {
        lockRef.current = false;
      }
    },
    [client, id, saveTree],
  );
  const runNodeAction = useCallback(
    async (action: ListNodeAction, node: ListNode) => {
      if (lockRef.current || client.isMutating({ mutationKey: groupedListKeys.write(id) })) return;
      lockRef.current = true;
      try {
        await performAction({ action, node });
      } catch {
        // mutation 的 onError 统一展示错误弹窗。
      } finally {
        lockRef.current = false;
      }
    },
    [client, id, performAction],
  );

  return {
    treeData: query.data ?? EMPTY_TREE,
    ready: query.data !== undefined,
    busy: writing,
    loading: query.isFetching,
    error: query.error,
    refresh,
    save,
    runNodeAction,
  };
}
