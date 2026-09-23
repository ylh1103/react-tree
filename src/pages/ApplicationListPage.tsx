import { GroupedListPage } from '../features/grouped-list/GroupedListPage';
import type { GroupedListConfig } from '../features/grouped-list/types';
import { applicationService } from '../features/applications/api';

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

export default function ApplicationListPage() {
  return <GroupedListPage service={applicationService} config={config} />;
}
