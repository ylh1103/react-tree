/** 系统目录筛选无结果时，提示如何调整条件，并提供清除入口。 */
import { Button } from 'antd';

export default function SystemSearchEmpty({
  description,
  clearLabel,
  onClear,
}: {
  description: string;
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <div className="workspace-panel flex min-h-200px flex-col items-center justify-center px-5 py-7 text-center">
      <span
        aria-hidden="true"
        className="mb-3 grid h-11 w-11 place-items-center rounded-ui bg-hover text-accent-text"
      >
        <span className="i-lucide-search-x text-22px" />
      </span>
      <div role="status">
        <p className="m-0 text-16px font-600 leading-6">未找到匹配的系统</p>
        <p className="m-0 mt-1 text-13px leading-5 text-text-secondary">{description}</p>
      </div>
      <Button className="mt-4" onClick={onClear}>
        {clearLabel}
      </Button>
    </div>
  );
}
