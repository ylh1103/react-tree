/** 仅负责分页交互和总量展示；我的目录传本地总量，全部目录必须传接口 total。 */
import { Pagination, Select, type PaginationProps } from 'antd';

const pageSizeOptions = [8, 12, 24, 48];

export default function CollectionPagination({
  page,
  pageSize,
  defaultPageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  defaultPageSize: number;
  total: number;
  onChange: (page: number, size: number) => void;
}) {
  if (!total) return null;
  const paginationProps: PaginationProps = {
    current: page,
    pageSize,
    total,
    showSizeChanger: false,
    onChange,
    locale: {
      prev_page: '上一页',
      next_page: '下一页',
      prev_3: '向前 3 页',
      next_3: '向后 3 页',
      page: '页',
    },
  };

  return (
    <div className="@container mt-5">
      <div className="flex items-center justify-between gap-1 @[520px]:justify-end @[520px]:gap-2.5">
        <span className="whitespace-nowrap text-12px text-text-secondary @[520px]:text-14px">
          共 {total} 个系统
        </span>
        <div className="shrink-0 @[520px]:hidden">
          <Pagination
            {...paginationProps}
            simple={{ readOnly: true }}
            className="flex-nowrap whitespace-nowrap gap-1 [&>li]:m-0!"
          />
        </div>
        <div className="hidden @[520px]:block">
          <Pagination
            {...paginationProps}
            showLessItems
            responsive
            className="flex-nowrap justify-center gap-1 [&>li]:m-0!"
          />
        </div>
        <Select
          aria-label="每页系统条数"
          className="shrink-0"
          value={pageSize}
          options={[...new Set([defaultPageSize, pageSize, ...pageSizeOptions])]
            .sort((left, right) => left - right)
            .map((size) => ({ value: size, label: `${size} 条/页` }))}
          onChange={(size) => onChange(page, size)}
        />
      </div>
    </div>
  );
}
