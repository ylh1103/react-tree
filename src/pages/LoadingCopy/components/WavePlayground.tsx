/** 首页交互舞台：预设和数值编辑共用单份状态，窗口拖动只影响展示位置。 */
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import App from 'antd/es/app';
import Button from 'antd/es/button';
import Input from 'antd/es/input';
import Popover from 'antd/es/popover';
import Slider from 'antd/es/slider';
import GradientWaves from './GradientWaves';
import { installCommand, presets, source, type WaveSettings } from '../model/presets';

const windowClass =
  'absolute z-2 rounded-18px border border-solid border-border-subtle bg-[var(--landing-window)] p-6px pt-0 shadow-[0_30px_70px_#0006,0_14px_32px_#0004] backdrop-blur-24px';

function FloatingWindow({
  title,
  className,
  children,
  action,
}: {
  title: string;
  className: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  function move(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (start)
      setOffset({
        x: start.x + event.clientX - start.startX,
        y: start.y + event.clientY - start.startY,
      });
  }
  return (
    <section
      className={`${windowClass} ${className}`}
      style={{ translate: `${offset.x}px ${offset.y}px` }}
    >
      <div
        className="relative flex h-36px select-none items-center justify-center text-12px text-text-muted cursor-grab active:cursor-grabbing min-[900px]:touch-none max-[899px]:cursor-default"
        onPointerDown={(event) => {
          if (window.matchMedia('(max-width: 899px)').matches) return;
          if ((event.target as HTMLElement).closest('button')) return;
          drag.current = { ...offset, startX: event.clientX, startY: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {title}
        {action}
      </div>
      {children}
    </section>
  );
}

/** 剪贴板失败时明确提示，避免将复制失败展示为成功。 */
export function CopyCommand({ command = installCommand }: { command?: string }) {
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      void message.error('复制失败，请手动选择命令复制。');
    }
  }
  return (
    <Button
      type="text"
      size="small"
      aria-label={copied ? 'Install command copied' : 'Copy install command'}
      title={copied ? 'Copied' : 'Copy install command'}
      onClick={() => void copy()}
      icon={
        copied ? (
          <span aria-hidden="true" className="i-lucide-check size-1em align-middle " />
        ) : (
          <span aria-hidden="true" className="i-lucide-copy size-1em align-middle " />
        )
      }
      className="absolute! right-0 top-5px text-text-muted!"
    />
  );
}

function EditableValue({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <Popover
      trigger="click"
      title={label}
      content={
        <div className="w-180px">
          <Slider
            ariaLabelForHandle={label}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
          />
        </div>
      }
    >
      <Button
        type="text"
        size="small"
        aria-label={`Edit ${label}`}
        className="h-auto! border-0! p-0! text-inherit! font-[inherit]! leading-[inherit]! align-baseline! underline decoration-dotted underline-offset-4"
      >
        {value}
      </Button>
    </Popover>
  );
}

export default function WavePlayground({ light }: { light: boolean }) {
  const [settings, setSettings] = useState(presets[2]);
  const [colorOpen, setColorOpen] = useState(false);
  function commitColor(value: string) {
    if (/^#[0-9a-f]{6}$/i.test(value)) {
      setSettings((current) => ({ ...current, wave: value.toLowerCase() }));
    }
  }
  function change(key: keyof WaveSettings, value: number) {
    setSettings((current) => ({ ...current, [key]: value }));
  }
  const studio = `${source}/tools/background-studio?bg=gradient-waves&waveColor=${settings.wave.slice(1)}&amplitude=${settings.amplitude}&swell=${settings.swell}&lightAngle=${settings.lightAngle}&speed=${settings.speed}&tilt=40`;
  const number = (
    key: 'amplitude' | 'swell' | 'lightAngle' | 'speed',
    label: string,
    max: number,
    step: number,
  ) => (
    <EditableValue
      label={label}
      value={settings[key]}
      min={0}
      max={max}
      step={step}
      onChange={(value) => change(key, value)}
    />
  );
  const lines: ReactNode[] = [
    <>
      <span className="text-text-muted">import</span> GradientWaves{' '}
      <span className="text-text-muted">from &apos;./GradientWaves&apos;;</span>
    </>,
    ' ',
    <>
      <span className="text-text-muted">export default function</span> Hero() {'{'}
    </>,
    <>
      <span className="text-text-muted">{'  return'}</span> (
    </>,
    '    <GradientWaves',
    <>
      {'      '}
      <span className="text-text-secondary">waveColor=</span>
      <Popover
        trigger="click"
        title="Wave color"
        open={colorOpen}
        onOpenChange={setColorOpen}
        content={
          <div className="flex w-220px items-center gap-8px">
            <Input
              type="color"
              aria-label="Choose wave color"
              value={settings.wave}
              onChange={(event) => commitColor(event.target.value)}
              className="h-40px w-52px"
            />
            <Input
              key={settings.wave}
              aria-label="Wave hex color"
              defaultValue={settings.wave}
              maxLength={7}
              onBlur={(event) => commitColor(event.target.value)}
              onPressEnter={(event) => commitColor(event.currentTarget.value)}
            />
          </div>
        }
      >
        <Button
          type="text"
          size="small"
          aria-label="Wave color"
          aria-expanded={colorOpen}
          className="h-auto! border-0! p-0! text-inherit! font-[inherit]! leading-[inherit]! align-baseline! underline decoration-dotted underline-offset-4"
        >
          <span
            className="mr-4px inline-block h-9px w-9px rounded-2px"
            style={{ background: settings.wave }}
          />
          &quot;{settings.wave}&quot;
        </Button>
      </Popover>
    </>,
    <>
      {'      '}
      <span className="text-text-secondary">amplitude=</span>
      {'{'}
      {number('amplitude', 'Amplitude', 5, 0.1)}
      {'}'}
    </>,
    <>
      {'      '}
      <span className="text-text-secondary">swell=</span>
      {'{'}
      {number('swell', 'Swell', 60, 1)}
      {'}'}
    </>,
    <>
      {'      '}
      <span className="text-text-secondary">lightAngle=</span>
      {'{'}
      {number('lightAngle', 'Light angle', 360, 1)}
      {'}'}
    </>,
    <>
      {'      '}
      <span className="text-text-secondary">speed=</span>
      {'{'}
      {number('speed', 'Speed', 1, 0.05)}
      {'}'}
    </>,
    '    />',
    '  );',
    '}',
  ];
  return (
    <div
      className="relative mt-48px h-[clamp(560px,59vw,900px)] overflow-hidden rounded-8px border border-solid border-border-subtle max-[899px]:mt-32px max-[899px]:h-auto max-[899px]:aspect-[4/5]"
      data-testid="wave-playground"
    >
      <GradientWaves settings={settings} light={light} />
      <FloatingWindow
        title="Hero.jsx"
        className="left-[6%] top-48px w-[48.6vw] min-w-560px max-w-860px max-[899px]:hidden"
      >
        <pre className="m-0 rounded-12px border border-solid border-border-subtle bg-[var(--landing-well)] py-16px text-14px leading-[1.72] font-[LandingMono,monospace]">
          {lines.map((line, index) => (
            <div key={index} className="flex min-h-24px whitespace-pre">
              <span
                aria-hidden="true"
                className="w-50px shrink-0 pr-20px text-right text-text-muted opacity-55"
              >
                {index + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </pre>
      </FloatingWindow>
      <FloatingWindow
        title="Terminal"
        className="right-[5%] top-84px w-440px max-[899px]:hidden"
        action={<CopyCommand />}
      >
        <div className="overflow-hidden rounded-12px border border-solid border-border-subtle bg-[var(--landing-well)] px-16px py-12px text-11px leading-[1.75] font-[LandingMono,monospace]">
          <div className="whitespace-nowrap">
            <span className="text-text-muted">$ </span>
            {installCommand}
          </div>
          <div className="text-text-secondary">
            <span style={{ color: settings.wave }}>✓</span> Checking registry.
          </div>
          <div className="text-text-secondary">
            <span style={{ color: settings.wave }}>✓</span> Created 2 files.{' '}
            <span className="inline-block h-13px w-7px animate-pulse bg-current opacity-50" />
          </div>
        </div>
      </FloatingWindow>
      <FloatingWindow
        title="Presets"
        className="right-[18.5%] top-252px z-3! w-[29.2vw] min-w-340px max-w-520px max-[899px]:bottom-10px max-[899px]:left-10px max-[899px]:right-10px max-[899px]:top-auto max-[899px]:w-auto max-[899px]:min-w-0"
      >
        <div
          role="radiogroup"
          aria-label="Wave presets"
          className="rounded-12px border border-solid border-border-subtle bg-[var(--landing-well)] p-3px max-[899px]:flex"
        >
          {presets.map((preset) => (
            <Button
              key={preset.name}
              type="text"
              role="radio"
              aria-checked={settings.name === preset.name}
              onClick={() => setSettings(preset)}
              className={`flex! h-46px! w-full! items-center! justify-start! rounded-8px! px-12px! text-14px! max-[899px]:h-44px! max-[899px]:justify-center! max-[899px]:px-0! max-[899px]:text-12px! ${settings.name === preset.name ? 'bg-[var(--landing-selected)]! text-text!' : 'text-text-secondary!'}`}
            >
              <span className="mr-14px flex -space-x-5px max-[899px]:hidden">
                {[preset.horizon, preset.wave, preset.crest].map((color) => (
                  <span
                    key={color}
                    className="h-14px w-14px rounded-full border border-solid border-black/20"
                    style={{ background: color }}
                  />
                ))}
              </span>
              {preset.name}
              <span className="ml-auto text-10px text-text-muted font-[LandingMono,monospace] max-[899px]:hidden">
                amplitude {preset.amplitude} · swell {preset.swell}
              </span>
            </Button>
          ))}
        </div>
        <a
          href={studio}
          className="flex items-center gap-6px px-12px py-16px text-13px text-text-secondary hover:text-text max-[899px]:hidden"
        >
          Open in Background Studio{' '}
          <span
            aria-hidden="true"
            className="i-lucide-arrow-right size-1em align-middle -rotate-45 text-11px"
          />
        </a>
      </FloatingWindow>
    </div>
  );
}
