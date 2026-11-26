import { ConfigProvider, Segmented } from 'antd';
import type { SystemView } from './layout';

export default function SystemViewSwitch({
  label,
  view,
  onChange,
}: {
  label: string;
  view: SystemView;
  onChange: (view: SystemView) => void;
}) {
  return (
    <ConfigProvider
      theme={{
        components: {
          Segmented: {
            trackBg: 'var(--color-surface)',
            trackPadding: 3,
            itemColor: 'var(--color-text-secondary)',
            itemSelectedBg: 'var(--color-divider)',
            itemSelectedColor: 'var(--color-surface-text)',
          },
        },
      }}
    >
      <Segmented<SystemView>
        className="border border-solid border-border-subtle [&_.ant-segmented-item-label]:grid [&_.ant-segmented-item-label]:h-38px [&_.ant-segmented-item-label]:w-34px [&_.ant-segmented-item-label]:place-items-center [&_.ant-segmented-item-label]:px-0! min-[360px]:[&_.ant-segmented-item-label]:w-38px [&_.ant-segmented-item-selected]:shadow-none! [&_.ant-segmented-thumb]:shadow-none!"
        aria-label={label}
        value={view}
        onChange={onChange}
        options={[
          {
            value: 'card',
            title: '卡片',
            label: (
              <span className="flex items-center">
                <span className="i-lucide-layout-grid text-16px" aria-hidden="true" />
                <span className="sr-only">卡片</span>
              </span>
            ),
          },
          {
            value: 'list',
            title: '列表',
            label: (
              <span className="flex items-center">
                <span className="i-lucide-list text-16px" aria-hidden="true" />
                <span className="sr-only">列表</span>
              </span>
            ),
          },
        ]}
      />
    </ConfigProvider>
  );
}
