/** 所有系统按后端分页：查询条件和页码进入缓存键，界面直接显示当前页 records 与接口 total。 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Empty, Input } from 'antd';
import { systemPageOptions } from '@/queries/systems';
import type { AllSystemInfo, SystemPageParams } from '@/types/systems';
import { isAccessDenied } from '@/utils/systems';
import { useAppSelector } from '@/store/hooks';
import RouteStatusPage from '@/pages/RouteStatus';
import {
  systemCardContainer,
  systemCardGrid,
  systemListLayout,
  type SystemView,
} from '../model/presentation';
import { SystemItem, SystemViewSwitch } from './SystemPresentation';
import CollectionPagination from './CollectionPagination';
import SystemsHomeSkeleton from './SystemsHomeSkeleton';

export default function AllSystemsPanel({
  view,
  onViewChange,
  keyword,
  onKeywordChange,
  defaultPageSize,
  onDetails,
}: {
  view: SystemView;
  onViewChange: (view: SystemView) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  defaultPageSize: number;
  onDetails: (system: AllSystemInfo) => void;
}) {
  const [pagination, setPagination] = useState({ keyword, pageNum: 1, pageSize: defaultPageSize });
  if (pagination.keyword !== keyword) setPagination({ ...pagination, keyword, pageNum: 1 });
  const params: SystemPageParams = {
    keyword,
    pageNum: pagination.keyword === keyword ? pagination.pageNum : 1,
    pageSize: pagination.pageSize,
  };
  // 输入草稿仅在提交时进入 URL；直达链接和历史导航恢复已提交的关键词。
  const [draft, setDraft] = useState({ keyword, value: keyword });
  if (draft.keyword !== keyword) setDraft({ keyword, value: keyword });

  const openId = useAppSelector((state) => state.user.userInfo?.openId ?? null);
  const isPlatformAdmin = useAppSelector((state) => state.user.userInfo?.userType === '0');
  const query = useQuery(systemPageOptions(params, openId));
  function search(value: string) {
    const nextKeyword = value.trim();
    setDraft({ keyword, value: nextKeyword });
    if (nextKeyword !== keyword) onKeywordChange(nextKeyword);
    else if (params.pageNum === 1) void query.refetch();
    else setPagination({ ...pagination, pageNum: 1 });
  }
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
  return (
    <section className="@container" aria-label="所有系统">
      <div className="mb-5 grid min-w-0 items-center gap-2 @[360px]:grid-cols-[minmax(0,1fr)_auto] @[560px]:gap-3">
        <Input.Search
          allowClear
          aria-label="筛选所有系统"
          placeholder="系统名称、架构编码、组织或人员"
          className="w-full! min-w-0! @[640px]:max-w-420px"
          loading={query.isFetching && !query.isPending}
          value={draft.keyword === keyword ? draft.value : keyword}
          onChange={(event) => setDraft({ keyword, value: event.target.value })}
          onSearch={search}
          enterButton={
            <Button
              type="primary"
              className="w-46px!"
              aria-label="搜索所有系统"
              icon={<span className="i-lucide-search w-14px h-14px" aria-hidden="true" />}
            />
          }
        />
        <div className="justify-self-end">
          <SystemViewSwitch label="所有系统展示模式" view={view} onChange={onViewChange} />
        </div>
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
        <SystemsHomeSkeleton count={params.pageSize} view={view} />
      ) : query.data?.records.length ? (
        <div className={systemCardContainer}>
          <div className={view === 'list' ? systemListLayout : systemCardGrid}>
            {query.data.records.map((system) => (
              <SystemItem
                key={system.systemName}
                system={system}
                view={view}
                entriesLocked={!isPlatformAdmin && system.userRelation !== true}
                onDetails={() => onDetails(system)}
              />
            ))}
          </div>
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
        defaultPageSize={defaultPageSize}
        onChange={(pageNum, pageSize) =>
          setPagination({ keyword, pageNum: pageSize !== params.pageSize ? 1 : pageNum, pageSize })
        }
      />
    </section>
  );
}
