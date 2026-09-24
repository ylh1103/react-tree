import { useId, useState } from 'react';
import { Button, Segmented, Tooltip } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import type { TreeToolbarContext, GroupedListConfig } from './types';

type FilterValue = 'all' | '0' | '1';

export function GroupedListToolbar({
  context,
  config,
  busy,
  refresh,
  typeFilter,
  setTypeFilter,
}: {
  context: TreeToolbarContext;
  config: GroupedListConfig;
  busy: boolean;
  refresh: () => Promise<void>;
  typeFilter: 'all' | '0' | '1';
  setTypeFilter: (value: 'all' | '0' | '1') => void;
}) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const filterPanelId = useId();
  const {
    totalLeafCount,
    totalLeafCountsByCategory,
    selectedKey,
    locateSelected,
    allExpanded,
    hasGroups,
    toggleAllExpanded,
    isEditing,
    isSaving,
    enterEdit,
    addBranch,
    save,
    cancel,
  } = context;
  return (
    <>
      <header className="flex flex-wrap items-center gap-2 px-5 pt-4.5 pb-2.5">
        <GroupedListHeading context={context} config={config} showDetails={typeFilter === 'all'} />
        <div className="flex shrink-0 gap-1.5 ml-auto">
          <Tooltip title={filtersExpanded ? '收起' : '展开'}>
            <Button
              size="small"
              type={filtersExpanded || typeFilter !== 'all' ? 'primary' : 'default'}
              aria-label={filtersExpanded ? '收起类型选项' : '展开类型选项'}
              aria-expanded={filtersExpanded}
              aria-controls={filterPanelId}
              onClick={() => setFiltersExpanded((current) => !current)}
              icon={<span aria-hidden="true" className="i-lucide-list-filter" />}
            />
          </Tooltip>
          <Tooltip title={selectedKey ? `定位选中${config.label}` : `请先选择一个${config.label}`}>
            <Button
              size="small"
              aria-label={`定位选中${config.label}`}
              disabled={!selectedKey || busy}
              onClick={locateSelected}
              icon={<span aria-hidden="true" className="i-lucide-locate-fixed" />}
            />
          </Tooltip>
          <Tooltip title={allExpanded ? '全部折叠' : '全部展开'}>
            <Button
              size="small"
              aria-label={allExpanded ? '全部折叠' : '全部展开'}
              disabled={!hasGroups || busy}
              onClick={toggleAllExpanded}
              icon={
                <span
                  aria-hidden="true"
                  className={
                    allExpanded ? 'i-lucide:chevrons-down-up' : 'i-lucide:chevrons-up-down'
                  }
                />
              }
            />
          </Tooltip>
          <Tooltip title={`刷新${config.label}列表`}>
            <Button
              size="small"
              aria-label={`刷新${config.label}列表`}
              disabled={isEditing || busy}
              loading={busy && !isSaving}
              onClick={refresh}
              icon={<span aria-hidden="true" className="i-lucide-refresh-cw" />}
            />
          </Tooltip>
          <Tooltip title={isEditing ? '关闭分组编辑模式' : '打开分组编辑模式'}>
            <Button
              size="small"
              type={isEditing ? 'primary' : 'default'}
              aria-label={isEditing ? '关闭分组编辑模式' : '打开分组编辑模式'}
              aria-pressed={isEditing}
              onClick={isEditing ? cancel : enterEdit}
              disabled={busy}
              icon={
                <span aria-hidden="true" className="i-lucide:list-chevrons-up-down rotate-180" />
              }
            />
          </Tooltip>
        </div>
      </header>
      <div
        id={filterPanelId}
        hidden={!filtersExpanded}
        className="application-type-filter shrink-0 mx-5 mb-3"
      >
        <Segmented<FilterValue>
          block
          aria-label={config.filterLabel}
          value={typeFilter}
          disabled={busy}
          onChange={setTypeFilter}
          options={config.options.map((option) => ({
            value: option.value,
            label: (
              <span className="flex flex-wrap items-center justify-center gap-x-1.25 gap-y-0.5">
                <span>{option.label}</span>
                <span className="application-type-filter-count min-w-4.5 px-1 rounded-1 bg-[#e8edf2] text-[11px] font-600 leading-[18px] tabular-nums [overflow-wrap:anywhere]">
                  {option.value === 'all'
                    ? totalLeafCount
                    : (totalLeafCountsByCategory.get(option.value) ?? 0)}
                </span>
              </span>
            ),
          }))}
        />
      </div>
      {isEditing && (
        <div
          className="flex flex-wrap items-center justify-between shrink-0 gap-2 mt-0.5 mx-5 mb-3 p-2 border border-solid border-[#e3e9ed] rounded-2 bg-[#f7f9fb]"
          role="group"
          aria-label="分组编辑操作"
        >
          <Button
            size="small"
            variant="outlined"
            color="primary"
            icon={<PlusOutlined aria-hidden="true" />}
            onClick={addBranch}
            disabled={busy}
          >
            新增分组
          </Button>
          <div className="flex items-center gap-1 ml-auto">
            <Button size="small" type="text" onClick={cancel} disabled={busy}>
              取消
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined aria-hidden="true" />}
              onClick={save}
              loading={isSaving}
            >
              保存
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function GroupedListHeading({
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
    <h2 className="flex items-center gap-1.5 whitespace-nowrap m-0 text-[16px] font-[650] leading-7">
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
          className="inline-flex items-center justify-center min-w-6 px-1.5 rounded-[5px] bg-[var(--accent-bg)] text-[var(--accent-text)] text-[12px] font-600 leading-[22px] tabular-nums"
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
