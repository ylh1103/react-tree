import { useReducer } from 'react';
import type { TreeNode, DropPosition } from './types';
import {
  deleteBranchAndPromoteChildren,
  generateKey,
  moveNode,
  moveNodeToDirectory,
  updateNodeTitle,
  areTreesEqual,
} from './utils';

interface State {
  // 最近接收的外部数据引用，用于区分父组件重渲染与真正的数据替换。
  sourceTree: TreeNode[];
  // committed 是取消编辑的回退基线；draft 通过不可变操作承载未保存修改。
  committed: TreeNode[];
  draft: TreeNode[];
  isEditing: boolean;
  isDirty: boolean;
  editingKey: string | null;
}

type Action =
  | { type: 'REPLACE_TREE'; tree: TreeNode[] }
  | { type: 'ENTER_EDIT' }
  | { type: 'ADD_BRANCH'; title?: string }
  | { type: 'START_RENAME'; key: string }
  | { type: 'RENAME_BRANCH'; key: string; title: string }
  | { type: 'CANCEL_RENAME' }
  | { type: 'DELETE_BRANCH'; key: string; destinationKey?: string | null }
  | { type: 'MOVE_NODE'; dragKey: string; overKey: string; position: DropPosition }
  | { type: 'QUICK_MOVE'; key: string; destinationKey: string | null }
  | { type: 'COMMIT_TREE'; tree: TreeNode[] }
  | { type: 'CANCEL' };

function reducer(state: State, action: Action): State {
  const next = applyAction(state, action);
  if (next.draft === state.draft && next.committed === state.committed) return next;
  // 按最终内容判断脏状态，允许用户将节点移回原位后恢复为无修改。
  return { ...next, isDirty: !areTreesEqual(next.draft, next.committed) };
}

function applyAction(state: State, action: Action): State {
  switch (action.type) {
    case 'REPLACE_TREE':
      return {
        ...state,
        sourceTree: action.tree,
        committed: action.tree,
        draft: action.tree,
        isDirty: false,
        editingKey: null,
      };
    case 'ENTER_EDIT':
      return {
        ...state,
        isEditing: true,
        draft: state.committed,
        isDirty: false,
        editingKey: null,
      };

    case 'ADD_BRANCH': {
      const key = generateKey('branch');
      const newBranch: TreeNode = {
        key,
        type: 'branch',
        title: action.title ?? '新分组',
        children: [],
      };
      return {
        ...state,
        draft: [newBranch, ...state.draft],
        editingKey: key,
      };
    }

    case 'START_RENAME':
      return { ...state, editingKey: action.key };

    case 'RENAME_BRANCH': {
      const title = action.title.trim();
      if (!title) return state;
      return {
        ...state,
        draft: updateNodeTitle(state.draft, action.key, title),
        editingKey: null,
      };
    }

    case 'CANCEL_RENAME':
      return { ...state, editingKey: null };

    case 'DELETE_BRANCH': {
      const draft = deleteBranchAndPromoteChildren(state.draft, action.key, action.destinationKey);
      if (draft === state.draft) return state;
      return {
        ...state,
        draft,
      };
    }

    case 'QUICK_MOVE': {
      if (!state.isEditing) return state;
      const draft = moveNodeToDirectory(state.draft, action.key, action.destinationKey);
      if (draft === state.draft) return state;
      return { ...state, draft };
    }

    case 'MOVE_NODE': {
      if (!state.isEditing) return state;
      const draft = moveNode(state.draft, action.dragKey, action.overKey, action.position);
      return draft === state.draft ? state : { ...state, draft };
    }

    case 'COMMIT_TREE':
      return {
        ...state,
        committed: action.tree,
        draft: action.tree,
        isEditing: false,
        isDirty: false,
        editingKey: null,
      };

    case 'CANCEL':
      return {
        ...state,
        draft: state.committed,
        isEditing: false,
        isDirty: false,
        editingKey: null,
      };

    default:
      return state;
  }
}

export function useTreeReducer(defaultTreeData: TreeNode[], treeData?: TreeNode[]) {
  const [state, dispatch] = useReducer(reducer, {
    sourceTree: treeData ?? defaultTreeData,
    committed: treeData ?? defaultTreeData,
    draft: treeData ?? defaultTreeData,
    isEditing: false,
    isDirty: false,
    editingKey: null,
  });

  // 在同一组件的下一次渲染前更新数据，避免 effect 带来一帧过时内容。
  // 编辑态保留草稿；取消或提交后再接收外部数据。
  if (treeData && treeData !== state.sourceTree && !state.isEditing) {
    dispatch({ type: 'REPLACE_TREE', tree: treeData });
  }
  return { state, dispatch };
}
