import type { VirtualTreeProps } from '../../components/VirtualTree';

export interface GroupedListConfig {
  label: string;
  typeField: 'appType' | 'maintType';
  filterLabel: string;
  options: { label: string; value: 'all' | '0' | '1' }[];
  types: Record<'0' | '1', { label: string; shortLabel: string; color: string }>;
  badgeType: '0' | '1';
  getLeafMenuItems?: VirtualTreeProps['getLeafMenuItems'];
}
