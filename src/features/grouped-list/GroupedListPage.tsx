import { useCallback, useState } from 'react';
import { Alert } from 'antd';
import { VirtualTree, type LeafNode, type VirtualTreeProps } from '../../components/VirtualTree';
import { useTreeTheme } from '../../components/VirtualTree/useTreeTheme';
import type { ListNode } from './model';
import type { GroupedListConfig } from './types';
import { useGroupedList, type GroupedListService } from './useGroupedList';
import { GroupedLeaf, GroupContent } from './GroupedListContent';
import { GroupedListToolbar } from './GroupedListToolbar';

function getSearchText(node: LeafNode) {
  return `${node.title} ${(node.data as ListNode).desc ?? ''}`;
}
const renderBranch: NonNullable<VirtualTreeProps['renderBranchContent']> = (node, context) => (
  <GroupContent node={node} {...context} />
);

export function GroupedListPage({
  initialNodes,
  service,
  config,
}: {
  initialNodes: ListNode[];
  service: GroupedListService;
  config: GroupedListConfig;
}) {
  const theme = useTreeTheme();
  const { treeData, busy, status, error, refresh, save, setStatus } = useGroupedList(
    initialNodes,
    service,
    config.label,
  );
  const [typeFilter, setTypeFilter] = useState<'all' | '0' | '1'>('all');
  const matchesType = useCallback(
    (node: LeafNode) => (node.data as ListNode)[config.typeField] === typeFilter,
    [config.typeField, typeFilter],
  );
  const getLeafCategory = useCallback(
    (node: LeafNode) => {
      const category = (node.data as ListNode)[config.typeField];
      return category === '0' || category === '1' ? category : 'unknown';
    },
    [config.typeField],
  );
  const clearFilter = useCallback(() => setTypeFilter('all'), []);
  const renderLeaf = useCallback<NonNullable<VirtualTreeProps['renderLeafContent']>>(
    (node, context) => <GroupedLeaf node={node} config={config} {...context} />,
    [config],
  );
  const onSelect = useCallback<NonNullable<VirtualTreeProps['onSelect']>>(
    (_, node) => setStatus(node ? `已选择${config.label}：${node.title}` : ''),
    [config.label, setStatus],
  );
  const onCancel = useCallback(() => setStatus('已取消分组编辑'), [setStatus]);
  return (
    <main className="parameter-demo" style={theme} aria-busy={busy}>
      {error && <Alert type="error" showIcon title={error} />}
      <VirtualTree
        className="application-tree"
        defaultTreeData={treeData}
        treeData={treeData}
        disabled={busy}
        rowHeight={56}
        emptyText={`暂无${config.label}`}
        newGroupTitle={`${config.label}分组`}
        searchPlaceholder={`请输入${config.label}名称或描述`}
        getSearchText={getSearchText}
        getLeafCategory={getLeafCategory}
        filterLeaf={typeFilter === 'all' ? undefined : matchesType}
        onClearFilter={clearFilter}
        renderToolbar={(context) => (
          <GroupedListToolbar
            context={context}
            config={config}
            busy={busy}
            refresh={refresh}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
          />
        )}
        renderBranchContent={renderBranch}
        renderLeafContent={renderLeaf}
        getLeafMenuItems={config.getLeafMenuItems}
        onSelect={onSelect}
        onSave={save}
        onCancel={onCancel}
      />
      <footer className="list-footer" role="status">
        <span aria-hidden="true" className="i-lucide-circle-check" />
        {status || `选择${config.label}，查看参数配置`}
      </footer>
    </main>
  );
}
