/** 使用示例参数绘制产品界面，切换时让前后两层卡片依次入场。 */
import type { ReactNode } from 'react';
import VersionFlowPreview from './VersionFlowPreview';

const panelClass =
  'overflow-hidden rounded-14px border border-solid border-border-subtle bg-surface [box-shadow:0_14px_36px_-18px_rgba(0,0,0,0.24)] [transform:var(--core-preview-angle,none)] [animation:landing-feature-panel-in_620ms_ease-out_var(--core-preview-delay,110ms)_both_var(--core-preview-play-state)] motion-reduce:animate-none!';
const backPanelClass =
  '[@media(min-width:860px)]:[--core-preview-offset:12px] [@media(min-width:860px)]:[--core-preview-angle:perspective(950px)_rotateY(-13deg)_rotateX(12deg)_rotateZ(-4deg)]';
const floatingClass =
  'relative z-1 [--core-preview-delay:230ms] [@media(min-width:860px)]:[--core-preview-offset:20px] [@media(min-width:860px)]:[--core-preview-angle:perspective(950px)_rotateY(-7deg)_rotateX(6deg)_rotateZ(-2deg)]';
const accentPill =
  'whitespace-nowrap rounded-full bg-[var(--core-feature-tint)] px-2 py-0.5 text-[0.85em] font-600 text-[var(--core-feature-ink)]';

function PreviewStage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="grid aspect-[1.38] isolate items-center px-[6%] py-[5%] text-[clamp(9px,1.05vw,13px)] leading-relaxed [@media(min-width:860px)]:aspect-[1.57]"
    >
      <div
        aria-hidden="true"
        className="relative min-w-0 [animation:landing-feature-preview-in_400ms_ease_both_var(--core-preview-play-state)] motion-reduce:animate-none!"
      >
        {children}
      </div>
    </div>
  );
}

function PanelHeader({ icon, title, meta }: { icon: string; title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-b-solid border-divider px-[5%] py-[3%]">
      <span className="flex items-center gap-2 font-600">
        <span className={`${icon} h-[1.1em] w-[1.1em] shrink-0 text-[var(--core-feature-ink)]`} />
        {title}
      </span>
      <span className={accentPill}>{meta}</span>
    </div>
  );
}

function CodeSample({ lines }: { lines: string[] }) {
  return (
    <div className="grid gap-0.5 font-mono leading-[1.6]">
      {lines.map((line) => (
        <code key={line} className="whitespace-pre">
          {line}
        </code>
      ))}
    </div>
  );
}

export function VersionPreview() {
  return <VersionFlowPreview />;
}

export function RuntimePreview() {
  return (
    <PreviewStage label="运行时参数示意：查看各实例的配置状态，触发热更新，并对比实例运行值与配置中心的值。">
      <div className={`${panelClass} ml-[7%] w-[93%] ${backPanelClass}`}>
        <PanelHeader icon="i-lucide-activity" title="运行时配置" meta="UAT" />
        <div className="grid gap-1 px-[5%] pb-[11%] pt-[4%]">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-7px bg-canvas px-[4%] py-[2.5%]">
            <code>instance-02</code>
            <span className="text-text-secondary">1 项差异</span>
            <span className={accentPill}>热更新</span>
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-7px px-[4%] py-[2.5%]">
            <code>instance-01</code>
            <span className="text-text-secondary">配置一致</span>
            <span className="i-lucide-check h-[1.25em] w-[1.25em] text-success" />
          </div>
        </div>
      </div>
      <div className={`${panelClass} ${floatingClass} -mt-[7%] w-[94%]`}>
        <PanelHeader icon="i-lucide-git-compare-arrows" title="运行时参数比对" meta="1 项差异" />
        <div className="grid grid-cols-2 divide-x divide-solid divide-divider bg-canvas">
          <div className="p-[7%]">
            <div className="mb-1 text-text-secondary">实例运行值</div>
            <CodeSample lines={['job.enabled: true']} />
            <code className="text-text-secondary">batch.size: 500</code>
          </div>
          <div className="p-[7%]">
            <div className="mb-1 text-text-secondary">配置中心</div>
            <CodeSample lines={['job.enabled: true']} />
            <code className="bg-[var(--core-feature-tint)] text-[var(--core-feature-ink)]">
              batch.size: 1000
            </code>
          </div>
        </div>
      </div>
    </PreviewStage>
  );
}
