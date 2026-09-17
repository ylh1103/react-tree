import { useCallback, useEffect, useRef, useState } from 'react';
import type { TreeNode } from '../../components/VirtualTree';
import { fromTreeData, toTreeData, type ListNode } from './model';

export interface GroupedListService {
  load: (signal?: AbortSignal) => Promise<ListNode[]>;
  save: (nodes: ListNode[]) => Promise<void>;
}

export function useGroupedList(
  initialNodes: ListNode[],
  service: GroupedListService,
  label: string,
) {
  const [source, setSource] = useState(initialNodes);
  const [treeData, setTreeData] = useState(() => toTreeData(initialNodes));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  // ref 同步互斥刷新和保存，覆盖 busy 状态尚未触发重渲染的连续点击窗口。
  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);

  // 接收路由 loader 的新结果；本地刷新只更新 treeData，不改动此引用基线。
  if (initialNodes !== source) {
    setSource(initialNodes);
    setTreeData(toTreeData(initialNodes));
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setStatus(`正在刷新${label}列表…`);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const next = await service.load(controller.signal);
      if (controller.signal.aborted || !mountedRef.current) return;
      setTreeData(toTreeData(next));
      setStatus(`${label}列表已刷新`);
    } catch (reason) {
      if (!controller.signal.aborted && mountedRef.current) {
        setError(reason instanceof Error ? reason.message : '刷新失败，请重试');
        setStatus('刷新失败，已保留当前列表');
      }
    } finally {
      busyRef.current = false;
      if (requestRef.current === controller) requestRef.current = null;
      if (mountedRef.current) setBusy(false);
    }
  }, [service, label]);

  const save = useCallback(
    async (tree: TreeNode[]) => {
      if (busyRef.current) throw new Error('正在处理，请稍候');
      busyRef.current = true;
      setBusy(true);
      setError('');
      setStatus('正在保存分组…');
      try {
        await service.save(fromTreeData(tree));
        if (mountedRef.current) {
          setTreeData(tree);
          setStatus('分组更改已保存');
        }
      } catch (reason) {
        if (mountedRef.current) setStatus('保存失败，编辑内容已保留，请重试');
        // 将失败继续传给树组件，阻止其提交草稿并退出编辑态。
        throw reason;
      } finally {
        busyRef.current = false;
        if (mountedRef.current) setBusy(false);
      }
    },
    [service],
  );

  return { treeData, busy, status, error, refresh, save, setStatus };
}
