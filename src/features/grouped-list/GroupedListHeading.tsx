import { Tooltip } from 'antd';
import type { TreeToolbarContext } from '../../components/VirtualTree/types';
import type { GroupedListConfig } from './types';

export function GroupedListHeading({
  context,
  config,
  showDetails,
}: {
  context: TreeToolbarContext;
  config: GroupedListConfig;
  showDetails: boolean;
}) {
  const {
    totalLeafCount,
    filteredLeafCount,
    totalLeafCountsByCategory,
    filteredLeafCountsByCategory,
    isFiltered,
  } = context;
  const categories = config.options
    .filter((option) => option.value !== 'all')
    .map((option) => ({ key: String(option.value), label: option.label }));
  if ((totalLeafCountsByCategory.get('unknown') ?? 0) > 0) {
    categories.push({ key: 'unknown', label: '未标注' });
  }
  const categoryDescriptions = categories.map(({ key, label }) => {
    const total = totalLeafCountsByCategory.get(key) ?? 0;
    const matched = filteredLeafCountsByCategory.get(key) ?? 0;
    return isFiltered
      ? `${label}：当前匹配 ${matched} 个，共 ${total} 个`
      : `${label}：${total} 个`;
  });
  const countLines = [
    isFiltered
      ? `当前匹配 ${filteredLeafCount} 个，共 ${totalLeafCount} 个${config.label}`
      : `共 ${totalLeafCount} 个${config.label}`,
    ...categoryDescriptions,
  ];
  const countDescription = countLines.join('；');
  return (
    <h2 className="list-heading">
      <span>{config.label}列表</span>
      <Tooltip
        title={
          showDetails ? (
            <div className="flex flex-col gap-1">
              {countLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          ) : null
        }
      >
        <span
          className="list-heading-count"
          role="status"
          aria-atomic="true"
          aria-label={countDescription}
        >
          {isFiltered ? `${filteredLeafCount} / ${totalLeafCount}` : totalLeafCount}
        </span>
      </Tooltip>
    </h2>
  );
}
