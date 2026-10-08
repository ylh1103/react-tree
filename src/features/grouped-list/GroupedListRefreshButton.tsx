import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { groupedListKeys, refreshGroupedList, type GroupedListId } from './queries';

/** 独立于列表实例；只订阅请求计数，不订阅五万条列表数据。 */
export function GroupedListRefreshButton({ id }: { id: GroupedListId }) {
  const client = useQueryClient();
  const fetching = useIsFetching({ queryKey: groupedListKeys.list(id), exact: true }) > 0;
  const writing = useIsMutating({ mutationKey: groupedListKeys.write(id) }) > 0;
  const label = id === 'parameters' ? '参数' : '应用';
  return (
    <Button
      icon={<ReloadOutlined aria-hidden="true" />}
      loading={fetching}
      disabled={writing}
      aria-busy={fetching}
      onClick={() => void refreshGroupedList(client, id)}
    >
      刷新{label}列表
    </Button>
  );
}
