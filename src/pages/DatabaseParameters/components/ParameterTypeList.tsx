/** 数据库页私有的只读类型列表，负责本地搜索与 URL 导航，不维护选中项副本。 */
import { useState } from 'react';
import { Button, Empty, Input, Menu, Tag } from 'antd';
import { NavLink } from 'react-router';
import { useSystemWorkspace } from '@/contexts/SystemContext';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';
import { databasePath } from '@/router/paths';
import type { ParameterType } from '@/types/systems';

export function ParameterTypeList({
  items,
  selectedName,
  refreshing,
  onRefresh,
}: {
  items: ParameterType[];
  selectedName?: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { system } = useSystemWorkspace();
  const { layoutMode } = useLayoutPreferences();
  const [search, setSearch] = useState('');
  const keyword = search.trim().toLocaleLowerCase();
  const visible = items.filter((item) =>
    `${item.paramTypeName} ${item.description}`.toLocaleLowerCase().includes(keyword),
  );
  return (
    <div>
      <div
        className={`flex items-center justify-between gap-2 p-4 border-b border-b-solid ${layoutMode === 'compact' ? 'border-divider' : 'border-border-subtle'}`}
      >
        <h2 className="workspace-page__title">参数类型</h2>
        <Tag className="m-0!">{items.length}</Tag>
      </div>
      <div className="p-3">
        <Input
          allowClear
          aria-label="搜索参数类型"
          placeholder="搜索参数类型名称或描述"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<span className="i-lucide-search w-14px h-14px" aria-hidden="true" />}
        />
      </div>
      <div className="px-3 pb-2">
        <Button
          size="small"
          loading={refreshing}
          onClick={onRefresh}
          icon={<span className="i-lucide-refresh-cw w-12px h-12px" aria-hidden="true" />}
        >
          刷新列表
        </Button>
      </div>
      {visible.length ? (
        <Menu
          className="bg-transparent! border-e-0! [&_.ant-menu-item]:h-auto! [&_.ant-menu-item]:min-h-40px [&_.ant-menu-title-content]:whitespace-normal!"
          selectedKeys={selectedName ? [selectedName] : []}
          items={visible.map((item) => ({
            key: item.paramTypeName,
            label: (
              <NavLink
                to={databasePath(system.systemName, item.paramTypeName)}
                className="block py-2 leading-20px break-words"
                title={item.description}
              >
                {item.paramTypeName}
              </NavLink>
            ),
          }))}
        />
      ) : (
        <Empty
          className="py-6"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={search ? '未找到匹配的参数类型' : '暂无参数类型'}
        />
      )}
    </div>
  );
}
