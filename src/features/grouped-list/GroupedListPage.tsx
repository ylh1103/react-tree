import { useCallback, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { VirtualTree, type LeafNode, type VirtualTreeProps } from '../../components/VirtualTree';
import { useTreeTheme } from '../../components/VirtualTree/useTreeTheme';
import type { ListNode } from './model';
import type { GroupedListConfig } from './types';
import type { useGroupedList } from './useGroupedList';
import { GroupedLeaf, GroupContent } from './GroupedListContent';
import { GroupedListToolbar } from './GroupedListToolbar';

function getSearchText(node: LeafNode) {
  return `${node.title} ${(node.data as ListNode).desc ?? ''}`;
}
const renderBranch: NonNullable<VirtualTreeProps['renderBranchContent']> = (node, context) => (
  <GroupContent node={node} {...context} />
);

export function GroupedListPage({
  list,
  config,
}: {
  list: ReturnType<typeof useGroupedList>;
  config: GroupedListConfig;
}) {
  const theme = useTreeTheme();
  const { treeData, ready, busy, loading, error, refresh, save } = list;
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
  if (!ready) {
    return (
      <main className="parameter-demo" style={theme} aria-busy={busy}>
        {error ? (
          <Alert
            type="error"
            showIcon
            title="列表加载失败"
            description={error}
            action={
              <Button onClick={refresh} disabled={busy}>
                重试
              </Button>
            }
          />
        ) : (
          <div className="list-loading" aria-label={`正在加载${config.label}列表`}>
            <Spin />
          </div>
        )}
      </main>
    );
  }
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
        onSave={save}
      />
      {loading && (
        <div className="list-loading" aria-label={`正在加载${config.label}列表`}>
          <Spin />
        </div>
      )}
    </main>
  );
}
