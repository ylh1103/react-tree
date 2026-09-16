import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Segmented, Tooltip } from 'antd';
import { useLoaderData } from 'react-router';
import { useTreeTheme } from '../components/VirtualTree/useTreeTheme';
import { VirtualTree } from '../components/VirtualTree';
import type { BranchNode, LeafNode, TreeNode } from '../components/VirtualTree';
import { highlightText } from '../components/VirtualTree/utils';
import { fromTreeData, toTreeData } from '../features/grouped-list/model';
import type { ListNode } from '../features/grouped-list/model';
import { parameterService, parameterLoader } from '../features/parameters/api';

function getSearchText(node: LeafNode) {
  return `${node.title} ${(node.data as ListNode).desc ?? ''}`;
}

function Highlight({ text, query }: { text: string; query: string }) {
  return highlightText(text, query).map((part, index) =>
    part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
  );
}

function ParameterLeaf({
  node,
  searchQuery,
  isDragActive,
}: {
  node: LeafNode;
  searchQuery: string;
  isDragActive: boolean;
}) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const data = node.data as ListNode;
  const description = data.desc ?? '';
  const kind = data.maintType;
  const typeLabel = kind === '0' ? '增量维护' : kind === '1' ? '全量维护' : '未标注';
  const typeColor = kind === '0' ? 'cyan' : kind === '1' ? 'orange' : undefined;
  const typeShortLabel = kind === '0' ? '增' : kind === '1' ? '全' : '?';

  useEffect(() => {
    const measure = () => {
      setIsOverflowing(
        [nameRef.current, descriptionRef.current].some(
          (element) => element !== null && element.scrollWidth > element.clientWidth,
        ),
      );
    };
    // 内容、搜索词和可用宽度都可能改变省略状态；仅观察已渲染的虚拟节点。
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (nameRef.current) observer.observe(nameRef.current);
    if (descriptionRef.current) observer.observe(descriptionRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [node.title, description, searchQuery]);

  const showTooltip = isOverflowing && !isDragActive;
  return (
    <Tooltip
      trigger={['hover', 'focus']}
      placement="right"
      open={showTooltip ? undefined : false}
      title={
        showTooltip ? (
          <div className="application-search-tooltip">
            <div className="tooltip-name">
              <Highlight text={node.title} query={searchQuery} />
            </div>
            {description && (
              <div className="tooltip-description">
                <Highlight text={description} query={searchQuery} />
              </div>
            )}
          </div>
        ) : null
      }
    >
      <span
        className="application-content"
        data-leaf-type-color={typeColor}
        tabIndex={showTooltip ? 0 : undefined}
      >
        <span aria-hidden="true" className="application-gear i-lucide-settings" />
        <span className="application-copy">
          <span className="application-title-line">
            <span ref={nameRef} className="application-name">
              <Highlight text={node.title} query={searchQuery} />
            </span>
            {kind === '0' && (
              <span
                className="leaf-type-badge"
                data-color={typeColor}
                title={typeLabel}
                role="img"
                aria-label={typeLabel}
              >
                {typeShortLabel}
              </span>
            )}
          </span>
          <span ref={descriptionRef} className="application-description">
            <Highlight text={description} query={searchQuery} />
          </span>
        </span>
      </span>
    </Tooltip>
  );
}

function ParameterBranch({
  node,
  expanded,
  isDragActive,
}: {
  node: BranchNode;
  expanded: boolean;
  isDragActive: boolean;
}) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = nameRef.current;
    if (!element) return;
    const measure = () => setIsOverflowing(element.scrollWidth > element.clientWidth);
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [node.title]);

  const showTooltip = isOverflowing && !isDragActive;
  return (
    <span className="group-content">
      <span aria-hidden="true" className={expanded ? 'i-lucide-folder-open' : 'i-lucide-folder'} />
      <Tooltip
        trigger={['hover', 'focus']}
        placement="right"
        open={showTooltip ? undefined : false}
        title={showTooltip ? <div className="application-search-tooltip">{node.title}</div> : null}
      >
        <span ref={nameRef} className="group-name" tabIndex={showTooltip ? 0 : undefined}>
          {node.title}
        </span>
      </Tooltip>
      <span className="group-count">{node.children.length}</span>
    </span>
  );
}

export default function ParameterListPage() {
  const initialNodes = useLoaderData<typeof parameterLoader>();
  const treeTheme = useTreeTheme();
  const [nodes, setNodes] = useState(initialNodes);
  const treeData = useMemo(() => toTreeData(nodes), [nodes]);
  const [typeFilter, setTypeFilter] = useState<'all' | '0' | '1'>('all');
  const matchesType = useCallback(
    (node: LeafNode) => (node.data as ListNode).maintType === typeFilter,
    [typeFilter],
  );
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => requestRef.current?.abort(), []);

  async function refresh() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setStatus(`正在刷新参数列表…`);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const next = await parameterService.load(controller.signal);
      if (controller.signal.aborted) return;
      setNodes(next);
      setRevision((value) => value + 1);
      setStatus(`参数列表已刷新`);
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : '刷新失败，请重试');
        setStatus('刷新失败，已保留当前列表');
      }
    } finally {
      busyRef.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function save(tree: TreeNode[]) {
    busyRef.current = true;
    setBusy(true);
    setError('');
    setStatus('正在保存分组…');
    try {
      await parameterService.save(fromTreeData(tree));
      setStatus('分组更改已保存');
    } catch (reason) {
      setStatus('保存失败，编辑内容已保留，请重试');
      throw reason;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="parameter-demo" style={treeTheme} aria-busy={busy}>
      {error && <Alert type="error" showIcon title={error} />}
      <VirtualTree
        key={revision}
        className="application-tree"
        defaultTreeData={treeData}
        rowHeight={56}
        emptyText={`暂无参数`}
        newGroupTitle={`参数分组`}
        searchPlaceholder={`请输入参数名称或描述`}
        getSearchText={getSearchText}
        filterLeaf={typeFilter === 'all' ? undefined : matchesType}
        onClearFilter={() => setTypeFilter('all')}
        renderToolbar={({
          totalLeafCount,
          filteredLeafCount,
          isFiltered,
          selectedKey,
          locateSelected,
          allExpanded,
          hasGroups,
          toggleAllExpanded,
          isEditing,
          isSaving,
          enterEdit,
          addBranch,
          save,
          cancel,
        }) => (
          <>
            <header className="application-toolbar">
              <h2 className="list-heading">
                <span>参数列表</span>
                <Tooltip
                  title={
                    isFiltered
                      ? `当前匹配 ${filteredLeafCount} 个，共 ${totalLeafCount} 个参数`
                      : `共 ${totalLeafCount} 个参数`
                  }
                >
                  <span
                    className="list-heading-count"
                    role="status"
                    aria-label={
                      isFiltered
                        ? `当前匹配 ${filteredLeafCount} 个，共 ${totalLeafCount} 个参数`
                        : `共 ${totalLeafCount} 个参数`
                    }
                  >
                    {isFiltered ? `${filteredLeafCount} / ${totalLeafCount}` : totalLeafCount}
                  </span>
                </Tooltip>
              </h2>
              <div className="toolbar-actions">
                <Tooltip title={selectedKey ? `定位选中参数` : `请先选择一个参数`}>
                  <Button
                    size="small"
                    aria-label={`定位选中参数`}
                    disabled={!selectedKey || busy}
                    onClick={locateSelected}
                    icon={<span aria-hidden="true" className="i-lucide-locate-fixed" />}
                  />
                </Tooltip>
                <Tooltip title={allExpanded ? '全部折叠' : '全部展开'}>
                  <Button
                    size="small"
                    aria-label={allExpanded ? '全部折叠' : '全部展开'}
                    disabled={!hasGroups || busy}
                    onClick={toggleAllExpanded}
                    icon={
                      <span
                        aria-hidden="true"
                        className={
                          allExpanded ? 'i-lucide:chevrons-down-up' : 'i-lucide:chevrons-up-down'
                        }
                      />
                    }
                  />
                </Tooltip>
                <Tooltip title={`刷新参数列表`}>
                  <Button
                    size="small"
                    aria-label={`刷新参数列表`}
                    disabled={isEditing || busy}
                    loading={busy && !isSaving}
                    onClick={refresh}
                    icon={<span aria-hidden="true" className="i-lucide-refresh-cw" />}
                  />
                </Tooltip>
                <Tooltip title={isEditing ? '正在编辑分组' : '打开分组编辑模式'}>
                  <Button
                    size="small"
                    type={isEditing ? 'primary' : 'default'}
                    aria-label="打开分组编辑模式"
                    aria-pressed={isEditing}
                    onClick={() => {
                      if (!isEditing) enterEdit();
                    }}
                    disabled={busy}
                    icon={
                      <span
                        aria-hidden="true"
                        className="i-lucide:list-chevrons-up-down rotate-180"
                      />
                    }
                  />
                </Tooltip>
              </div>
            </header>
            <div className="list-type-filter" role="group" aria-label="维护方式筛选">
              <Segmented<'all' | '0' | '1'>
                block
                size="small"
                value={typeFilter}
                onChange={setTypeFilter}
                disabled={busy}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '全量维护', value: '1' },
                  { label: '增量维护', value: '0' },
                ]}
              />
            </div>
            {isEditing && (
              <div className="editing-toolbar">
                <Button size="small" onClick={addBranch} disabled={busy}>
                  新增分组
                </Button>
                <Button size="small" type="primary" onClick={save} loading={isSaving}>
                  保存
                </Button>
                <Button size="small" onClick={cancel} disabled={busy}>
                  取消
                </Button>
              </div>
            )}
          </>
        )}
        renderBranchContent={(node, { expanded, isDragActive }) => (
          <ParameterBranch node={node} expanded={expanded} isDragActive={isDragActive} />
        )}
        renderLeafContent={(node, { searchQuery, isDragActive }) => (
          <ParameterLeaf node={node} searchQuery={searchQuery} isDragActive={isDragActive} />
        )}
        getLeafMenuItems={() => [
          // 后续接入业务编辑/删除时启用，并通过回调参数 node 获取参数数据。
          {
            key: 'edit-parameter',
            label: '编辑参数',
            icon: <span aria-hidden="true" className="i-lucide-pencil" />,
            disabled: true,
          },
          {
            key: 'delete-parameter',
            label: '删除参数',
            icon: <span aria-hidden="true" className="i-lucide-trash-2" />,
            danger: true,
            disabled: true,
          },
        ]}
        onSelect={(_, node) => setStatus(node ? `已选择参数：${node.title}` : '')}
        onSave={save}
        onCancel={() => setStatus('已取消分组编辑')}
      />
      <footer className="list-footer" role="status">
        <span aria-hidden="true" className="i-lucide-circle-check" />
        {status || `选择参数，查看参数配置`}
      </footer>
    </main>
  );
}
