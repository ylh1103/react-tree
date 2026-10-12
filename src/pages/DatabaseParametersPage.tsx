import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { parameterTypesOptions } from '../features/systems/api';
import { useSystemWorkspace } from '../features/systems/SystemContext';
import { CollectionWorkspace } from './CollectionWorkspace';

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
