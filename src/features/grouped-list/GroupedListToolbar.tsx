import { useId, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import './GroupedListToolbar.css';
import { GroupedListHeading } from './GroupedListHeading';
import { ApplicationTypeFilter } from '../../components/ApplicationTypeFilter';
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
      <header className="application-toolbar">
        <GroupedListHeading context={context} config={config} showDetails={typeFilter === 'all'} />
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
      <ApplicationTypeFilter
        id={filterPanelId}
        label={config.filterLabel}
        expanded={filtersExpanded}
        value={typeFilter}
        options={config.options}
        counts={totalLeafCountsByCategory}
        total={totalLeafCount}
        disabled={busy}
        onChange={setTypeFilter}
      />
      {isEditing && (
        <div
          className="editing-toolbar grouped-editing-toolbar"
          role="group"
          aria-label="分组编辑操作"
        >
          <Button
            className="editing-add-button"
            icon={<PlusOutlined aria-hidden="true" />}
            onClick={addBranch}
            disabled={busy}
          >
            新增分组
          </Button>
          <div className="editing-confirm-actions">
            <Button type="text" onClick={cancel} disabled={busy}>
              取消
            </Button>
            <Button
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
