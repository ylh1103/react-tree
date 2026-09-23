export interface ListNode {
  key: string;
  title: string;
  desc?: string;
  appType?: '0' | '1';
  maintType?: '0' | '1';
  // 存在 children 即为分组，空数组表示空分组；叶子不带 children。
  children?: ListNode[];
}

export interface ApplicationItem {
  appName: string;
  appDesc: string;
  appType: '0' | '1';
}
export interface ParameterItem {
  paramTypeName: string;
  paramTypeDesc: string;
  maintType: '0' | '1';
}

/** 业务侧负责弹窗、校验和接口；取消返回 false，成功后列表自动刷新。 */
export type ListNodeAction = (node: ListNode) => Promise<void | false>;

export interface ListNodeActions {
  onSettings?: ListNodeAction;
  onDelete?: ListNodeAction;
}

export interface GroupedListConfig {
  label: '参数' | '应用';
  typeField: 'appType' | 'maintType';
  filterLabel: string;
  options: { label: string; value: 'all' | '0' | '1' }[];
  types: Record<'0' | '1', { label: string; shortLabel: string; color: string }>;
  badgeType: '0' | '1';
}

export interface GroupedListService {
  load: (signal?: AbortSignal) => Promise<ListNode[]>;
  save: (nodes: ListNode[]) => Promise<void>;
}

export type NodeType = 'leaf' | 'branch';

interface BaseNode {
  key: string;
  title: string;
}

export interface LeafNode extends BaseNode {
  type: 'leaf';
  data: Omit<ListNode, 'children'>;
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
