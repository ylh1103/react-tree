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
  selectedKey: string | null;
  locateSelected: () => void;
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
  renderToolbar?: (context: TreeToolbarContext) => React.ReactNode;
  defaultTreeData: TreeNode[];
  renderLeafContent?: (node: LeafNode, ctx: { selected: boolean; searchQuery: string; isDragActive: boolean }) => React.ReactNode;
  renderBranchContent?: (node: BranchNode, ctx: { expanded: boolean; isDragActive: boolean }) => React.ReactNode;
  onSelect?: (key: string | null, node: LeafNode | null) => void;
  onSave?: (tree: TreeNode[]) => void;
  onCancel?: () => void;
  height?: number;
  rowHeight?: number;
}
