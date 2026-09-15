import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Tooltip } from 'antd';
import { useLoaderData } from 'react-router';
import { useTreeTheme } from '../components/VirtualTree/useTreeTheme';
import { VirtualTree } from '../components/VirtualTree';
import type { BranchNode, LeafNode, TreeNode } from '../components/VirtualTree';
import { highlightText } from '../components/VirtualTree/utils';
import { fromTreeData, toTreeData } from '../features/grouped-list/model';
import type { ListNode } from '../features/grouped-list/model';
import { applicationService, applicationLoader } from '../features/applications/api';

function getSearchText(node: LeafNode) {
  return `${node.title} ${(node.data as ListNode).desc ?? ''}`;
}

function Highlight({ text, query }: { text: string; query: string }) {
  return highlightText(text, query).map((part, index) =>
    part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
  );
}

function ApplicationLeaf({
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
  const description = (node.data as ListNode).desc ?? '';

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
      <span className="application-content" tabIndex={showTooltip ? 0 : undefined}>
        <span aria-hidden="true" className="application-gear i-lucide-settings" />
        <span className="application-copy">
          <span ref={nameRef} className="application-name">
            <Highlight text={node.title} query={searchQuery} />
          </span>
          <span ref={descriptionRef} className="application-description">
            <Highlight text={description} query={searchQuery} />
          </span>
        </span>
      </span>
    </Tooltip>
  );
}

function ApplicationBranch({
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

export default function ApplicationListPage() {
  const initialNodes = useLoaderData<typeof applicationLoader>();
  console.log('🚀 ~ ApplicationListPage ~ initialNodes:', initialNodes);
  const treeTheme = useTreeTheme();
  const [nodes, setNodes] = useState(initialNodes);
  const treeData = useMemo(() => toTreeData(nodes), [nodes]);
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
    setStatus(`正在刷新应用列表…`);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const next = await applicationService.load(controller.signal);
      if (controller.signal.aborted) return;
      setNodes(next);
      setRevision((value) => value + 1);
      setStatus(`应用列表已刷新`);
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
      await applicationService.save(fromTreeData(tree));
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
        emptyText={`暂无应用`}
        newGroupTitle={`应用分组`}
        searchPlaceholder={`请输入应用名称或描述`}
        getSearchText={getSearchText}
        renderToolbar={({
          selectedKey,
          locateSelected,
          isEditing,
          isSaving,
          enterEdit,
          addBranch,
          save,
          cancel,
        }) => (
          <>
            <header className="application-toolbar">
              <h2>应用列表</h2>
              <Tooltip title={`按应用名称或描述搜索，点击分组展开应用`}>
                <span tabIndex={0} aria-label={`应用列表说明`} className="info-icon">
                  <span aria-hidden="true" className="i-lucide-info" />
                </span>
              </Tooltip>
              <div className="toolbar-actions">
                <Tooltip title={selectedKey ? `定位选中应用` : `请先选择一个应用`}>
                  <Button
                    size="small"
                    aria-label={`定位选中应用`}
                    disabled={!selectedKey || busy}
                    onClick={locateSelected}
                    icon={<span aria-hidden="true" className="i-lucide-locate-fixed" />}
                  />
                </Tooltip>
                <Tooltip title={`刷新应用列表`}>
                  <Button
                    size="small"
                    aria-label={`刷新应用列表`}
                    disabled={isEditing || busy}
                    loading={busy && !isSaving}
                    onClick={refresh}
                    icon={<span aria-hidden="true" className="i-lucide-refresh-cw" />}
                  />
                </Tooltip>
                <Tooltip title={isEditing ? '正在编辑分组' : '打开分组编辑模式'}>
                  <Button
                    size="small"
                    aria-label="打开分组编辑模式"
                    aria-pressed={isEditing}
                    onClick={enterEdit}
                    disabled={isEditing || busy}
                    icon={<span aria-hidden="true" className="i-lucide-list" />}
                  />
                </Tooltip>
              </div>
            </header>
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
          <ApplicationBranch node={node} expanded={expanded} isDragActive={isDragActive} />
        )}
        renderLeafContent={(node, { searchQuery, isDragActive }) => (
          <ApplicationLeaf node={node} searchQuery={searchQuery} isDragActive={isDragActive} />
        )}
        onSelect={(_, node) => setStatus(node ? `已选择应用：${node.title}` : '')}
        onSave={save}
        onCancel={() => setStatus('已取消分组编辑')}
      />
      <footer className="list-footer" role="status">
        <span aria-hidden="true" className="i-lucide-circle-check" />
        {status || `选择应用，查看参数配置`}
      </footer>
    </main>
  );
}
