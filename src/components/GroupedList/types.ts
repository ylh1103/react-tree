/**
 * 分组列表的组件与交互类型约定，区分后端节点、UI 目录、UI 叶子和可见行。
 * 自定义节点操作返回 false 表示取消或无需刷新；其他成功结果触发刷新，抛错统一展示。
 */
import type { ReactNode } from 'react';

export interface ListNode {
  key: string;
  title: string;
  desc?: string;
  appType?: '0' | '1';
  maintType?: '0' | '1';
  // 存在 children 即为分组，空数组表示空分组；叶子不带 children。
  children?: ListNode[];
}

/** 业务侧负责弹窗、校验和接口；取消返回 false，成功后列表自动刷新。 */
export type ListNodeAction = (node: ListNode) => void | false | Promise<void | false>;

/** 自定义菜单项；key 在同一菜单内必须唯一。 */
export interface ListNodeMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: ListNodeAction;
}

/** 仅自定义叶子业务菜单，始终保留快速移动；未配置、返回 undefined 或空数组时仅保留移动。 */
export type ListNodeMenuItems =
  readonly ListNodeMenuItem[] | ((node: ListNode) => readonly ListNodeMenuItem[] | undefined);

export interface ListNodeActions {
  menuItems?: ListNodeMenuItems;
  onSettings?: ListNodeAction;
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
