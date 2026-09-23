import { useCallback, useEffect, useRef, useState } from 'react';
import { fromTreeData, toTreeData } from './model';
import type { TreeNode, ListNode, ListNodeAction, GroupedListService } from './types';

/** 统一管理两个列表的查询、保存及节点操作状态。 */
export function useGroupedList(service: GroupedListService) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 同步互斥刷新和保存，覆盖状态更新前的连续点击窗口。
  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    return Promise.resolve()
      .then(() => service.load(controller.signal))
      .then((next) => {
        if (controller.signal.aborted || !mountedRef.current) return;
        setTreeData(toTreeData(next));
        setReady(true);
      })
      .catch((reason) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setError(reason instanceof Error ? reason.message : '加载失败，请重试');
        }
      })
      .finally(() => {
        // StrictMode 会先清理再重启请求；旧请求不得清除新请求的忙碌状态。
        if (requestRef.current === controller) {
          requestRef.current = null;
          busyRef.current = false;
          if (mountedRef.current) {
            setBusy(false);
            setLoading(false);
          }
        }
      });
  }, [service]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
      requestRef.current = null;
      busyRef.current = false;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    setBusy(true);
    setLoading(true);
    setError('');
    await load();
  }, [load]);

  const save = useCallback(
    async (tree: TreeNode[]) => {
      if (busyRef.current) throw new Error('正在处理，请稍候');
      busyRef.current = true;
      setBusy(true);
      setError('');
      try {
        await service.save(fromTreeData(tree));
        if (mountedRef.current) {
          setTreeData(tree);
        }
      } finally {
        busyRef.current = false;
        if (mountedRef.current) setBusy(false);
      }
    },
    [service],
  );

  const runNodeAction = useCallback(
    async (action: ListNodeAction, node: ListNode) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError('');
      try {
        const result = await action(node);
        if (result !== false && mountedRef.current) {
          // 释放互斥锁后立即刷新，重新合并清单与分组；删除不走分组保存接口。
          busyRef.current = false;
          await refresh();
        }
      } catch (reason) {
        if (mountedRef.current) {
          setError(reason instanceof Error ? reason.message : '操作失败，请重试');
        }
      } finally {
        busyRef.current = false;
        if (mountedRef.current) setBusy(false);
      }
    },
    [refresh],
  );

  return { treeData, ready, busy, loading, error, refresh, save, runNodeAction };
}
