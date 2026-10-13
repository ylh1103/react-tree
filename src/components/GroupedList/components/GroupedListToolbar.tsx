/**
 * 展示统计、类型筛选及分组编辑控制，回调由列表入口传入。
 * 工具栏只消费当前视图状态，查询和树修改由对应 Hook 处理。
 */
import { useIsFetching } from '@tanstack/react-query';
import { groupedListKeys, type GroupedListId } from '../../../queries/groupedList';
import { useId, useState } from 'react';
import { Button, Dropdown, Segmented, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { TreeToolbarContext, GroupedListConfig } from '../types';

type FilterValue = 'all' | '0' | '1';

export function GroupedListToolbar({
  context,
  config,
  busy,
  listId,
  refresh,
  typeFilter,
  setTypeFilter,
}: {
  context: TreeToolbarContext;
  config: GroupedListConfig;
  busy: boolean;
  listId: GroupedListId;
  refresh: () => Promise<void>;
  typeFilter: 'all' | '0' | '1';
  setTypeFilter: (value: 'all' | '0' | '1') => void;
}) {
  const refreshing = useIsFetching({ queryKey: groupedListKeys.list(listId), exact: true }) > 0;
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
  const secondaryActions = [
    {
      key: 'locate',
      label: `定位选中${config.label}`,
      tooltip: selectedKey ? `定位选中${config.label}` : `请先选择一个${config.label}`,
      disabled: !selectedKey || busy,
      icon: <span aria-hidden="true" className="i-lucide-locate-fixed" />,
      onClick: locateSelected,
    },
    {
      key: 'expand',
      label: allExpanded ? '全部折叠' : '全部展开',
      disabled: !hasGroups || busy,
      icon: (
        <span
          aria-hidden="true"
          className={allExpanded ? 'i-lucide:chevrons-down-up' : 'i-lucide:chevrons-up-down'}
        />
      ),
      onClick: toggleAllExpanded,
    },
    {
      key: 'edit',
      label: isEditing ? '关闭分组编辑模式' : '打开分组编辑模式',
      disabled: busy,
      icon: <span aria-hidden="true" className="i-lucide:list-chevrons-up-down rotate-180" />,
      onClick: isEditing ? cancel : enterEdit,
    },
  ];
  return (
    <>
      <div className="shrink-0 min-w-0 [container-type:inline-size]">
        <header className="flex items-center gap-2 px-4 pt-4.5 pb-2.5">
          <GroupedListHeading
            context={context}
            config={config}
            showDetails={typeFilter === 'all'}
          />
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
            {secondaryActions.slice(0, 2).map((action) => (
              <span key={action.key} className="inline-flex [@container(max-width:319px)]:hidden">
                <Tooltip title={action.tooltip ?? action.label}>
                  <Button
                    size="small"
                    aria-label={action.label}
                    disabled={action.disabled}
                    onClick={action.onClick}
                    icon={action.icon}
                  />
                </Tooltip>
              </span>
            ))}
            <Tooltip title={`刷新${config.label}列表`}>
              <Button
                size="small"
                aria-label={`刷新${config.label}列表`}
                disabled={isEditing || busy}
                loading={refreshing}
                onClick={refresh}
                icon={<span aria-hidden="true" className="i-lucide-refresh-cw" />}
              />
            </Tooltip>
            <span className="inline-flex [@container(max-width:319px)]:hidden">
              <Tooltip title={secondaryActions[2].label}>
                <Button
                  size="small"
                  type={isEditing ? 'primary' : 'default'}
                  aria-label={isEditing ? '关闭分组编辑模式' : '打开分组编辑模式'}
                  aria-pressed={isEditing}
                  onClick={isEditing ? cancel : enterEdit}
                  disabled={busy}
                  icon={
                    <span
                      aria-hidden="true"
                      className="i-lucide:list-chevrons-up-down rotate-180"
                    />
                  }
                />
              </Tooltip>
            </span>
            <span className="hidden [@container(max-width:319px)]:inline-flex">
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: secondaryActions.map(({ key, label, disabled, icon, onClick }) => ({
                    key,
                    label,
                    disabled,
                    icon,
                    onClick,
                  })),
                }}
              >
                <Button
                  size="small"
                  type={isEditing ? 'primary' : 'default'}
                  aria-label={`${config.label}列表更多操作`}
                  icon={<span aria-hidden="true" className="i-lucide-ellipsis" />}
                />
              </Dropdown>
            </span>
          </div>
        </header>
      </div>
      <div
        id={filterPanelId}
        hidden={!filtersExpanded}
        className="application-type-filter shrink-0 mx-4 mb-3"
      >
        <Segmented<FilterValue>
          className="grouped-list-type-control"
          block
          aria-label={config.filterLabel}
          value={typeFilter}
          disabled={busy}
          onChange={setTypeFilter}
          options={config.options.map((option) => ({
            value: option.value,
            label: (
              <span className="flex min-w-0 flex-col items-center justify-center gap-0.5">
                <span className="max-w-full truncate" title={option.label}>
                  {option.label}
                </span>
                <span className="application-type-filter-count min-w-4.5 max-w-full truncate px-1 rounded-ui bg-canvas text-text-muted text-[11px] font-600 leading-[18px] tabular-nums">
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
          className="flex items-center justify-between shrink-0 min-w-0 gap-1.5 mx-4 mb-3"
          role="group"
          aria-label="分组编辑操作"
        >
          <Button
            className="shrink-0"
            size="small"
            variant="outlined"
            color="primary"
            icon={<PlusOutlined aria-hidden="true" />}
            onClick={addBranch}
            disabled={busy}
          >
            新增分组
          </Button>
          <div className="flex shrink-0 items-center gap-1 ml-auto">
            <Button size="small" type="text" onClick={cancel} disabled={busy}>
              取消
            </Button>
            <Button size="small" type="primary" onClick={save} loading={isSaving}>
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
    <h2 className="flex min-w-0 items-center gap-1.5 whitespace-nowrap m-0 text-[16px] font-[650] leading-7">
      <span className="truncate" title={`${config.label}列表`}>
        {config.label}列表
      </span>
      <Tooltip
        title={
          showDetails ? (
            <div className="flex flex-col gap-1">
              {countLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          ) : (
            countDescription
          )
        }
      >
        <span
          className="inline-flex shrink-0 items-center justify-center min-w-6 max-w-20 px-1.5 rounded-ui bg-[var(--accent-bg)] text-[var(--accent-text)] text-[12px] font-600 leading-[22px] tabular-nums [@container(max-width:319px)]:max-w-12"
          role="status"
          aria-atomic="true"
          aria-label={countDescription}
        >
          <span className="min-w-0 truncate">
            {isFiltered ? `${filteredLeafCount} / ${totalLeafCount}` : totalLeafCount}
          </span>
        </span>
      </Tooltip>
    </h2>
  );
}
