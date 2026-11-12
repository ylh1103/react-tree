import { m as motion, useReducedMotion } from 'motion/react';
import { useId, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { customEditorThemes, platformEditorThemes } from '@/components/MonacoEditor/themeCatalog';
import { useEditorTheme } from '@/components/MonacoEditor/useEditorTheme';
import { useLandingTheme } from '../../hooks/useLandingTheme';

/** 两路参数经由快照合并，再发布到配置中心。 */
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
  {
    title: '保存参数',
    icon: 'i-lucide-save',
    description: '将业务应用或公共模块的参数保存到参数管家',
  },
  {
    title: '生成快照',
    icon: 'i-lucide-layers',
    description: '合并业务应用和公共模块的配置后生成静态快照',
  },
  { title: '发布快照', icon: 'i-lucide-upload', description: '将最终的参数上传到配置中心' },
  {
    title: '重启/热更新',
    icon: 'i-lucide-refresh-cw',
    description: '重启应用或点击参数管家热更新按钮使参数生效',
  },
];

// 横向布局中，三个节点依次位于相邻步骤之间；窄屏在节点右侧展示说明。
const wideQuery = '(min-width: 1024px)';
const isWide = () => window.matchMedia(wideQuery).matches;

function subscribeToWidth(onChange: () => void) {
  const media = window.matchMedia(wideQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const layouts = {
  horizontal: {
    width: 640,
    height: 188,
    cardWidth: 164,
    sourcePositions: [
      [24, 8],
      [24, 100],
    ],
    sourcePaths: ['M188 48 C214 48 212 94 238 94', 'M188 140 C214 140 212 94 238 94'],
    snapshot: [238, 44],
    uploadPath: 'M402 94 H452',
    destination: [452, 44],
  },
  vertical: {
    width: 360,
    height: 568,
    cardWidth: 152,
    sourcePositions: [
      [12, 8],
      [12, 100],
    ],
    sourcePaths: [
      'M164 48 H172 Q180 48 180 56 V188 Q180 200 168 200 H104 Q88 200 88 216',
      'M88 180 V216',
    ],
    snapshot: [12, 216],
    uploadPath: 'M88 316 V406',
    destination: [12, 406],
  },
} as const;
const ease = [0.22, 1, 0.36, 1] as const;

// 内置配色取自项目安装的 Monaco，静态插图无需加载编辑器运行时。
const builtinPalettes = [
  {
    value: 'vs',
    dark: false,
    background: '#fffffe',
    foreground: '#000000',
    key: '#008080',
    number: '#098658',
  },
  {
    value: 'vs-dark',
    dark: true,
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    key: '#3dc9b0',
    number: '#b5cea8',
  },
  {
    value: 'hc-black',
    dark: true,
    background: '#000000',
    foreground: '#ffffff',
    key: '#3dc9b0',
    number: '#ffffff',
  },
  {
    value: 'hc-light',
    dark: false,
    background: '#ffffff',
    foreground: '#292929',
    key: '#008080',
    number: '#098658',
  },
];
const editorPalettes = [...customEditorThemes, ...builtinPalettes];

const cardRadius = 8;
const cardClass =
  'fill-[var(--landing-preview-frame)] stroke-border-subtle [filter:drop-shadow(0_3px_6px_rgb(0_0_0_/_0.07))]';

/** 各节点共用终端标题栏和参数行，配色随主题及高亮状态切换。 */
function TerminalContent({
  label,
  width,
  rows,
  active = false,
  matchedRows,
}: {
  label: string;
  width: number;
  rows: typeof snapshotRows;
  active?: boolean;
  matchedRows?: typeof snapshotRows;
}) {
  return (
    <g className="text-text">
      <rect
        x="3"
        y="32"
        width={width - 6}
        height={rows.length === 2 ? 45 : 65}
        rx={cardRadius - 3}
        className="fill-[var(--flow-code-background)]"
      />
      {[14, 24, 34].map((x) => (
        <circle
          key={x}
          cx={x}
          cy="16"
          r="2.8"
          className={`transition-colors duration-150 motion-reduce:transition-none ${active && x === 14 ? 'fill-[var(--core-feature-ink)]' : 'fill-[var(--landing-preview-dot)]'}`}
        />
      ))}
      <text x="46" y="17" dominantBaseline="middle" className="fill-current text-14px font-650">
        {label}
      </text>
      {rows.map(({ key, value }, index) => {
        const highlighted = matchedRows?.some((row) => row.key === key && row.value === value);
        return (
          <g key={key} transform={`translate(0 ${index * 17})`}>
            <rect
              x="8"
              y="37"
              width={width - 16}
              height="16"
              rx="3"
              opacity={highlighted ? 1 : 0}
              className={`fill-[var(--core-feature-tint)] transition-opacity duration-150 motion-reduce:transition-none ${highlighted ? 'delay-150' : ''}`}
            />
            <text
              x="17"
              y="50"
              className="fill-[var(--flow-code-foreground)] font-mono text-13px tabular-nums"
            >
              <tspan className="fill-[var(--flow-code-key)]">{key}</tspan>:{' '}
              <tspan className="fill-[var(--flow-code-number)]">{value}</tspan>
            </text>
          </g>
        );
      })}
    </g>
  );
}

function InteractiveFlowCard({
  label,
  rows,
  position,
  width,
  active,
  onActivate,
  onDeactivate,
  description,
  matchedRows,
}: {
  label: string;
  rows: typeof snapshotRows;
  description: string;
  matchedRows?: typeof snapshotRows;
  position: readonly [number, number];
  width: number;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <g
      transform={`translate(${position.join(' ')})`}
      role="button"
      tabIndex={0}
      aria-label={description}
      aria-pressed={active}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDeactivate();
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate();
        }
      }}
      className="group cursor-pointer outline-none"
    >
      <rect
        width={width}
        height={rows.length === 2 ? 80 : 100}
        rx={cardRadius}
        className={`${cardClass} transition-colors duration-150 motion-reduce:transition-none group-focus-visible:stroke-2 group-focus-visible:stroke-[var(--core-feature-ink)] ${active ? 'stroke-[var(--core-feature-ink)]!' : ''}`}
      />
      <TerminalContent
        label={label}
        width={width}
        rows={rows}
        active={active}
        matchedRows={matchedRows}
      />
    </g>
  );
}

function FlowHighlight({ path }: { path: string }) {
  return (
    <path
      d={path}
      pathLength={100}
      strokeDasharray="16 100"
      strokeWidth="3"
      vectorEffect="non-scaling-stroke"
      className="stroke-[var(--core-feature-ink)] [animation:landing-version-highlight_260ms_ease-out_both_var(--core-preview-play-state)] motion-reduce:hidden"
    />
  );
}

// 图示与说明共用时间轴，连线比下一个节点提前出现。
const stepDelay = 0.34;
const entranceDelay = 0.3;

function enterAt(delay: number, offset = 0) {
  return {
    hidden: { opacity: 0, ...(offset ? { y: offset } : {}) },
    visible: {
      opacity: 1,
      ...(offset ? { y: 0 } : {}),
      transition: { duration: 0.44, delay: entranceDelay + delay, ease },
    },
  };
}

export default function VersionFlowPreview() {
  const id = useId();
  const editorTheme = useEditorTheme();
  const { theme } = useLandingTheme();
  const preferredPalette = editorPalettes.find(({ value }) => value === editorTheme);
  // 插图与落地页保持同一明暗模式，避免独立的编辑器偏好让代码区出现反色。
  const palette =
    preferredPalette?.dark === (theme === 'dark')
      ? preferredPalette
      : (customEditorThemes.find(({ value }) => value === platformEditorThemes[theme]) ??
        customEditorThemes[0]);
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<number | 'snapshot' | null>(null);
  const active = typeof hovered === 'number' ? sources[hovered] : null;
  const publishing = hovered === 'snapshot';
  const wide = useSyncExternalStore(subscribeToWidth, isWide, () => false);
  const layout = wide ? layouts.horizontal : layouts.vertical;
  const gridId = `${id}-grid`;

  return (
    <motion.div
      initial={reduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="relative mx-auto grid w-full max-w-440px gap-4 [@media(min-width:1024px)]:max-w-680px"
      style={
        {
          '--flow-code-background': palette.background,
          '--flow-code-foreground': palette.foreground,
          '--flow-code-key': palette.key,
          '--flow-code-number': palette.number,
        } as CSSProperties
      }
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="group"
        aria-label="参数版本化管理流程"
        aria-describedby={`${id}-description`}
        className="block h-auto w-full"
      >
        <desc id={`${id}-description`}>
          应用参数与公共参数合并为快照，再上传至配置中心。合并后端口采用应用参数的 8081。
        </desc>
        <defs>
          <pattern id={gridId} width="15" height="15" patternUnits="userSpaceOnUse">
            <circle
              cx="7.5"
              cy="7.5"
              r="1"
              className="fill-[var(--core-feature-ink)]"
              opacity=".12"
            />
          </pattern>
          <radialGradient id={`${id}-fade`} gradientTransform="translate(-.25 0) scale(1.5 1)">
            <stop offset=".45" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`${id}-mask`}>
            <rect width={layout.width} height={layout.height} fill={`url(#${id}-fade)`} />
          </mask>
        </defs>
        <rect
          width={layout.width}
          height={layout.height}
          fill={`url(#${gridId})`}
          mask={`url(#${id}-mask)`}
        />

        <motion.g
          variants={enterAt(stepDelay - 0.1)}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {layout.sourcePaths.map((path, index) => {
            const lit = hovered === index;
            return (
              <g key={path}>
                <path
                  d={path}
                  strokeWidth={lit ? 1.75 : 1.25}
                  vectorEffect="non-scaling-stroke"
                  className={`transition-[stroke,opacity] duration-150 motion-reduce:transition-none ${lit ? 'stroke-[var(--core-feature-ink)]' : active ? 'stroke-divider opacity-50' : 'stroke-border-subtle'}`}
                />
                {lit && <FlowHighlight path={path} />}
                {hovered === null && (
                  <path
                    d={path}
                    pathLength={100}
                    strokeDasharray="10 90"
                    strokeDashoffset={100}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    style={{ animationDelay: `${index * 0.55}s` }}
                    className="stroke-[var(--core-feature-ink)] [animation:landing-version-trace_2.2s_linear_infinite_var(--core-preview-play-state)] motion-reduce:hidden"
                  />
                )}
              </g>
            );
          })}
        </motion.g>
        <motion.g
          variants={enterAt(stepDelay * 2 - 0.1)}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d={layout.uploadPath}
            strokeWidth={publishing ? 1.75 : 1.25}
            vectorEffect="non-scaling-stroke"
            className={`transition-colors duration-150 motion-reduce:transition-none ${publishing ? 'stroke-[var(--core-feature-ink)]' : 'stroke-border-subtle'}`}
          />
          {publishing && <FlowHighlight path={layout.uploadPath} />}
          {hovered === null && (
            <path
              d={layout.uploadPath}
              pathLength={100}
              strokeDasharray="24 76"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              className="stroke-[var(--core-feature-ink)] [animation:landing-version-upload_2.2s_linear_infinite_var(--core-preview-play-state)] motion-reduce:hidden"
            />
          )}
        </motion.g>

        <motion.g variants={enterAt(0)}>
          {sources.map((source, index) => (
            <InteractiveFlowCard
              key={source.label}
              {...source}
              description={`高亮${source.label}及快照中的对应参数`}
              position={layout.sourcePositions[index]}
              width={layout.cardWidth}
              active={hovered === index}
              onActivate={() => setHovered(index)}
              onDeactivate={() => setHovered(null)}
            />
          ))}
        </motion.g>

        <motion.g
          variants={enterAt(stepDelay)}
          transform={`translate(${layout.snapshot.join(' ')})`}
        >
          <motion.g
            animate={{ scale: active && !reduce ? 1.05 : 1 }}
            transition={{ duration: reduce ? 0 : 0.3, ease }}
            className="origin-center [transform-box:fill-box]"
          >
            {/* 按键和值匹配，避免高亮被应用参数覆盖的公共端口。 */}
            <InteractiveFlowCard
              label="参数快照"
              description="预览快照发布到配置中心"
              position={[0, 0]}
              width={layout.cardWidth}
              rows={snapshotRows}
              matchedRows={active?.rows}
              active={publishing}
              onActivate={() => setHovered('snapshot')}
              onDeactivate={() => setHovered(null)}
            />
          </motion.g>
        </motion.g>

        <motion.g
          variants={enterAt(stepDelay * 2)}
          transform={`translate(${layout.destination.join(' ')})`}
        >
          <rect width={layout.cardWidth} height="100" rx={cardRadius} className={cardClass} />
          <circle
            cx={layout.cardWidth - 16}
            cy="16"
            r="4"
            className="fill-[var(--core-feature-ink)] origin-center [transform-box:fill-box] motion-safe:animate-ping [animation-play-state:var(--core-preview-play-state)]"
          />
          <circle
            cx={layout.cardWidth - 16}
            cy="16"
            r="4"
            className="fill-[var(--core-feature-ink)]"
          />
          <TerminalContent
            label="配置中心"
            width={layout.cardWidth}
            rows={snapshotRows}
            matchedRows={publishing ? snapshotRows : undefined}
          />
        </motion.g>
      </svg>
      <ol
        role="list"
        className="pointer-events-none absolute inset-0 m-0 grid list-none grid-rows-[204fr_132fr_116fr_116fr] p-0 pl-[54%] [@media(min-width:1024px)]:static [@media(min-width:1024px)]:grid-cols-4 [@media(min-width:1024px)]:grid-rows-none [@media(min-width:1024px)]:pl-0"
      >
        {stages.map(({ title, icon, description }, index) => (
          <motion.li
            key={title}
            variants={enterAt(index * stepDelay, 12)}
            className="pointer-events-auto min-w-0 self-center [@media(min-width:1024px)]:self-start [@media(min-width:1024px)]:px-2"
          >
            <div className="flex items-center gap-1.5 text-xs font-600 leading-5 text-text">
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--core-feature-tint)] text-[var(--core-feature-ink)]"
              >
                <span className={`${icon} h-3.5 w-3.5`} />
              </span>
              {title}
            </div>
            <p className="m-0 mt-1.5 text-xs leading-5 text-text-secondary">{description}</p>
          </motion.li>
        ))}
      </ol>
      <style>{`
        @keyframes landing-version-trace {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes landing-version-highlight {
          from { stroke-dashoffset: 0; opacity: 0; }
          18%, 74% { opacity: 1; }
          to { stroke-dashoffset: -100; opacity: 0; }
        }
        @keyframes landing-version-upload {
          from { stroke-dashoffset: 100; }
          50%, to { stroke-dashoffset: 0; }
        }
      `}</style>
    </motion.div>
  );
}
