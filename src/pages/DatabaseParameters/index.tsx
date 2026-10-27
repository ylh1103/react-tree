/**
 * 数据库参数页面：按 URL 选择参数类型，组装 PC 分栏及查询反馈。
 * 查询和详情属于本页，不再借助应用/数据库分支混合的工作区。
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { Alert, Button, Empty, Spin } from 'antd';
import { parameterTypesOptions } from '@/queries/systems';
import { useSystemWorkspace } from '@/contexts/SystemContext';
import { SplitPane } from '@/components/SplitPane';
import { CollectionSkeleton } from '@/components/CollectionSkeleton';
import { databasePath } from '@/router/paths';
import { ParameterTypeList } from './components/ParameterTypeList';
import { ParameterTypeDetails } from './components/ParameterTypeDetails';

export default function DatabaseParametersPage() {
  const { system } = useSystemWorkspace();
  const { paramTypeName } = useParams();
  const navigate = useNavigate();
  const query = useQuery(parameterTypesOptions(system.systemName));
  // 业务分栏骨架随页面下载；已有类型清单时刷新不替换工作区。
  if (query.isPending)
    return (
      <CollectionSkeleton
        storageKey="parameter-management:split-pane:database:v1"
        defaultWidth={300}
        title={paramTypeName || '数据库参数'}
      />
    );
  const items = query.data ?? [];
  const selected = items.find((item) => item.paramTypeName === paramTypeName);
  const checkingTarget = Boolean(paramTypeName && !selected && query.isFetching);
  // 有旧数据时刷新失败仍可阅读；未确认的目标不展示“不存在”，保留重试入口。
  const blockingError = Boolean(
    query.error && (query.data === undefined || (paramTypeName && !selected)),
  );
  return (
    <SplitPane
      storageKey="parameter-management:split-pane:database:v1"
      defaultWidth={300}
      sidebarLabel="参数类型列表"
      title={paramTypeName || '数据库参数'}
      sidebar={
        <ParameterTypeList
          items={items}
          selectedName={paramTypeName}
          refreshing={query.isFetching}
          onRefresh={() => void query.refetch()}
        />
      }
    >
      <div className="p-5">
        {query.error && (
          <Alert
            className="mb-5"
            type={blockingError ? 'error' : 'warning'}
            showIcon
            title={blockingError ? '参数类型加载失败' : '参数类型刷新失败，正在显示已有数据'}
            description={query.error.message}
            action={
              <Button loading={query.isFetching} onClick={() => void query.refetch()}>
                重试
              </Button>
            }
          />
        )}
        {checkingTarget ? (
          <div
            className="grid place-items-center min-h-240px"
            role="status"
            aria-label="正在加载参数类型"
          >
            <Spin />
          </div>
        ) : blockingError ? null : !paramTypeName ? (
          <div className="py-16">
            <Empty description={items.length ? '请从左侧选择参数类型' : '当前系统暂无参数类型'} />
          </div>
        ) : !selected ? (
          <div className="py-16 text-center">
            <Empty description={`参数类型「${paramTypeName}」不存在或已移除`} />
            <Button className="mt-5" onClick={() => navigate(databasePath(system.systemName))}>
              返回参数类型首页
            </Button>
          </div>
        ) : (
          <ParameterTypeDetails item={selected} />
        )}
      </div>
    </SplitPane>
  );
}
