import { useGroupedList } from '../features/grouped-list/useGroupedList';
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
  getLeafMenuItems: () => [
    {
      key: 'edit-parameter',
      label: '编辑参数',
      icon: <span aria-hidden="true" className="i-lucide-pencil" />,
      disabled: true,
    },
    {
      key: 'delete-parameter',
      label: '删除参数',
      icon: <span aria-hidden="true" className="i-lucide-trash-2" />,
      danger: true,
      disabled: true,
    },
  ],
};

export default function ParameterListPage() {
  const list = useGroupedList(parameterService);
  return <GroupedListPage list={list} config={config} />;
}
