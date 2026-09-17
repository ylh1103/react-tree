import { Segmented } from 'antd';
import './ListTypeFilter.css';

type FilterValue = 'all' | '0' | '1';

interface ListTypeFilterProps {
  id: string;
  expanded: boolean;
  label: string;
  value: FilterValue;
  options: { label: string; value: FilterValue }[];
  onChange: (value: FilterValue) => void;
  disabled?: boolean;
}

export function ListTypeFilter({
  id,
  expanded,
  label,
  value,
  options,
  onChange,
  disabled,
}: ListTypeFilterProps) {
  return (
    <div id={id} hidden={!expanded} className="list-type-filter" role="group" aria-label={label}>
      <Segmented<FilterValue>
        block
        size="small"
        aria-label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={options}
      />
    </div>
  );
}
