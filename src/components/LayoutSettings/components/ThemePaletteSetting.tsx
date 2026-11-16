/** 主题配色选择器，使用与应用相同的配色数据展示当前明暗模式下的色板。 */
import { Select } from 'antd';
import { useId } from 'react';
import { shadcnPalettes } from '@/styles/shadcnPalettes';
import { getThemeVariables } from '@/styles/theme';
import { shadcnPaletteIds, type ResolvedThemeMode, type ThemePaletteId } from '@/types/themeMode';

const options = [
  { value: 'platform' as const, label: '平台默认' },
  ...shadcnPaletteIds.map((id) => ({ value: id, label: shadcnPalettes[id][0] })),
];

function PaletteSwatch({ palette, mode }: { palette: ThemePaletteId; mode: ResolvedThemeMode }) {
  let colors: string[];
  if (palette === 'platform') {
    const variables = getThemeVariables(mode);
    colors = [
      variables['--color-accent'],
      variables['--color-canvas'],
      variables['--color-surface'],
      variables['--color-sidebar'],
      variables['--color-border'],
    ];
  } else {
    const [canvas, surface, , , sidebar, border, , , primary] =
      shadcnPalettes[palette][mode === 'light' ? 1 : 2];
    colors = [primary, canvas, surface, sidebar, border];
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-4 w-15 shrink-0 overflow-hidden rounded border border-solid border-border"
    >
      {colors.map((color, index) => (
        <span key={index} className="flex-1" style={{ backgroundColor: color }} />
      ))}
    </span>
  );
}

export function ThemePaletteSetting({
  value,
  mode,
  disabled,
  onChange,
}: {
  value: ThemePaletteId;
  mode: ResolvedThemeMode;
  disabled: boolean;
  onChange: (value: ThemePaletteId) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-14px font-600 leading-5 text-text">
        主题配色
      </label>
      <Select
        id={id}
        className="w-full"
        value={value}
        disabled={disabled}
        options={options}
        showSearch={{ optionFilterProp: 'label' }}
        prefix={<PaletteSwatch palette={value} mode={mode} />}
        optionRender={({ data }) => (
          <span className="flex min-w-0 items-center justify-between gap-3">
            <span className="truncate">{data.label}</span>
            <PaletteSwatch palette={data.value} mode={mode} />
          </span>
        )}
        onChange={onChange}
      />
    </div>
  );
}
