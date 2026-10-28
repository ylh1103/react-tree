/**
 * 应用页面私有的列表配置适配器，定义应用类型标签并绑定列表服务。
 * 分组编辑等交互由复用 GroupedList 提供，系统应用使用路由链接并由 URL 控制选中。
 */
import { GroupedList } from '@/components/GroupedList';
import type { GroupedListConfig } from '@/components/GroupedList/types';
import { applicationService } from '@/queries/applications';
import type { GroupedListService } from '@/components/GroupedList/types';
import { applicationListId } from '@/queries/groupedList';
import { applicationPath } from '@/router/paths';

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

export default function ApplicationList({
  systemName,
  service = applicationService,
  selectedAppName,
  embedded = false,
}: {
  systemName?: string;
  service?: GroupedListService;
  selectedAppName?: string | null;
  embedded?: boolean;
} = {}) {
  return (
    <GroupedList
      listId={systemName === undefined ? 'applications' : applicationListId(systemName)}
      service={service}
      config={config}
      selectedKey={selectedAppName}
      getNodeTo={
        systemName === undefined ? undefined : (node) => applicationPath(systemName, node.key)
      }
      embedded={embedded}
    />
  );
}
