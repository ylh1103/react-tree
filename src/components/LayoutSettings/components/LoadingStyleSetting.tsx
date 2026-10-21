/** 加载图标选择：以选中态标识当前方案，名称由悬停、键盘聚焦提示及无障碍标签提供。 */
import { Button, Radio, Tooltip } from 'antd';
import { useId } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { defaultUserSettings, type UserSettings } from '../../../types/preferences';
import { isLoadingStyleId } from '../../../types/loading';
import { LoadingIndicator } from '../../LoadingIndicator';
import { loadingStyles } from '../../LoadingIndicator/model/styles';
import { SettingsOptionCard } from './SettingsOptionCard';

/** 默认信息不占用图标选项面积；与配置默认值共享来源，后续更换默认方案时同步文案。 */
const defaultStyle =
  loadingStyles.find((item) => item.id === defaultUserSettings.loadingStyle) ?? loadingStyles[0];
const defaultHint = `默认图标：${defaultStyle.name}`;

/** 仅订阅加载方案；读取失败时禁用写入，保存期间仍允许选择并由既有队列串行提交。 */
export function LoadingStyleSetting({
  disabled,
  onSave,
}: {
  disabled: boolean;
  onSave: (changes: Partial<UserSettings>) => void;
}) {
  const value = useAppSelector((state) => state.preferences.loadingStyle);
  const labelId = useId();
  return (
    <div className="flex flex-col gap-3 mt-3">
      <div className="flex items-center gap-1">
        <h3 id={labelId} className="m-0 text-14px font-600 leading-5 text-text">
          数据加载图标
        </h3>
        <Tooltip title={defaultHint} trigger={['hover', 'focus', 'click']}>
          <Button
            type="text"
            size="small"
            aria-label={defaultHint}
            icon={<span aria-hidden="true" className="i-lucide-info text-13px" />}
            className="h-5! w-5! min-w-0! p-0! text-text-muted!"
          />
        </Tooltip>
      </div>
      <Radio.Group
        name={labelId}
        aria-labelledby={labelId}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const styleId: unknown = event.target.value;
          if (isLoadingStyleId(styleId) && styleId !== value) onSave({ loadingStyle: styleId });
        }}
        className="grid! w-full! grid-cols-5 gap-2"
      >
        {loadingStyles.map((item) => (
          <Tooltip key={item.id} title={item.name} trigger={['hover', 'focus']}>
            <SettingsOptionCard
              value={item.id}
              aria-label={`${item.name}${item.id === defaultUserSettings.loadingStyle ? '（默认）' : ''}`}
            >
              <span aria-hidden="true" className="flex h-8 w-full items-center justify-center">
                <LoadingIndicator styleId={item.id} className="text-32px" />
              </span>
            </SettingsOptionCard>
          </Tooltip>
        ))}
      </Radio.Group>
    </div>
  );
}
