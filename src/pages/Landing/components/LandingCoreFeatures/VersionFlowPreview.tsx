/** 展示应用参数覆盖公共参数，以及快照从生成到发布、生效的过程。 */
import type { CSSProperties } from 'react';

const sources = [
  { label: '应用参数', rows: ['key1: 1', 'port: 8081'] },
  { label: '公共参数', rows: ['key2: 2', 'port: 8080'] },
];
const stages = ['保存参数', '生成快照', '发布快照', '重启或热更新'];

function ParameterCard({
  title,
  icon,
  rows,
  snapshot = false,
}: {
  title: string;
  icon: string;
  rows: string[];
  snapshot?: boolean;
}) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-12px border border-solid bg-surface [box-shadow:0_8px_22px_-16px_rgba(0,0,0,0.35)] ${snapshot ? 'border-accent-border' : 'border-border-subtle'}`}
    >
      <div
        className={`flex items-center gap-1.5 border-b border-b-solid border-divider px-2.5 py-2 [@media(min-width:640px)]:px-3 ${snapshot ? 'bg-[var(--core-feature-tint)]' : 'bg-canvas'}`}
      >
        <span
          className={`${icon} h-3.5 w-3.5 shrink-0 ${snapshot ? 'text-[var(--core-feature-ink)]' : 'text-text-secondary'}`}
        />
        <span className="min-w-0 whitespace-nowrap text-11px font-600 leading-4 text-text [@media(min-width:640px)]:text-12px">
          {title}
        </span>
        {snapshot && (
          <span className="ml-auto rounded-5px border border-solid border-accent-border bg-surface px-1.5 font-mono text-10px leading-4 text-[var(--core-feature-ink)]">
            #105
          </span>
        )}
      </div>
      <div className="px-2 py-1 font-mono text-10px leading-4 text-text-secondary [@media(min-width:640px)]:text-11px">
        {rows.map((row, index) => (
          <code
            key={row}
            className={`block whitespace-nowrap px-1.5 py-0.5 ${snapshot && index === rows.length - 1 ? 'rounded-5px bg-[var(--core-feature-tint)] font-600 text-[var(--core-feature-ink)]' : ''}`}
          >
            {row}
          </code>
        ))}
      </div>
    </div>
  );
}

function FlowConnection({ merge = false }: { merge?: boolean }) {
  return (
    <div className="relative mx-auto h-9 w-full [@media(min-width:640px)]:h-92px">
      {merge && (
        <>
          <div className="pointer-events-none absolute left-1/4 right-1/4 top-0 h-3 rounded-b-8px border-x border-b border-solid border-border [@media(min-width:640px)]:hidden" />
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 rounded-r-10px border-y border-r border-solid border-border [@media(min-width:640px)]:block" />
        </>
      )}
      <div
        className={`absolute bottom-0 left-1/2 w-px bg-border [@media(min-width:640px)]:bottom-auto [@media(min-width:640px)]:top-1/2 [@media(min-width:640px)]:h-px ${merge ? 'top-3 [@media(min-width:640px)]:w-1/2' : 'top-0 [@media(min-width:640px)]:left-0 [@media(min-width:640px)]:w-full'}`}
      />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-4px bg-[var(--landing-hero-background)] px-1 text-10px leading-4 text-text-secondary [@media(min-width:640px)]:-mt-3">
        {merge ? '合并' : '上传'}
      </span>
      <span className="i-lucide-chevron-down absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 text-[var(--core-feature-ink)] [@media(min-width:640px)]:hidden" />
      <span className="i-lucide-chevron-right absolute right-0 top-1/2 hidden h-3 w-3 -translate-y-1/2 text-[var(--core-feature-ink)] [@media(min-width:640px)]:block" />
    </div>
  );
}

export default function VersionFlowPreview() {
  return (
    <div className="mx-auto w-full max-w-600px">
      <div className="grid items-center [@media(min-width:640px)]:grid-cols-[minmax(0,1fr)_clamp(36px,3vw,44px)_minmax(0,1.24fr)_clamp(36px,3vw,44px)_minmax(0,0.86fr)]">
        <div className="grid grid-cols-2 gap-2.5 [@media(min-width:640px)]:grid-cols-1">
          {sources.map(({ label, rows }) => (
            <ParameterCard key={label} title={label} icon="i-lucide-file-text" rows={rows} />
          ))}
        </div>
        <FlowConnection merge />
        <ParameterCard
          title="参数快照"
          icon="i-lucide-layers"
          rows={['key1: 1', 'key2: 2', 'port: 8081']}
          snapshot
        />
        <FlowConnection />
        <ParameterCard title="配置中心" icon="i-lucide-server" rows={['port: 8081']} />
      </div>
      <ol className="relative m-0 mt-5 grid list-none grid-cols-4 gap-1 p-0 [@media(min-width:640px)]:mt-9">
        <li className="absolute left-[12.5%] right-[12.5%] top-5px h-px bg-border" />
        {stages.map((label, index) => (
          <li
            key={label}
            className="relative grid justify-items-center gap-2 text-center text-10px leading-4 text-text-secondary [@media(min-width:640px)]:text-11px"
          >
            <span
              className="block h-11px w-11px rounded-full border border-solid border-accent-border bg-surface p-2px"
              style={{ '--version-step-delay': `${330 + index * 430}ms` } as CSSProperties}
            >
              <span className="block h-full w-full rounded-full bg-[var(--core-feature-ink)] [animation:landing-version-step_420ms_ease-out_var(--version-step-delay)_both_var(--core-preview-play-state)] motion-reduce:animate-none!" />
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
      <style>{`
        @keyframes landing-version-step {
          0% { opacity: 0.15; transform: scale(0.7); }
          60% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
