import { useEffect, useRef, useState } from "react";
import { Button, ConfigProvider, Tooltip } from "antd";
import { useTreeTheme } from "./components/VirtualTree/useTreeTheme";
import { VirtualTree } from "./components/VirtualTree";
import type { BranchNode, LeafNode, TreeNode } from "./components/VirtualTree";
import { highlightText } from "./components/VirtualTree/utils";

export interface ApplicationNode {
  key: string;
  title: string;
  desc?: string;
  children?: ApplicationNode[];
}

// children 存在即为分组（包括空分组），原始应用信息保存在 data 中。
function toTreeData(nodes: ApplicationNode[]): TreeNode[] {
  return nodes.map((node) => node.children !== undefined
    ? { key: node.key, title: node.title, type: "branch", children: toTreeData(node.children) }
    : { key: node.key, title: node.title, type: "leaf", data: node });
}

function toApplicationData(nodes: TreeNode[]): ApplicationNode[] {
  return nodes.map((node) => node.type === "branch"
    ? { key: node.key, title: node.title, children: toApplicationData(node.children) }
    : { ...(node.data as ApplicationNode), key: node.key, title: node.title });
}

const initialData: ApplicationNode[] = [
  {
    key: "long-content-search-demo",
    title: "企业级统一应用参数配置与跨环境发布管理平台—长名称测试",
    desc: "用于验证超长应用描述在列表中省略后的搜索效果，包含开发、测试、预发布及生产环境的配置同步与版本管理，末尾搜索关键词：尾部命中LW641",
  },
  { key: "1698807691722", title: "应用分组1", children: [
    { key: "ABS-BFF", desc: "ABS系统的BFF，后续迁移到LW641", title: "ABS-BFF" },
  ] },
  ...["特殊分组", "常用分组", "重要等级", "CICI", "公共模块", "自动化"].map((title, index) => ({
    key: `group-${index}`, title, children: [
      { key: `app-${index}`, title: ["特殊应用", "用户中心", "核心服务", "CICI服务", "公共配置", "自动化任务"][index], desc: `${title}的应用参数配置` },
    ],
  })),
  { key: "zhuagtai3", title: "zhuagtai3", desc: "ParamManagement发布单元" },
  { key: "applications", title: "应用分组", children: [] },
  { key: "20260723", title: "20260723", desc: "核心账务批量" },
];

function getSearchText(node: LeafNode) {
  return `${node.title} ${(node.data as ApplicationNode).desc ?? ""}`;
}

function Highlight({ text, query }: { text: string; query: string }) {
  return highlightText(text, query).map((part, index) => part.match
    ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>);
}

function ApplicationLeaf({ node, searchQuery, isDragActive }: { node: LeafNode; searchQuery: string; isDragActive: boolean }) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const description = (node.data as ApplicationNode).desc ?? "";

  useEffect(() => {
    const measure = () => {
      setIsOverflowing([nameRef.current, descriptionRef.current].some(
        (element) => element !== null && element.scrollWidth > element.clientWidth,
      ));
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
      trigger={["hover", "focus"]}
      placement="right"
      open={showTooltip ? undefined : false}
      title={showTooltip ? (
        <div className="application-search-tooltip">
          <div className="tooltip-name"><Highlight text={node.title} query={searchQuery} /></div>
          {description && <div className="tooltip-description"><Highlight text={description} query={searchQuery} /></div>}
        </div>
      ) : null}
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

function ApplicationBranch({ node, expanded, isDragActive }: { node: BranchNode; expanded: boolean; isDragActive: boolean }) {
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
      <span aria-hidden="true" className={expanded ? "i-lucide-folder-open" : "i-lucide-folder"} />
      <Tooltip
        trigger={["hover", "focus"]}
        placement="right"
        open={showTooltip ? undefined : false}
        title={showTooltip ? <div className="application-search-tooltip">{node.title}</div> : null}
      >
        <span ref={nameRef} className="group-name" tabIndex={showTooltip ? 0 : undefined}>{node.title}</span>
      </Tooltip>
      <span className="group-count">{node.children.length}</span>
    </span>
  );
}

function Application() {
  const treeTheme = useTreeTheme();
  const [savedData, setSavedData] = useState(initialData);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("");
  return (
    <>
      <main className="parameter-demo" style={treeTheme}>
        <div className="brand"><span aria-hidden="true" className="brand-icon i-lucide-sliders-horizontal" /><div><h1>灵动参数管家</h1><p>应用参数管理</p></div></div>
        <VirtualTree
          key={revision}
          className="application-tree"
          defaultTreeData={toTreeData(savedData)}
          rowHeight={56}
          searchPlaceholder="请输入应用名/应用名描述"
          getSearchText={getSearchText}
          renderToolbar={({ selectedKey, locateSelected, isEditing, enterEdit, addBranch, save, cancel }) => (
            <>
              <header className="application-toolbar">
                <h2>应用列表</h2>
                <Tooltip title="按应用名称或描述搜索，点击分组展开应用">
                  <span tabIndex={0} aria-label="应用列表说明" className="info-icon"><span aria-hidden="true" className="i-lucide-info" /></span>
                </Tooltip>
                <div className="toolbar-actions">
                  <Tooltip title={selectedKey ? "定位选中应用" : "请先选择一个应用"}>
                    <Button
                      size="small"
                      aria-label="定位选中应用"
                      disabled={!selectedKey}
                      onClick={locateSelected}
                      icon={<span aria-hidden="true" className="i-lucide-locate-fixed" />}
                    />
                  </Tooltip>
                  <Tooltip title="刷新应用列表">
                    <Button size="small" aria-label="刷新应用列表" disabled={isEditing} onClick={() => { setRevision((value) => value + 1); setStatus("应用列表已刷新"); }} icon={<span aria-hidden="true" className="i-lucide-refresh-cw" />} />
                  </Tooltip>
                  <Tooltip title={isEditing ? "正在编辑分组" : "打开分组编辑模式"}>
                    <Button size="small" aria-label="打开分组编辑模式" aria-pressed={isEditing} onClick={enterEdit} disabled={isEditing} icon={<span aria-hidden="true" className="i-lucide-list" />} />
                  </Tooltip>
                </div>
              </header>
              {isEditing && <div className="editing-toolbar">
                <Button size="small" onClick={addBranch}>新增分组</Button>
                <Button size="small" type="primary" onClick={save}>保存</Button>
                <Button size="small" onClick={cancel}>取消</Button>
              </div>}
            </>
          )}
          renderBranchContent={(node, { expanded, isDragActive }) => (
            <ApplicationBranch node={node} expanded={expanded} isDragActive={isDragActive} />
          )}
          renderLeafContent={(node, { searchQuery, isDragActive }) => (
            <ApplicationLeaf node={node} searchQuery={searchQuery} isDragActive={isDragActive} />
          )}
          onSelect={(_, node) => setStatus(node ? `已选择应用：${node.title}` : "")}
          onSave={(tree) => { setSavedData(toApplicationData(tree)); setStatus("分组更改已保存"); }}
          onCancel={() => setStatus("已取消分组编辑")}
        />
        <footer className="list-footer" role="status"><span aria-hidden="true" className="i-lucide-circle-check" />{status || "选择应用，查看参数配置"}</footer>
      </main>
    </>
  );
}


export default function App() {
  return <ConfigProvider theme={{ token: { borderRadius: 6, fontSize: 14 } }}><Application /></ConfigProvider>;
}

