import { Button, Segmented, Spin, Tag } from 'antd';
import { useState } from 'react';
import {
  BrandDataLoading,
  type BrandDataLoadingVariant,
} from '../../../components/BrandDataLoading';

import { dataLoadingStyles } from '../../../components/BrandDataLoading/model/styles';

export default function DataLoadingGallery() {
  const [selected, setSelected] = useState<BrandDataLoadingVariant>('beacon');
  const [size, setSize] = useState(32);
  const [background, setBackground] = useState('浅色');
  const [paused, setPaused] = useState(false);
  const [scope, setScope] = useState('new');
  const variants = dataLoadingStyles.filter(
    (item) => scope === 'all' || (scope === 'new' ? item.isNew : !item.isNew),
  );
  const active = dataLoadingStyles.find((item) => item.key === selected)!;
  const sizeClass =
    size === 24
      ? 'text-24px! w-24px! h-24px!'
      : size === 32
        ? 'text-32px! w-32px! h-32px!'
        : 'text-48px! w-48px! h-48px!';
  return (
    <section
      className={`workspace-panel p-5 flex flex-col gap-5 ${paused ? '[&_svg_*]:[animation-play-state:paused]' : ''}`}
    >
      <header className="flex items-center justify-between gap-6">
        <div>
          <h2 className="m-0 text-18px text-text font-600">
            页面数据加载 · {dataLoadingStyles.length} 款可选风格
          </h2>
          <p className="m-0 mt-2 text-13px text-text-secondary">
            本轮以完整 Logo 为视觉中心，新增四款品牌效果。支持深浅背景和实际尺寸对比。
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Segmented
            aria-label="展示背景"
            value={background}
            onChange={setBackground}
            options={['浅色', '深色']}
          />
        </div>
      </header>
      <div className="flex items-center justify-between gap-4">
        <Segmented
          aria-label="展示方案范围"
          value={scope}
          onChange={(value) => {
            setScope(value);
            const visibleStyles = dataLoadingStyles.filter(
              (item) => value === 'all' || (value === 'new' ? item.isNew : !item.isNew),
            );
            if (!visibleStyles.some((item) => item.key === selected)) {
              setSelected(visibleStyles[0].key);
            }
          }}
          options={[
            {
              value: 'new',
              label: `本轮品牌 ${dataLoadingStyles.filter((item) => item.isNew).length} 款`,
            },
            {
              value: 'existing',
              label: `已有 ${dataLoadingStyles.filter((item) => !item.isNew).length} 款`,
            },
            { value: 'all', label: `全部 ${dataLoadingStyles.length} 款` },
          ]}
        />
        <span className="text-12px text-text-muted">{variants.length} 款效果</span>
      </div>
      <div className="grid grid-cols-2 desktop:grid-cols-4 gap-4">
        {variants.map((item) => (
          <article
            key={item.key}
            className={`min-w-0 rounded-ui overflow-hidden border border-solid ${selected === item.key ? 'border-accent' : 'border-border-subtle'}`}
          >
            <div
              className={`h-136px relative flex items-center justify-center ${background === '深色' ? 'bg-[#142034]' : 'bg-[#f5f7fb]'}`}
            >
              <span
                className={`absolute top-3 left-4 text-12px font-500 ${background === '深色' ? 'text-white/50' : 'text-text-muted'}`}
              >
                {item.letter}
              </span>
              <BrandDataLoading
                variant={item.key}
                className="text-64px"
                data-testid={`data-loading-${item.key}`}
              />
              <div
                className={`absolute right-3 bottom-3 flex items-center gap-2 ${background === '深色' ? 'text-white/50' : 'text-text-muted'}`}
              >
                <BrandDataLoading variant={item.key} className="text-32px" />
                <span className="text-11px">实际 32px</span>
              </div>
            </div>
            <div className="p-4 bg-surface">
              <div className="flex items-center gap-2">
                <h3 className="m-0 text-14px text-text font-600">{item.name}</h3>
                {item.isNew && (
                  <Tag color="blue" className="m-0!">
                    新增
                  </Tag>
                )}
              </div>
              <p className="m-0 mt-1.5 text-11px text-text-muted">{item.rhythm}</p>
              <p className="m-0 mt-3 mb-4 min-h-63px text-12px text-text-secondary leading-21px">
                {item.description}
              </p>
              <Button
                block
                type={selected === item.key ? 'primary' : 'default'}
                onClick={() => setSelected(item.key)}
                aria-label={`预览${item.name}`}
              >
                {selected === item.key ? '正在预览' : '放进页面看看'}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="border border-solid border-border-subtle rounded-ui overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-sidebar">
          <div className="flex items-center gap-3">
            <span className="text-13px font-600 text-text">页面加载预览</span>
            <span className="text-12px text-text-secondary">
              {active.letter} · {active.name}
            </span>
          </div>
          <Segmented
            aria-label="加载图标尺寸"
            value={size}
            onChange={setSize}
            options={[
              { label: '24px', value: 24 },
              { label: '32px', value: 32 },
              { label: '48px', value: 48 },
            ]}
          />
        </div>
        <div
          className="h-128px bg-surface flex items-center justify-center"
          role="status"
          aria-label={`${active.name}页面加载预览`}
        >
          <div className="flex flex-col items-center gap-4">
            <Spin indicator={<BrandDataLoading variant={selected} className={sizeClass} />} />
            <span className="text-12px text-text-muted">正在获取参数数据…</span>
          </div>
        </div>
      </div>
    </section>
  );
}
