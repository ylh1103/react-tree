/** 仅负责分页交互和总量展示；我的目录传本地总量，全部目录必须传接口 total。 */
import { Pagination } from 'antd';

export default function CollectionPagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, size: number) => void;
}) {
  if (!total) return null;
  return (
    <div className="flex justify-end mt-5 [&_.ant-pagination]:flex-wrap">
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        showSizeChanger
        pageSizeOptions={[8, 16, 32]}
        showTotal={(count) => `共 ${count} 个系统`}
        onChange={onChange}
        locale={{
          items_per_page: '条/页',
          prev_page: '上一页',
          next_page: '下一页',
          prev_5: '向前 5 页',
          next_5: '向后 5 页',
          page: '页',
        }}
      />
    </div>
  );
}
