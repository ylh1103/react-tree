import { GroupedListPage } from '../features/grouped-list/GroupedListPage';
import type { GroupedListConfig } from '../features/grouped-list/types';
import { parameterService } from '../features/parameters/api';

const config: GroupedListConfig = {
  label: '参数',
  typeField: 'maintType',
  filterLabel: '维护方式筛选',
  badgeType: '0',
  options: [
    { label: '全部', value: 'all' },
    { label: '全量维护', value: '1' },
    { label: '增量维护', value: '0' },
  ],
  types: {
    '0': { label: '增量维护', shortLabel: '增', color: 'cyan' },
    '1': { label: '全量维护', shortLabel: '全', color: 'orange' },
  },
};

export default function ParameterListPage() {
  return <GroupedListPage service={parameterService} config={config} />;
}
