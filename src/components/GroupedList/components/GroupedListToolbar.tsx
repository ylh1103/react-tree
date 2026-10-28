/**
 * 展示统计及分组编辑控制，回调由列表入口传入。
 * 工具栏只消费当前视图状态，查询和树修改由对应 Hook 处理。
 */
import { useIsFetching } from '@tanstack/react-query';
import { groupedListKeys, type GroupedListId } from '@/queries/groupedList';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';
import { Button, Dropdown, Popover, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { TreeToolbarContext, GroupedListConfig } from '../types';
import { useToolbarOverflow } from '../hooks/useToolbarOverflow';

export function GroupedListToolbar({
  context,
  config,
  busy,
  listId,
  refresh,
}: {
  context: TreeToolbarContext;
  config: GroupedListConfig;
  busy: boolean;
  listId: GroupedListId;
  refresh: () => Promise<void>;
}) {
  const { layoutMode } = useLayoutPreferences();
  const { collapsed, headerRef, headingRef, actionsRef, secondaryRef, primaryRef } =
    useToolbarOverflow();
  const refreshing = useIsFetching({ queryKey: groupedListKeys.list(listId), exact: true }) > 0;
  const {
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
        <header
          ref={headerRef}
          className={`
            ${layoutMode === 'compact' ? 'workspace-titlebar mb-3' : 'workspace-titlebar-layout workspace-titlebar-frame-edge'}
            workspace-collection-titlebar
          `}
        >
          <div ref={headingRef} className="shrink-0">
            <GroupedListHeading context={context} config={config} />
          </div>
          <div ref={actionsRef} className="relative flex shrink-0 gap-1 ml-auto">
            <div
              ref={secondaryRef}
              className={`flex shrink-0 gap-1 ${collapsed ? 'absolute invisible pointer-events-none' : ''}`}
              aria-hidden={collapsed || undefined}
              inert={collapsed}
            >
              {secondaryActions.slice(0, 2).map((action) => (
                <span key={action.key} className="inline-flex">
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
            </div>
            <div ref={primaryRef} className="flex shrink-0 gap-1">
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
              <span className="inline-flex">
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
            </div>
            <span className={collapsed ? 'inline-flex' : 'hidden'}>
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: secondaryActions
                    .slice(0, 2)
                    .map(({ key, label, disabled, icon, onClick }) => ({
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
}: {
  context: TreeToolbarContext;
  config: GroupedListConfig;
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
    <h2 className="flex shrink-0 items-center gap-1.5 whitespace-nowrap m-0 text-[16px] font-[650] leading-7">
      <span title={`${config.label}列表`}>{config.label}列表</span>
      <Popover
        trigger={['hover', 'click']}
        placement="bottomLeft"
        arrow={false}
        classNames={{ container: 'p-0! overflow-hidden rounded-ui!' }}
        content={
          <div className="w-280px max-w-[calc(100vw-32px)] text-text text-12px font-400 leading-5">
            <div className="px-2 pt-3 pb-2">
              <table className="w-full border-collapse whitespace-nowrap text-left">
                <thead>
                  <tr className="text-11px text-text-muted">
                    <th scope="col" className="px-2 pb-2 font-400">
                      类型
                    </th>
                    {isFiltered && (
                      <th scope="col" className="px-2 pb-2 text-right font-400">
                        当前匹配
                      </th>
                    )}
                    <th scope="col" className="px-2 pb-2 text-right font-400">
                      总数
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-hover">
                    <th scope="row" className="rounded-l-control px-2 py-2 font-600">
                      全部{config.label}
                    </th>
                    {isFiltered && (
                      <td className="px-2 py-2 text-right text-16px font-600 tabular-nums text-accent-text">
                        {filteredLeafCount.toLocaleString()}
                      </td>
                    )}
                    <td
                      className={`
                        rounded-r-control px-2 py-2 text-right font-600 tabular-nums
                        ${isFiltered ? 'text-text-secondary' : 'text-16px text-accent-text'}
                      `}
                    >
                      {totalLeafCount.toLocaleString()}
                    </td>
                  </tr>
                  {categories.map(({ key, label }) => (
                    <tr key={key}>
                      <th scope="row" className="px-2 py-2 font-400 text-text-secondary">
                        {label}
                      </th>
                      {isFiltered && (
                        <td className="px-2 py-2 text-right font-500 tabular-nums">
                          {(filteredLeafCountsByCategory.get(key) ?? 0).toLocaleString()}
                        </td>
                      )}
                      <td className="px-2 py-2 text-right tabular-nums text-text-secondary">
                        {(totalLeafCountsByCategory.get(key) ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isFiltered && (
              <p
                className={`
                  m-0 border-t border-t-solid border-divider bg-sidebar px-4 py-2.5 text-11px
                  leading-4 text-text-muted whitespace-normal
                `}
              >
                匹配数量随搜索和类型筛选实时更新
              </p>
            )}
          </div>
        }
      >
        <Button
          type="text"
          size="small"
          aria-label={`查看${config.label}数量统计，${countDescription}`}
          className={`
            h-24px! min-w-6 px-1.5! gap-1! rounded-control! bg-hover! hover:bg-accent-bg-hover!
            text-12px! leading-5! font-600! tabular-nums layout-focus
          `}
        >
          <span role="status" aria-atomic="true" aria-label={countDescription}>
            <span className="text-accent-text">
              {(isFiltered ? filteredLeafCount : totalLeafCount).toLocaleString()}
            </span>
            {isFiltered && (
              <>
                <span aria-hidden="true" className="mx-1 text-text-muted font-400">
                  /
                </span>
                <span className="text-text-secondary font-400">
                  {totalLeafCount.toLocaleString()}
                </span>
              </>
            )}
          </span>
        </Button>
      </Popover>
    </h2>
  );
}
