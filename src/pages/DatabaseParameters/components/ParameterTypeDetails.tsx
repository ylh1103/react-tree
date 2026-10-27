/** 数据库类型详情与待接入提示，仅依赖本页业务类型和当前系统信息。 */
import { Descriptions, Empty, Tag } from 'antd';
import { useSystemWorkspace } from '@/contexts/SystemContext';
import type { ParameterType } from '@/types/systems';

export function ParameterTypeDetails({ item }: { item: ParameterType }) {
  const { system } = useSystemWorkspace();
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="i-lucide-database w-24px h-24px text-accent" aria-hidden="true" />
        <h3 className="m-0 text-18px font-600 break-all">{item.paramTypeName}</h3>
        <Tag className="shrink-0">数据库参数</Tag>
      </div>
      <Descriptions
        column={1}
        size="small"
        items={[
          {
            key: 'system',
            label: '所属系统',
            children: `${system.systemName} · ${system.systemChineseName}`,
          },
          { key: 'description', label: '参数类型描述', children: item.description || '暂无描述' },
        ]}
      />
      <div className="workspace-panel mt-6 p-6">
        <h4 className="workspace-page__title mb-4">参数工作区</h4>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="参数内容待接入" />
      </div>
    </>
  );
}
