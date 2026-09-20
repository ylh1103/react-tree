import { Segmented } from 'antd';
import './ApplicationTypeFilter.css';

type FilterValue = 'all' | '0' | '1';

interface ApplicationTypeFilterProps {
  id: string;
  label: string;
  expanded: boolean;
  value: FilterValue;
  options: { label: string; value: FilterValue }[];
  counts: ReadonlyMap<string, number>;
  total: number;
  disabled: boolean;
  onChange: (value: FilterValue) => void;
}

export function ApplicationTypeFilter({
  id,
  label,
  expanded,
  value,
  options,
  counts,
  total,
  disabled,
  onChange,
}: ApplicationTypeFilterProps) {
  return (
    <div id={id} hidden={!expanded} className="application-type-filter">
      <Segmented<FilterValue>
        block
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={onChange}
        options={options.map((option) => ({
          value: option.value,
          label: (
            <span className="application-type-filter-option">
              <span>{option.label}</span>
              <span className="application-type-filter-count">
                {option.value === 'all' ? total : (counts.get(option.value) ?? 0)}
              </span>
            </span>
          ),
        }))}
      />
    </div>
  );
}
