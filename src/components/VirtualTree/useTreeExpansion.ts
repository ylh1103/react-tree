import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TreeNode, DropIndicator } from './types';
import type { buildTreeIndex } from './utils';

const DRAG_EXPAND_DELAY = 600;

interface TreeExpansionOptions {
  draft: TreeNode[];
  treeIndex: ReturnType<typeof buildTreeIndex>;
  normalizedSearchQuery: string;
  searchAncestorKeys: Set<string>;
  visibleBranchKeys: Set<string>;
  activeDragKey: string | null;
  dropIndicator: DropIndicator | null;
}

/** 管理手动展开、搜索期间的折叠覆盖和拖拽悬停展开。 */
export function useTreeExpansion({
  draft,
  treeIndex,
  normalizedSearchQuery,
  searchAncestorKeys,
  visibleBranchKeys,
  activeDragKey,
  dropIndicator,
}: TreeExpansionOptions) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [searchCollapse, setSearchCollapse] = useState<{
    query: string;
    keys: Set<string>;
  }>({ query: '', keys: new Set() });
  const [previousDraft, setPreviousDraft] = useState(draft);
  if (previousDraft !== draft) {
    setPreviousDraft(draft);
    const isGroup = (key: string) => treeIndex.nodeByKey.get(key)?.type === 'branch';
    if ([...expandedKeys].some((key) => !isGroup(key))) {
      setExpandedKeys(new Set([...expandedKeys].filter(isGroup)));
    }
    if ([...searchCollapse.keys].some((key) => !isGroup(key))) {
      setSearchCollapse({
        ...searchCollapse,
        keys: new Set([...searchCollapse.keys].filter(isGroup)),
      });
    }
  }

  const expandPath = useCallback((path: string[]) => {
    setExpandedKeys((previous) => new Set([...previous, ...path]));
    setSearchCollapse((previous) => {
      const keys = new Set(previous.keys);
      path.forEach((key) => keys.delete(key));
      return { ...previous, keys };
    });
  }, []);

  // 搜索命中的祖先分组叠加展示，但不写回 expandedKeys 本身，
  // 这样清空搜索词后能恢复到用户手动展开/折叠的状态，而不会把搜索期间的展开也保留下来。
  const effectiveExpandedKeys = useMemo(() => {
    if (!normalizedSearchQuery && activeDragKey === null) return expandedKeys;
    const merged = new Set(expandedKeys);
    if (normalizedSearchQuery) {
      const manuallyCollapsed =
        searchCollapse.query === normalizedSearchQuery ? searchCollapse.keys : new Set<string>();
      searchAncestorKeys.forEach((key) => {
        if (!manuallyCollapsed.has(key)) merged.add(key);
      });
      manuallyCollapsed.forEach((key) => merged.delete(key));
    }
    // 仅临时隐藏被拖分组的子树，保留原始展开状态（包括子分组）。
    // 在搜索自动展开之后移除，确保搜索状态下也能收起；拖拽结束后自动恢复。
    if (activeDragKey !== null) merged.delete(activeDragKey);
    return merged;
  }, [expandedKeys, searchAncestorKeys, normalizedSearchQuery, searchCollapse, activeDragKey]);

  const allExpanded = useMemo(
    () =>
      visibleBranchKeys.size > 0 &&
      [...visibleBranchKeys].every((key) => effectiveExpandedKeys.has(key)),
    [visibleBranchKeys, effectiveExpandedKeys],
  );

  const setAllExpanded = (expand: boolean) => {
    if (normalizedSearchQuery) {
      // 搜索内的批量操作与单组折叠一致，不覆盖搜索前的展开状态。
      setSearchCollapse({
        query: normalizedSearchQuery,
        keys: expand ? new Set() : new Set(visibleBranchKeys),
      });
      return;
    }
    setExpandedKeys((previous) => {
      const next = new Set(previous);
      visibleBranchKeys.forEach((key) => {
        if (expand) next.add(key);
        else next.delete(key);
      });
      return next;
    });
  };

  const hoverExpandKey =
    activeDragKey !== null &&
    dropIndicator !== null &&
    dropIndicator.position === 'inside' &&
    !effectiveExpandedKeys.has(dropIndicator.overKey) &&
    treeIndex.nodeByKey.get(dropIndicator.overKey)?.type === 'branch'
      ? dropIndicator.overKey
      : null;

  useEffect(() => {
    if (hoverExpandKey === null) return;
    const timer = setTimeout(() => {
      setSearchCollapse((prev) => {
        if (!prev.keys.has(hoverExpandKey)) return prev;
        const keys = new Set(prev.keys);
        keys.delete(hoverExpandKey);
        return { ...prev, keys };
      });
      setExpandedKeys((prev) => {
        if (prev.has(hoverExpandKey)) return prev;
        const next = new Set(prev);
        next.add(hoverExpandKey);
        return next;
      });
    }, DRAG_EXPAND_DELAY);
    // 同一分组的 inside 区域内移动不重置计时；移到 before/after、离开或结束拖拽时取消。
    return () => clearTimeout(timer);
  }, [hoverExpandKey]);

  const toggleExpand = useCallback(
    (key: string) => {
      if (normalizedSearchQuery && searchAncestorKeys.has(key)) {
        setSearchCollapse((prev) => {
          const keys =
            prev.query === normalizedSearchQuery ? new Set(prev.keys) : new Set<string>();
          if (effectiveExpandedKeys.has(key)) keys.add(key);
          else keys.delete(key);
          return { query: normalizedSearchQuery, keys };
        });
        return;
      }
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [effectiveExpandedKeys, normalizedSearchQuery, searchAncestorKeys],
  );

  const resetSearchCollapse = (query: string) => {
    setSearchCollapse({ query, keys: new Set() });
  };
  return {
    effectiveExpandedKeys,
    allExpanded,
    setAllExpanded,
    toggleExpand,
    expandPath,
    resetSearchCollapse,
  };
}
