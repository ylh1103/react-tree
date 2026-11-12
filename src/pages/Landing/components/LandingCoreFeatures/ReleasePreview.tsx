/** 落地页发布演示。用独立的示例快照展示版本选择、参数差异与回退。 */
import { Button } from 'antd';
import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from 'react';

const snapshots = [
  { value: 5, timestamp: '2025-05-21 15:35:23', summary: '调整批处理上限', size: 1000, retries: 3 },
  { value: 4, timestamp: '2024-09-23 10:02:57', summary: '更新批处理配置', size: 500, retries: 3 },
  {
    value: 3,
    timestamp: '2024-05-30 11:35:26',
    summary: '调整任务重试次数',
    size: 500,
    retries: 2,
  },
  { value: 2, timestamp: '2022-07-27 09:34:33', summary: '补充任务配置', size: 200, retries: 2 },
  { value: 1, timestamp: '2022-05-24 10:23:21', summary: '初始化参数', size: 100, retries: 1 },
];

type Snapshot = (typeof snapshots)[number];

function yamlRows(snapshot: Snapshot) {
  return [
    { key: 'testBatch', value: '' },
    { key: '  size', value: String(snapshot.size) },
    { key: '  workers', value: '2' },
    { key: 'testJob', value: '' },
    { key: '  retries', value: String(snapshot.retries) },
    { key: '  enabled', value: 'true' },
    { key: '  timeout', value: '1200' },
    { key: 'testApp', value: '' },
    { key: '  env', value: 'test' },
    { key: '  name', value: 'sample-app' },
    { key: '  dataset', value: 'fixture' },
    { key: 'mockApi', value: '' },
    { key: '  host', value: 'api.example.test' },
    { key: '  path', value: '/mock' },
    { key: '  latency', value: '50ms' },
    { key: 'testLog', value: '' },
    { key: '  level', value: 'debug' },
    { key: '  output', value: 'console' },
    { key: 'testCache', value: '' },
    { key: '  ttl', value: '30s' },
    { key: '  prefix', value: 'fixture' },
    { key: 'testServer', value: '' },
    { key: '  port', value: '8081' },
    { key: '  health', value: '/test/health' },
  ];
}

function YamlLine({
  row,
  line,
  changed,
  target = false,
}: {
  row: ReturnType<typeof yamlRows>[number];
  line: number;
  changed: boolean;
  target?: boolean;
}) {
  return (
    <div
      className={`grid min-w-0 grid-cols-[2em_1em_minmax(0,1fr)] px-1 font-mono leading-[1.65] ${target ? 'border-l border-l-solid border-[#3d3d3d]' : ''} ${changed ? (target ? 'bg-[#414f25]' : 'bg-[#453032]') : ''}`}
    >
      <span aria-hidden="true" className="text-right text-[#969696]">
        {line}
      </span>
      <span aria-hidden="true" className="text-center text-[#bcbcbc]">
        {changed && (target ? '+' : '−')}
      </span>
      <code className="whitespace-pre text-[#81c9b0]">
        {row.key}: <span className="text-[#c9a98e]">{row.value}</span>
      </code>
    </div>
  );
}

// 选项保留参考图的两行布局，键盘操作与焦点回收限制在快照选择区域内。
function SnapshotPicker({
  target,
  published,
  onChange,
}: {
  target: Snapshot;
  published: Snapshot;
  onChange: (snapshot: Snapshot) => void;
}) {
  // 首屏呈现参考图中的展开状态，只有主动打开时才移动键盘焦点。
  const [menuState, setMenuState] = useState<'preview' | 'open' | 'closed'>('preview');
  const open = menuState !== 'closed';
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selectedOption = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    if (menuState === 'open') selectedOption.current?.focus();

    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setMenuState('closed');
      }
    }

    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [menuState, open]);

  function closeAndRestoreFocus() {
    setMenuState('closed');
    trigger.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeAndRestoreFocus();
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();

    if (!open) {
      setMenuState('open');
      return;
    }

    const options = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'),
    ];
    const focusedIndex = options.findIndex((option) => option === document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex =
      focusedIndex < 0
        ? step > 0
          ? 0
          : options.length - 1
        : (focusedIndex + step + options.length) % options.length;
    options[nextIndex]?.focus();
  }

  return (
    <div
      ref={container}
      className="min-w-0 max-w-300px flex-1 [@media(min-width:580px)]:relative [@media(min-width:1024px)]:w-400px [@media(min-width:1024px)]:max-w-none [@media(min-width:1024px)]:flex-none"
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenuState('closed');
      }}
    >
      <Button
        ref={trigger}
        size="small"
        aria-label={`快照版本列表，已选择 #${target.value}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setMenuState(open ? 'closed' : 'open')}
        className="w-full justify-between border-accent-border! text-[11px]! [@media(min-width:1024px)]:h-32px! [@media(min-width:1024px)]:text-14px!"
      >
        <span className="truncate">
          <span className="mr-1.5 font-700 text-accent-text">#{target.value}</span>
          <span className="text-text-secondary">{target.timestamp}</span>
        </span>
        <span aria-hidden="true" className="i-lucide-search size-3 shrink-0 text-text-muted" />
      </Button>
      {open && (
        <div
          role="menu"
          aria-label="快照版本列表"
          className="absolute left-0 top-full z-2 mt-1 w-244px max-w-full [@media(min-width:580px)]:w-full [@media(min-width:580px)]:min-w-244px overflow-hidden rounded-4px border border-solid border-border-subtle bg-surface shadow-lg"
        >
          {snapshots.map((snapshot) => (
            <Button
              key={snapshot.value}
              ref={snapshot.value === target.value ? selectedOption : undefined}
              role="menuitemradio"
              aria-checked={snapshot.value === target.value}
              tabIndex={-1}
              type="text"
              className={`h-auto! w-full justify-start rounded-0! px-2! py-1.5! [@media(min-width:1024px)]:px-3! [@media(min-width:1024px)]:py-2! text-left text-[11px]! [@media(min-width:1024px)]:text-14px! leading-snug! focus-visible:outline-offset-[-2px]! ${snapshot.value === target.value ? 'bg-[var(--core-feature-tint)]!' : ''}`}
              onClick={() => {
                onChange(snapshot);
                closeAndRestoreFocus();
              }}
            >
              <span className="block min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="i-lucide-clock size-3 shrink-0" />
                  <span className="whitespace-nowrap">{snapshot.timestamp}</span>
                  <span
                    className={`whitespace-nowrap rounded-2px px-1 ${snapshot.value === 3 ? 'bg-[#f6ffed] text-[#397b14]' : 'bg-[#fffbe6] text-[#8a5c00]'}`}
                  >
                    {snapshot.value === 3 ? '检视通过' : '未检视'}
                  </span>
                  <span className="ml-auto whitespace-nowrap rounded-2px border border-solid border-divider px-1 font-mono">
                    #{snapshot.value}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2 pl-[18px] text-text-secondary">
                  <span>{snapshot.summary}</span>
                  {published.value === snapshot.value && (
                    <span className="text-accent-text">当前发布</span>
                  )}
                </span>
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReleasePreview() {
  const [published, setPublished] = useState(snapshots[1]);
  const [target, setTarget] = useState(snapshots[0]);
  const [tableMode, setTableMode] = useState(false);
  const currentRows = yamlRows(published);
  const targetRows = yamlRows(target);
  const changedRows = targetRows.flatMap(({ key, value }, index) =>
    value === currentRows[index].value
      ? []
      : [{ key: key.trim(), current: currentRows[index].value, next: value }],
  );

  return (
    <section
      aria-label="参数发布演示"
      className="relative isolate grid h-380px w-full grid-rows-[max-content_max-content_692px_max-content] overflow-clip rounded-5px border border-solid border-border-subtle bg-surface p-1.5 text-[11px] leading-relaxed [@media(min-width:1024px)]:h-500px [@media(min-width:1024px)]:p-2"
    >
      {/* 桌面工具栏按参考图保留尺寸，随卡片边界裁切；窄屏仍可换行操作。 */}
      <div className="relative z-2 flex min-w-0 flex-wrap items-center gap-1.5 border-b border-b-solid border-divider pb-1.5 [@media(min-width:1024px)]:flex-nowrap [@media(min-width:1024px)]:gap-3 [@media(min-width:1024px)]:whitespace-nowrap [@media(min-width:1024px)]:text-14px">
        <span className="shrink-0 rounded-3px [@media(min-width:1024px)]:px-2.5 [@media(min-width:1024px)]:py-1 bg-accent px-1.5 py-0.5 text-white">
          发布
        </span>
        <span className="shrink-0 rounded-3px [@media(min-width:1024px)]:px-2.5 [@media(min-width:1024px)]:py-1 bg-[#13a8a8] px-1.5 py-0.5 text-white">
          DEMO
        </span>
        <span className="shrink-0 rounded-3px [@media(min-width:1024px)]:px-2.5 [@media(min-width:1024px)]:py-1 bg-[#4b8d1d] px-1.5 py-0.5 text-white">
          测试
        </span>
        <div className="order-last flex min-w-0 basis-full items-center gap-1 [@media(min-width:580px)]:order-none [@media(min-width:580px)]:basis-auto [@media(min-width:580px)]:grow [@media(min-width:1024px)]:shrink-0 [@media(min-width:1024px)]:gap-2">
          <span className="shrink-0">快照版本列表：</span>
          <SnapshotPicker target={target} published={published} onChange={setTarget} />
        </div>
        <span className="ml-auto hidden shrink-0 rounded-3px border border-solid border-divider px-2 py-1 text-text-secondary [@media(min-width:1024px)]:inline-block">
          普通发布
        </span>
        <Button
          size="small"
          type="primary"
          autoInsertSpace={false}
          disabled={published.value === target.value}
          onClick={() => setPublished(target)}
          className="ml-auto shrink-0 text-[11px]! [@media(min-width:1024px)]:ml-0 [@media(min-width:1024px)]:h-32px! [@media(min-width:1024px)]:text-14px!"
        >
          发布
        </Button>
      </div>
      <div role="group" aria-label="对比模式" className="flex gap-0.5 py-1.5">
        <Button
          size="small"
          type={tableMode ? 'default' : 'text'}
          aria-pressed={!tableMode}
          onClick={() => setTableMode(false)}
          className={`text-[11px]! ${tableMode ? '' : 'text-accent-text!'}`}
        >
          YML 模式对比
        </Button>
        <Button
          size="small"
          type={tableMode ? 'text' : 'default'}
          aria-pressed={tableMode}
          onClick={() => setTableMode(true)}
          className={`text-[11px]! ${tableMode ? 'text-accent-text!' : ''}`}
        >
          表格模式对比
          {changedRows.length > 0 && (
            <span className="text-error">（{changedRows.length} 条差异）</span>
          )}
        </Button>
      </div>
      {/* 对比区保留参考图的完整高度，底部提示随整张预览一起裁切。 */}
      {tableMode ? (
        <table className="w-full self-start border-collapse text-left [&_td]:border-b [&_td]:border-b-solid [&_td]:border-divider [&_td]:p-2 [&_th]:bg-canvas [&_th]:p-2">
          <thead>
            <tr>
              <th>配置键</th>
              <th>当前值</th>
              <th>即将发布的值</th>
            </tr>
          </thead>
          <tbody>
            {changedRows.map(({ key, current, next }) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{current}</td>
                <td>{next}</td>
              </tr>
            ))}
            {changedRows.length === 0 && (
              <tr>
                <td colSpan={3}>参数一致</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-4px text-xs">
          {/* 左右参数共用固定列宽和行高，容器只裁切超出的右侧与底部。 */}
          <div className="grid h-full w-720px grid-cols-2 auto-rows-max overflow-hidden bg-[#1e1e1e]">
            <div className="bg-[#252526] px-2 py-1 text-[#ededed]">配置中心当前参数</div>
            <div className="border-l border-l-solid border-[#3d3d3d] bg-[#252526] px-2 py-1 text-[#ededed]">
              即将发布的参数
            </div>
            {currentRows.map((row, index) => {
              const targetRow = targetRows[index];
              const changed = row.value !== targetRow.value;
              return (
                <Fragment key={row.key}>
                  <YamlLine row={row} line={index + 1} changed={changed} />
                  <YamlLine row={targetRow} line={index + 1} changed={changed} target />
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
      <div
        role="status"
        className="mt-1.5 flex min-w-0 items-center gap-1 overflow-hidden rounded-4px border border-solid border-[#f4ebba] bg-[#fffbe6] px-2 py-1 text-[#654900] [@media(min-width:1024px)]:mt-10px [@media(min-width:1024px)]:min-h-40px [@media(min-width:1024px)]:gap-2 [@media(min-width:1024px)]:px-3 [@media(min-width:1024px)]:text-14px"
      >
        <span
          aria-hidden="true"
          className="i-lucide-info size-3 shrink-0 text-[#b88113] [@media(min-width:1024px)]:size-4"
        />
        <span className="[@media(min-width:1024px)]:shrink-0 [@media(min-width:1024px)]:whitespace-nowrap">
          当前发布 #{published.value} ·{' '}
          {changedRows.length ? `待发布 #${target.value}，请确认差异后发布` : '参数一致'}
        </span>
      </div>
    </section>
  );
}
