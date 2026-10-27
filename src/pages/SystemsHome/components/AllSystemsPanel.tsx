/** 所有系统按后端分页：查询条件和页码进入缓存键，界面直接显示当前页 records 与接口 total。 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Empty, Input } from 'antd';
import { systemPageOptions } from '@/queries/systems';
import type { AllSystemInfo, SystemPageParams } from '@/types/systems';
import { isAccessDenied } from '@/utils/systems';
import RouteStatusPage from '@/pages/RouteStatus';
import { systemCardGrid } from '../model/presentation';
import { SystemCard } from './SystemPresentation';
import SystemsHomeSkeleton from './SystemsHomeSkeleton';
import CollectionPagination from './CollectionPagination';

export default function AllSystemsPanel({
  active,
  onDetails,
}: {
  active: boolean;
  onDetails: (system: AllSystemInfo) => void;
}) {
  const [draft, setDraft] = useState('');
  const [params, setParams] = useState<SystemPageParams>({ pageNum: 1, pageSize: 8, keyword: '' });
  const query = useQuery({ ...systemPageOptions(params), enabled: active });
  function search() {
    const keyword = draft.trim();
    if (keyword === params.keyword && params.pageNum === 1) void query.refetch();
    else setParams({ ...params, pageNum: 1, keyword });
  }
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
  return (
    <section aria-label="所有系统">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          allowClear
          aria-label="筛选所有系统"
          placeholder="系统名称、架构编码、组织或人员"
          className="w-420px!"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onPressEnter={search}
          prefix={
            <span className="i-lucide-search w-14px h-14px text-text-muted" aria-hidden="true" />
          }
        />
        <Button
          type="primary"
          className="shadow-none! bg-accent-active! hover:bg-accent-active!"
          onClick={search}
          icon={<span className="i-lucide-search w-14px h-14px" aria-hidden="true" />}
        >
          查询
        </Button>
      </div>
      {query.error && (
        <Alert
          type="error"
          showIcon
          title="所有系统加载失败"
          description={query.error.message}
          className="mb-4"
          action={<Button onClick={() => void query.refetch()}>重试</Button>}
        />
      )}
      {query.isPending ? (
        <SystemsHomeSkeleton />
      ) : query.data?.records.length ? (
        <div className={systemCardGrid}>
          {query.data.records.map((system) => (
            <SystemCard
              key={system.systemName}
              system={system}
              onDetails={() => onDetails(system)}
            />
          ))}
        </div>
      ) : (
        !query.error && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="workspace-panel m-0! py-16"
            description={params.keyword ? '没有匹配的系统，请调整筛选条件' : '暂无系统'}
          />
        )
      )}
      {/* 后端回传有效页码，刷新后总量缩小也不会把当前页误当作全量清单再次切片。 */}
      <CollectionPagination
        page={query.data?.pageNum ?? params.pageNum}
        pageSize={params.pageSize}
        total={query.data?.total ?? 0}
        onChange={(pageNum, pageSize) =>
          setParams({ ...params, pageNum: pageSize !== params.pageSize ? 1 : pageNum, pageSize })
        }
      />
    </section>
  );
}
