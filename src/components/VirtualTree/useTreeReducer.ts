import { useReducer } from 'react';
import type { TreeNode, DropPosition } from './types';
import {
  deleteBranchAndPromoteChildren,
  generateKey,
  insertNode,
  moveNodeToDirectory,
  isDescendant,
  removeNode,
  updateNodeTitle,
  areTreesEqual,
} from './utils';

interface State {
  committed: TreeNode[];
  draft: TreeNode[];
  isEditing: boolean;
  isDirty: boolean;
  editingKey: string | null;
}

type Action =
  | { type: 'ENTER_EDIT' }
  | { type: 'ADD_BRANCH'; title?: string }
  | { type: 'START_RENAME'; key: string }
  | { type: 'RENAME_BRANCH'; key: string; title: string }
  | { type: 'CANCEL_RENAME' }
  | { type: 'DELETE_BRANCH'; key: string; destinationKey?: string | null }
  | { type: 'MOVE_NODE'; dragKey: string; overKey: string; position: DropPosition }
  | { type: 'QUICK_MOVE'; key: string; destinationKey: string | null }
  | { type: 'COMMIT_TREE'; tree: TreeNode[] }
  | { type: 'SAVE' }
  | { type: 'CANCEL' };

function reducer(state: State, action: Action): State {
  const next = applyAction(state, action);
  if (next.draft === state.draft && next.committed === state.committed) return next;
  return { ...next, isDirty: !areTreesEqual(next.draft, next.committed) };
}

function applyAction(state: State, action: Action): State {
  switch (action.type) {
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
      const { dragKey, overKey, position } = action;
      if (dragKey === overKey) return state;

      if (position === 'inside') {
        const overNode = findNodeInDraft(state.draft, overKey);
        if (!overNode || overNode.type !== 'branch') return state;
      }

      const dragNode = findNodeInDraft(state.draft, dragKey);
      if (!dragNode) return state;

      if (dragNode.type === 'branch') {
        if (dragKey === overKey) return state;
        // 成环校验必须在移除节点之前做：一旦先从树里摘掉 dragNode，
        // 它自己的子树结构就丢了，再判断 overKey 是不是它的子孙就无从判断。
        if (isDescendant(state.draft, dragKey, overKey)) return state;
      }

      const { tree: withoutDrag, removed } = removeNode(state.draft, dragKey);
      if (!removed) return state;

      const newDraft = insertNode(withoutDrag, removed, overKey, position);
      return { ...state, draft: newDraft };
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

    case 'SAVE':
      return {
        ...state,
        committed: state.draft,
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

function findNodeInDraft(tree: TreeNode[], key: string): TreeNode | null {
  for (const node of tree) {
    if (node.key === key) return node;
    if (node.type === 'branch') {
      const found = findNodeInDraft(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

export function useTreeReducer(defaultTreeData: TreeNode[]) {
  const [state, dispatch] = useReducer(reducer, {
    committed: defaultTreeData,
    draft: defaultTreeData,
    isEditing: false,
    isDirty: false,
    editingKey: null,
  });

  return { state, dispatch };
}
