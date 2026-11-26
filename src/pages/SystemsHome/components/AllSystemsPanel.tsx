/** 所有系统按后端分页：查询条件和页码进入缓存键，界面直接显示当前页 records 与接口 total。 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Input, Spin } from 'antd';
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
import { SystemItem } from './SystemPresentation';
import CollectionPagination from './CollectionPagination';
import SystemSearchEmpty from './SystemSearchEmpty';
import SystemsHomeSkeleton from './SystemsHomeSkeleton';
import { useSystemQueryError } from '../hooks/useSystemQueryError';

export default function AllSystemsPanel({
  view,
  keyword,
  onKeywordChange,
  defaultPageSize,
  onDetails,
}: {
  view: SystemView;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  defaultPageSize: number;
  onDetails: (system: AllSystemInfo) => void;
}) {
  const ystId = useAppSelector((state) => state.user.userInfo?.ystId ?? null);
  const [pagination, setPagination] = useState({
    keyword,
    ystId,
    pageNum: 1,
    pageSize: defaultPageSize,
    total: 0,
  });
  const sameDirectory = pagination.keyword === keyword && pagination.ystId === ystId;
  if (!sameDirectory) setPagination({ ...pagination, keyword, ystId, pageNum: 1, total: 0 });
  const params: SystemPageParams = {
    keyword,
    pageNum: sameDirectory ? pagination.pageNum : 1,
    pageSize: pagination.pageSize,
  };
  // 输入草稿仅在提交时进入 URL；直达链接和历史导航恢复已提交的关键词。
  const [draft, setDraft] = useState({ keyword, value: keyword });
  if (draft.keyword !== keyword) setDraft({ keyword, value: keyword });

  const isPlatformAdmin = useAppSelector((state) => state.user.userInfo?.userType === '0');
  const query = useQuery(systemPageOptions(params, ystId));
  const [submittedKeyword, setSubmittedKeyword] = useState<string | null>(null);
  const searching = submittedKeyword === keyword && query.isFetching;
  // 关键词先写入 URL，再由目标查询接管加载状态；分页主动清除搜索标记。
  if (submittedKeyword === keyword && query.fetchStatus === 'idle') setSubmittedKeyword(null);

  function search(value: string) {
    const nextKeyword = value.trim();
    setDraft({ keyword, value: nextKeyword });
    setSubmittedKeyword(nextKeyword);
    if (nextKeyword !== keyword) onKeywordChange(nextKeyword);
    else if (params.pageNum === 1) void query.refetch();
    else setPagination({ ...pagination, pageNum: 1 });
  }
  useSystemQueryError(query.error, query.errorUpdatedAt, '所有系统加载失败');
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
  return (
    <section className="@container" aria-label="所有系统">
      <div className="mb-5">
        <Input.Search
          size="large"
          allowClear
          aria-label="筛选所有系统"
          placeholder="系统名称、架构编码、组织或人员"
          className="w-full! min-w-0! @[640px]:max-w-500px"
          loading={searching}
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
      </div>
      <Spin spinning={searching && query.data !== undefined} delay={200} size="large">
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
                  showDelete={isPlatformAdmin}
                  onDetails={() => onDetails(system)}
                />
              ))}
            </div>
          </div>
        ) : (
          !query.error &&
          (params.keyword ? (
            <SystemSearchEmpty
              description="试试用系统名称或架构编码重新搜索。"
              clearLabel="清除搜索"
              onClear={() => search('')}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="workspace-panel m-0! py-16"
              description="暂无系统"
            />
          ))
        )}
      </Spin>
      {/* 后端回传有效页码，刷新后总量缩小也不会把当前页误当作全量清单再次切片。 */}
      <CollectionPagination
        page={query.data?.pageNum ?? params.pageNum}
        pageSize={params.pageSize}
        total={query.data?.total ?? (sameDirectory ? pagination.total : 0)}
        defaultPageSize={defaultPageSize}
        onChange={(pageNum, pageSize) => {
          setSubmittedKeyword(null);
          setPagination({
            keyword,
            ystId,
            pageNum: pageSize !== params.pageSize ? 1 : pageNum,
            pageSize,
            total: query.data?.total ?? pagination.total,
          });
        }}
      />
    </section>
  );
}
