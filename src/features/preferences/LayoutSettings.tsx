import { Radio } from 'antd';
import { useId } from 'react';
import { useLayoutPreferences } from './useLayoutPreferences';

export function LayoutSettings() {
  const { layoutMode, setLayoutMode } = useLayoutPreferences();
  const labelId = useId();
  return (
    <div className="flex flex-col gap-12px">
      <h3 id={labelId} className="m-0 text-14px font-600 text-text">
        界面布局
      </h3>
      <Radio.Group
        aria-labelledby={labelId}
        value={layoutMode}
        onChange={(event) =>
          setLayoutMode(event.target.value === 'compact' ? 'compact' : 'default')
        }
        className="flex flex-wrap gap-12px"
        options={[
          { label: '默认布局', value: 'default' },
          { label: '紧凑布局', value: 'compact' },
        ]}
      />
      <p className="m-0 workspace-muted" aria-live="polite">
        {layoutMode === 'compact'
          ? '模块之间无间距，使用边框线分隔。'
          : '模块之间保留间距，使用默认布局。'}
        设置立即生效，并在此浏览器中保存。
      </p>
    </div>
  );
}
