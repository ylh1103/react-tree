import { useMemo } from 'react';
import { Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { GroupedListPage } from '../features/grouped-list/GroupedListPage';
import type { GroupedListConfig, ListNodeMenuItem } from '../features/grouped-list/types';
import { parameterService, deleteParameter } from '../features/parameters/api';

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
  const [modal, contextHolder] = Modal.useModal();
  const menuItems = useMemo<ListNodeMenuItem[]>(
    () => [
      {
        key: 'delete',
        label: '删除参数',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: async (node) => {
          const confirmed = await modal.confirm({
            title: '删除参数',
            content: `确定删除参数「${node.title}」？删除后无法恢复。`,
            okText: '删除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            autoFocusButton: 'cancel',
          });
          if (!confirmed) return false;
          await deleteParameter(node.key);
        },
      },
    ],
    [modal],
  );
  return (
    <>
      {contextHolder}
      <GroupedListPage service={parameterService} config={config} menuItems={menuItems} />
    </>
  );
}
