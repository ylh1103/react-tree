/**
 * 应用页面私有的列表配置适配器，定义应用类型标签并绑定列表服务。
 * 分组编辑等交互由复用 GroupedList 提供，系统应用使用路由链接并由 URL 控制选中。
 */
import { GroupedList } from '@/components/GroupedList';
import type { GroupedListConfig, GroupedListService } from '@/components/GroupedList/types';
import { applicationListId } from '@/queries/groupedList';
import { applicationPath } from '@/router/workspace/paths';

const config: GroupedListConfig = {
  label: '应用',
  typeField: 'appType',
  filterLabel: '应用类型筛选',
  badgeType: '1',
  options: [
    { label: '全部', value: 'all' },
    { label: '业务应用', value: '0' },
    { label: '公共应用', value: '1' },
  ],
  types: {
    '0': { label: '业务应用', shortLabel: '业', color: 'blue' },
    '1': { label: '公共应用', shortLabel: '公', color: 'purple' },
  },
};

interface ApplicationListProps {
  systemName: string;
  service: GroupedListService;
  selectedAppName: string | null;
  onReselect: () => void;
  onAdd: () => void;
  onEdit: (appName: string) => void;
  onLinkActivate?: () => void;
}

export default function ApplicationList({
  systemName,
  service,
  selectedAppName,
  onReselect,
  onAdd,
  onEdit,
  onLinkActivate,
}: ApplicationListProps) {
  return (
    <GroupedList
      listId={applicationListId(systemName)}
      service={service}
      config={config}
      selectedKey={selectedAppName}
      getNodeTo={(node) => applicationPath(systemName, node.key)}
      onReselect={onReselect}
      onAdd={onAdd}
      onSettings={(node) => onEdit(node.key)}
      onLinkActivate={onLinkActivate}
      embedded
    />
  );
}
