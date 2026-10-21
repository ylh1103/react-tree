/** 参数项开发展示入口：全部加载图标按展示顺序连续编号，共用网格、预览控件和全局主题变量。 */
import { Button, Select, Spin } from 'antd';
import { useState } from 'react';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { loadingStyles } from '../../../components/LoadingIndicator/model/styles';

export default function LoadingGallery() {
  const [selectedId, setSelectedId] = useState(loadingStyles[0].id);
  const [size, setSize] = useState(32);
  const [paused, setPaused] = useState(false);
  // 开发时调整清单可能移除当前选择，直接回退首项，避免热更新后引用已删除的预览。
  const active = loadingStyles.find((item) => item.id === selectedId) ?? loadingStyles[0];
  const sizeClass =
    size === 24
      ? 'text-24px! w-24px! h-24px!'
      : size === 32
        ? 'text-32px! w-32px! h-32px!'
        : size === 48
          ? 'text-48px! w-48px! h-48px!'
          : 'text-64px! w-64px! h-64px!';

  return (
    <section
      className={`workspace-panel p-5 flex flex-col gap-5 ${paused ? '[&_*]:[animation-play-state:paused]!' : ''}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-18px text-text font-600">参数项 · Loading 图标</h2>
          <p className="m-0 mt-2 text-13px text-text-secondary">
            全部 {loadingStyles.length} 款加载效果，点击图标下方按钮预览实际尺寸。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setPaused((value) => !value)}
            icon={
              <span
                className={paused ? 'i-lucide-play w-13px h-13px' : 'i-lucide-pause w-13px h-13px'}
                aria-hidden="true"
              />
            }
          >
            {paused ? '播放动画' : '暂停比较'}
          </Button>
          <Button
            href="https://www.figma.com/design/nGuwnGEqhAUPemsl61KurO?node-id=2-73"
            target="_blank"
            rel="noreferrer"
          >
            Figma 设计稿
          </Button>
        </div>
      </header>
      <div className="border border-solid border-border-subtle rounded-ui overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-sidebar">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-13px font-600 text-text">页面加载预览</span>
            <span className="text-12px text-text-secondary">{active.name}</span>
          </div>
          <Select
            aria-label="加载图标尺寸"
            value={size}
            onChange={setSize}
            className="min-w-96px"
            options={[24, 32, 48, 64].map((value) => ({ label: `${value}px`, value }))}
          />
        </div>
        <div
          className="h-140px flex items-center justify-center bg-surface"
          role="status"
          aria-label={`${active.name}页面加载预览`}
        >
          <div className="flex flex-col items-center gap-4">
            <Spin indicator={<LoadingIndicator styleId={active.id} className={sizeClass} />} />
            <span className="text-12px text-text-muted">正在获取参数数据…</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
        {loadingStyles.map((item, index) => (
          <article
            key={item.id}
            data-testid={`loading-${item.id}`}
            className={`min-w-0 flex flex-col rounded-ui overflow-hidden border border-solid ${active.id === item.id ? 'border-accent' : 'border-border-subtle'}`}
          >
            <div
              className="h-136px relative flex items-center justify-center bg-sidebar"
              aria-hidden="true"
            >
              <LoadingIndicator styleId={item.id} className="text-64px" />
              <div className="absolute right-3 bottom-3 flex items-center gap-2 text-text-muted">
                <LoadingIndicator styleId={item.id} className="text-32px" />
                <span className="text-11px">实际 32px</span>
              </div>
            </div>
            <div className="p-4 bg-surface flex-1 flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-14px text-text font-600">
                  {index + 1}. {item.name}
                </h3>
              </div>
              {item.rhythm && <p className="m-0 mt-1.5 text-11px text-text-muted">{item.rhythm}</p>}
              <p className="m-0 mt-3 mb-4 text-12px text-text-secondary leading-21px">
                {item.description}
              </p>
              <Button
                block
                className="mt-auto"
                type={active.id === item.id ? 'primary' : 'default'}
                onClick={() => setSelectedId(item.id)}
                aria-label={`预览${item.name}`}
                aria-pressed={active.id === item.id}
              >
                {active.id === item.id ? '正在预览' : '放进页面看看'}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
