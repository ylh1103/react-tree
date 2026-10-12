/**
 * 数据库参数页面：查询当前系统的只读类型清单并接入集合工作区。
 * 选中类型来自 URL；请求状态和重试回调交给工作区统一展示。
 */
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { parameterTypesOptions } from '../../queries/systems';
import { useSystemWorkspace } from '../../contexts/SystemContext';
import { CollectionWorkspace } from '../../components/CollectionWorkspace';

export default function DatabaseParametersPage() {
  const { system } = useSystemWorkspace();
  const { paramTypeName } = useParams();
  const query = useQuery(parameterTypesOptions(system.systemName));
  return (
    <CollectionWorkspace
      database
      items={(query.data ?? []).map((item) => ({
        name: item.paramTypeName,
        description: item.description,
      }))}
      selectedName={paramTypeName}
      pending={query.isPending}
      hasData={query.data !== undefined}
      refreshing={query.isFetching}
      error={query.error}
      refresh={() => void query.refetch()}
    />
  );
}
