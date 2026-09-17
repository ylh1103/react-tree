import { useId, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { ListTypeFilter } from '../../components/ListTypeFilter';
import type { TreeToolbarContext } from '../../components/VirtualTree/types';
import type { GroupedListConfig } from './types';

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
    filteredLeafCount,
    totalLeafCountsByCategory,
    filteredLeafCountsByCategory,
    isFiltered,
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
  const categories = config.options
    .filter((option) => option.value !== 'all')
    .map((option) => ({ key: String(option.value), label: option.label }));
  if ((totalLeafCountsByCategory.get('unknown') ?? 0) > 0) {
    categories.push({ key: 'unknown', label: '未标注' });
  }
  const typeCounts = categories.map(({ key, label }) => {
    const total = totalLeafCountsByCategory.get(key) ?? 0;
    const matched = filteredLeafCountsByCategory.get(key) ?? 0;
    return {
      key,
      label,
      value: isFiltered ? `${matched} / ${total}` : String(total),
      description: isFiltered
        ? `${label}：当前匹配 ${matched} 个，共 ${total} 个`
        : `${label}：${total} 个`,
    };
  });
  const countLines = [
    isFiltered
      ? `当前匹配 ${filteredLeafCount} 个，共 ${totalLeafCount} 个${config.label}`
      : `共 ${totalLeafCount} 个${config.label}`,
    ...typeCounts.map((item) => item.description),
  ];
  const countDescription = countLines.join('；');
  return (
    <>
      <header className="application-toolbar">
        <h2 className="list-heading">
          <span>{config.label}列表</span>
          <Tooltip
            title={
              <div className="flex flex-col gap-1">
                {countLines.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
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
        <div className="toolbar-actions">
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
          <Tooltip title={isEditing ? '正在编辑分组' : '打开分组编辑模式'}>
            <Button
              size="small"
              type={isEditing ? 'primary' : 'default'}
              aria-label="打开分组编辑模式"
              aria-pressed={isEditing}
              onClick={() => {
                if (!isEditing) enterEdit();
              }}
              disabled={busy}
              icon={
                <span aria-hidden="true" className="i-lucide:list-chevrons-up-down rotate-180" />
              }
            />
          </Tooltip>
        </div>
      </header>
      <ListTypeFilter
        id={filterPanelId}
        expanded={filtersExpanded}
        label={config.filterLabel}
        value={typeFilter}
        onChange={setTypeFilter}
        disabled={busy}
        options={config.options}
      />
      {isEditing && (
        <div className="editing-toolbar">
          <Button size="small" onClick={addBranch} disabled={busy}>
            新增分组
          </Button>
          <Button size="small" type="primary" onClick={save} loading={isSaving}>
            保存
          </Button>
          <Button size="small" onClick={cancel} disabled={busy}>
            取消
          </Button>
        </div>
      )}
    </>
  );
}
