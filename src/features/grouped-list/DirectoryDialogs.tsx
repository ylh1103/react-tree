import type { buildDirectoryDestinations } from './directoryDestinations';
import { TreeSelect } from 'antd';
import type { TreeNode } from './types';

export function MoveDirectoryContent({
  node,
  treeData,
  value,
  onChange,
  currentPath,
}: {
  node: TreeNode;
  treeData: ReturnType<typeof buildDirectoryDestinations>['treeData'];
  value: number;
  onChange: (value: number) => void;
  currentPath: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 pt-3 text-sm">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="break-words font-medium text-gray-900 [overflow-wrap:anywhere]">
          <span
            aria-hidden="true"
            className={node.type === 'branch' ? 'i-lucide-folder' : 'i-lucide-file'}
          />{' '}
          {node.title}
        </div>
        <div className="mt-2 max-h-20 overflow-y-auto break-words text-xs text-gray-500 [overflow-wrap:anywhere]">
          当前位置：{currentPath}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-900">移动到</span>
        <TreeSelect
          aria-label="移动到"
          className="w-full"
          size="large"
          treeData={treeData}
          defaultValue={value}
          treeDefaultExpandedKeys={[0]}
          showSearch
          treeNodeFilterProp="title"
          onChange={onChange}
        />
        <p className="m-0 text-xs leading-5 text-gray-500">
          移动到所选位置的末尾。分组内的所有内容将一起移动。
        </p>
      </div>
    </div>
  );
}

export function DeleteDirectoryContent({
  node,
  treeData,
  value,
  onChange,
  directoryPath,
}: {
  node: TreeNode;
  treeData: ReturnType<typeof buildDirectoryDestinations>['treeData'];
  value: number;
  onChange: (value: number) => void;
  directoryPath: string[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-5 pt-3 text-sm">
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg text-gray-500">
          <span aria-hidden="true" className="i-lucide-folder" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs text-gray-500">即将删除的分组</div>
          <div className="break-words font-medium text-gray-900 [overflow-wrap:anywhere]">
            {node.title || '未命名分组'}
          </div>
          <div className="mt-2 max-h-20 overflow-y-auto break-words text-xs leading-5 text-gray-500 [overflow-wrap:anywhere]">
            <span className="sr-only">分组路径：</span>
            根节点 / {directoryPath.join(' / ')}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-gray-900">子节点移动到</span>
          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
            {node.type === 'branch' ? node.children.length : 0} 个直接子节点
          </span>
        </div>
        <TreeSelect
          aria-label="子节点移动到"
          className="w-full"
          size="large"
          treeData={treeData}
          defaultValue={value}
          treeDefaultExpandedKeys={[0]}
          showSearch
          treeNodeFilterProp="title"
          onChange={onChange}
        />
        <p className="m-0 text-xs leading-5 text-gray-500">
          默认选择父分组，可搜索并选择其他分组或根节点。
        </p>
      </div>

      <div className="rounded-md border-l-2 border-amber-400 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
        仅删除该分组，子节点及其内容会保留，并按原顺序追加到目标末尾。
      </div>
    </div>
  );
}
