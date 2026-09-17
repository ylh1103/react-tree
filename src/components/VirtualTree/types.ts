import type { MenuProps } from 'antd';

export type NodeType = 'leaf' | 'branch';

interface BaseNode {
  key: string;
  title: string;
}

export interface LeafNode extends BaseNode {
  type: 'leaf';
  data?: unknown;
}

export interface BranchNode extends BaseNode {
  desc?: string;
  type: 'branch';
  children: TreeNode[];
}

export type TreeNode = LeafNode | BranchNode;

export interface FlatNode {
  node: TreeNode;
  depth: number;
  parentKey: string | null;
}

export type DropPosition = 'before' | 'after' | 'inside';

export interface DropIndicator {
  overKey: string;
  position: DropPosition;
}

export interface TreeToolbarContext {
  totalLeafCount: number;
  filteredLeafCount: number;
  totalLeafCountsByCategory: ReadonlyMap<string, number>;
  filteredLeafCountsByCategory: ReadonlyMap<string, number>;
  isFiltered: boolean;
  isSaving: boolean;
  selectedKey: string | null;
  locateSelected: () => void;
  allExpanded: boolean;
  hasGroups: boolean;
  toggleAllExpanded: () => void;
  isEditing: boolean;
  enterEdit: () => void;
  addBranch: () => void;
  save: () => void;
  cancel: () => void;
}

export interface VirtualTreeProps {
  className?: string;
  searchPlaceholder?: string;
  getSearchText?: (node: LeafNode) => string;
  /** 业务侧提供分类标识，统计覆盖完整层级的叶子节点。 */
  getLeafCategory?: (node: LeafNode) => string | undefined;
  filterLeaf?: (node: LeafNode) => boolean;
  onClearFilter?: () => void;
  renderToolbar?: (context: TreeToolbarContext) => React.ReactNode;
  defaultTreeData: TreeNode[];
  /** 已提交的数据更新；编辑期间保留草稿，浏览状态不重置。 */
  treeData?: TreeNode[];
  /** 外部刷新期间阻止修改。 */
  disabled?: boolean;
  /** 追加到快速移动之后的业务叶子菜单，由页面提供处理逻辑。 */
  getLeafMenuItems?: (node: LeafNode) => MenuProps['items'];
  renderLeafContent?: (
    node: LeafNode,
    ctx: { selected: boolean; searchQuery: string; isDragActive: boolean },
  ) => React.ReactNode;
  renderBranchContent?: (
    node: BranchNode,
    ctx: { expanded: boolean; isDragActive: boolean },
  ) => React.ReactNode;
  onSelect?: (key: string | null, node: LeafNode | null) => void;
  onSave?: (tree: TreeNode[]) => void | Promise<void>;
  emptyText?: string;
  newGroupTitle?: string;
  onCancel?: () => void;
  height?: number;
  rowHeight?: number;
}
