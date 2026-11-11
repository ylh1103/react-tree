/** 两路参数经由快照合并，再发布到配置中心。 */
import type { CSSProperties } from 'react';
import { useLandingTheme } from '../../hooks/useLandingTheme';

const sources = [
  {
    label: '应用参数',
    rows: [
      { key: 'key1', value: 1 },
      { key: 'port', value: 8081 },
    ],
  },
  {
    label: '公共参数',
    rows: [
      { key: 'key2', value: 2 },
      { key: 'port', value: 8080 },
    ],
  },
];
const snapshotRows = [
  { key: 'key1', value: 1 },
  { key: 'key2', value: 2 },
  { key: 'port', value: 8081 },
];
const stages = [
  { title: '保存参数', description: '将业务应用或公共模块的参数保存到参数管家' },
  { title: '生成快照', description: '合并业务应用和公共模块的配置后生成静态快照' },
  { title: '发布快照', description: '将最终的参数上传到配置中心' },
  { title: '重启/热更新', description: '重启应用或点击参数管家热更新按钮使参数生效' },
];

// 沿用删除前 /reactbits 的 HeroFrame.css 窗口色值，随落地页主题切换。
const terminalPalette = {
  light: {
    '--terminal-window': 'rgb(242 242 245 / 0.74)',
    '--terminal-window-edge': 'rgb(24 24 27 / 0.07)',
    '--terminal-window-highlight': 'rgb(255 255 255 / 0.95)',
    '--terminal-window-shadow': '0 30px 70px rgb(24 24 27 / 0.16), 0 14px 32px rgb(24 24 27 / 0.1)',
    '--terminal-well': 'rgb(255 255 255 / 0.62)',
    '--terminal-well-edge': 'rgb(24 24 27 / 0.06)',
    '--terminal-title': '#9b98a4',
    '--terminal-output': '#5b5866',
    '--terminal-yaml-key': '#644498',
    '--terminal-yaml-number': '#176352',
  } as CSSProperties,
  dark: {
    '--terminal-window': 'rgb(24 21 30 / 0.8)',
    '--terminal-window-edge': 'rgb(255 255 255 / 0.08)',
    '--terminal-window-highlight': 'rgb(255 255 255 / 0.07)',
    '--terminal-window-shadow': '0 30px 70px rgb(0 0 0 / 0.36), 0 14px 32px rgb(0 0 0 / 0.26)',
    '--terminal-well': 'rgb(8 6 12 / 0.3)',
    '--terminal-well-edge': 'rgb(255 255 255 / 0.055)',
    '--terminal-title': 'rgb(246 244 249 / 0.38)',
    '--terminal-output': 'rgb(246 244 249 / 0.6)',
    '--terminal-yaml-key': '#cdb8f4',
    '--terminal-yaml-number': '#9be0c9',
  } as CSSProperties,
};

function ParameterTerminal({
  title,
  rows,
  version,
  highlightedKey,
}: {
  title: string;
  rows: { key: string; value: number }[];
  version?: string;
  highlightedKey?: string;
}) {
  return (
    <div className="min-w-0 rounded-12px bg-[var(--terminal-window)] px-1 pb-1 [backdrop-filter:blur(24px)_saturate(1.5)] [box-shadow:var(--terminal-window-shadow),inset_0_0_0_1px_var(--terminal-window-edge),inset_0_1px_0_var(--terminal-window-highlight)]">
      <div className="grid h-26px grid-cols-[1fr_auto_1fr] items-center px-0.5 text-11px font-500 leading-4 text-[var(--terminal-title)]">
        <span className="col-start-2">{title}</span>
        {version && (
          <span className="col-start-3 justify-self-end font-mono text-9px">{version}</span>
        )}
      </div>
      <div className="grid rounded-8px bg-[var(--terminal-well)] px-2 py-1.5 [font-family:Geist_Mono,ui-monospace,monospace] text-11px leading-17px text-[var(--terminal-output)] [box-shadow:inset_0_0_0_1px_var(--terminal-well-edge)]">
        {rows.map(({ key, value }) => (
          <code
            key={key}
            className={`min-w-0 [overflow-wrap:anywhere] ${key === highlightedKey ? 'rounded-3px bg-[var(--core-feature-tint)] font-600 [animation:landing-version-port_550ms_ease-out_1050ms_both_var(--core-preview-play-state)] motion-reduce:animate-none!' : ''}`}
          >
            <span className="text-[var(--terminal-yaml-key)]">{key}</span>
            {': '}
            <span className="text-[var(--terminal-yaml-number)]">{value}</span>
          </code>
        ))}
      </div>
    </div>
  );
}

function FlowConnector({ label }: { label: '合并' | '上传' }) {
  return (
    <div className="relative mx-auto h-8 w-px bg-border [@media(min-width:640px)]:h-px [@media(min-width:640px)]:w-10">
      <span
        className={`absolute left-0 top-0 h-3 w-px bg-[linear-gradient(transparent,var(--core-feature-ink))] opacity-0 [animation:landing-version-signal_650ms_ease-out_var(--version-signal-delay)_both_var(--core-preview-play-state)] motion-reduce:hidden [@media(min-width:640px)]:h-px [@media(min-width:640px)]:w-3 [@media(min-width:640px)]:bg-[linear-gradient(90deg,transparent,var(--core-feature-ink))] [@media(min-width:640px)]:[--version-signal-end:translateX(28px)] ${label === '合并' ? '[--version-signal-delay:500ms]' : '[--version-signal-delay:1350ms]'}`}
      />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--core-feature-tint)] px-1.5 text-10px font-600 leading-4 text-[var(--core-feature-ink)] [@media(min-width:640px)]:bottom-1.5 [@media(min-width:640px)]:left-1/2 [@media(min-width:640px)]:top-auto [@media(min-width:640px)]:-translate-x-1/2 [@media(min-width:640px)]:translate-y-0">
        {label}
      </span>
      <span className="i-lucide-chevron-down absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 text-text-secondary [@media(min-width:640px)]:hidden" />
      <span className="i-lucide-chevron-right absolute right-0 top-1/2 hidden h-3 w-3 -translate-y-1/2 text-text-secondary [@media(min-width:640px)]:block" />
    </div>
  );
}

export default function VersionFlowPreview() {
  const { theme } = useLandingTheme();

  return (
    <div
      style={terminalPalette[theme]}
      className="relative isolate mx-auto grid w-full max-w-560px gap-5"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-12 top-0 z-[-1] opacity-40 [background-image:radial-gradient(var(--landing-preview-frame)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse,#000_20%,transparent_75%)]" />
      <div className="mx-auto w-full max-w-380px [@media(min-width:640px)]:grid [@media(min-width:640px)]:max-w-none [@media(min-width:640px)]:grid-cols-[minmax(0,1fr)_16px_40px_minmax(0,1.18fr)_40px_minmax(0,1fr)] [@media(min-width:640px)]:items-center">
        <div className="grid grid-cols-2 gap-3 [@media(min-width:640px)]:grid-cols-1 [@media(min-width:640px)]:auto-rows-fr">
          {sources.map(({ label, rows }) => (
            <ParameterTerminal key={label} title={label} rows={rows} />
          ))}
        </div>
        {/* 分支连到两张来源卡的中点。横排按卡片高度计算，纵排按卡片宽度计算。 */}
        <div className="mx-auto h-4 w-[calc(50%+6px)] rounded-b-8px border-x border-b border-solid border-border border-t-0 [@media(min-width:640px)]:h-[calc(50%+6px)] [@media(min-width:640px)]:w-full [@media(min-width:640px)]:rounded-b-0 [@media(min-width:640px)]:rounded-r-8px [@media(min-width:640px)]:border-l-0 [@media(min-width:640px)]:border-t" />
        <FlowConnector label="合并" />
        <ParameterTerminal
          title="参数快照"
          rows={snapshotRows}
          version="#105"
          highlightedKey="port"
        />
        <FlowConnector label="上传" />
        <ParameterTerminal title="配置中心" rows={snapshotRows} />
      </div>
      <ol className="m-0 grid list-none gap-3 border-t border-t-solid border-divider p-0 pt-4 [@media(min-width:640px)]:grid-cols-4 [@media(min-width:640px)]:gap-3.5">
        {stages.map(({ title, description }, index) => (
          <li
            key={title}
            className="relative min-w-0 rounded-9px border border-solid border-border-subtle bg-surface"
          >
            <div className="flex min-h-8 items-center justify-center rounded-t-8px bg-[var(--core-feature-tint)] px-1 py-1 text-center text-11px font-600 leading-4 text-[var(--core-feature-ink)]">
              {title}
            </div>
            <p className="m-0 px-2 py-1.5 text-center text-10px leading-4 text-text-secondary">
              {description}
            </p>
            {index < stages.length - 1 && (
              <>
                <span className="i-lucide-arrow-down absolute -bottom-3 left-1/2 h-2.5 w-2.5 -translate-x-1/2 text-[var(--core-feature-ink)] [@media(min-width:640px)]:hidden" />
                <span className="i-lucide-arrow-right absolute -right-3.5 top-2.5 hidden h-3 w-3 text-[var(--core-feature-ink)] [@media(min-width:640px)]:block" />
              </>
            )}
          </li>
        ))}
      </ol>
      <style>{`
        @keyframes landing-version-signal {
          0% { opacity: 0; transform: translate(0, 0); }
          30%, 70% { opacity: 0.85; }
          100% { opacity: 0; transform: var(--version-signal-end, translateY(20px)); }
        }
        @keyframes landing-version-port {
          45% { background-color: color-mix(in srgb, var(--core-feature-ink) 20%, transparent); }
        }
      `}</style>
    </div>
  );
}
