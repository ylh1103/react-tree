import { Button, Segmented, Spin, Tag } from 'antd';
import { useState } from 'react';
import { BrandLoading, type BrandLoadingVariant } from '../../../components/BrandLoading';

const variants: { key: BrandLoadingVariant; name: string; description: string }[] = [
  { key: 'split', name: '分合回弹', description: '红蓝分离、交错起伏，再回弹合拢' },
  { key: 'rotate', name: '整体旋转', description: '完整 Logo 匀速旋转，加载感直接' },
  { key: 'flip', name: '双片翻转', description: '红蓝两片错峰翻转，交叠区随之变化' },
  { key: 'breathe', name: '呼吸缩放', description: '整体放大缩小，节奏柔和、安静' },
  { key: 'bounce', name: '错峰跳动', description: '红蓝轮流弹起，节奏轻快、明显' },
  { key: 'orbit', name: '轨道环绕', description: 'Logo 保持静止，红蓝弧线绕行' },
];

export default function LoadingGallery() {
  const [selected, setSelected] = useState<BrandLoadingVariant>('split');
  const [size, setSize] = useState(32);
  const active = variants.find((item) => item.key === selected)!;

  return (
    <section className="workspace-panel min-h-full flex flex-col">
      <header className="workspace-titlebar justify-between">
        <div className="flex items-center gap-3">
          <h2 className="workspace-page__title">参数项 · Loading 风格</h2>
          <Tag className="m-0!">6 种效果</Tag>
        </div>
        <span className="text-12px text-text-muted">点击预览，比较实际加载尺寸</span>
      </header>
      <div className="p-5 flex flex-col gap-5">
        <div className="grid grid-cols-2 desktop:grid-cols-3 gap-4">
          {variants.map((item, index) => (
            <article
              key={item.key}
              className={`rounded-ui border border-solid p-4 ${selected === item.key ? 'border-accent bg-hover' : 'border-border-subtle bg-surface'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 text-14px text-text font-600">
                  {index + 1}. {item.name}
                </h3>
                {selected === item.key && (
                  <Tag color="blue" className="m-0!">
                    预览中
                  </Tag>
                )}
              </div>
              <div className="h-104px flex items-center justify-center" aria-hidden="true">
                <BrandLoading variant={item.key} className="text-48px" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="m-0 text-12px text-text-secondary leading-20px">{item.description}</p>
                <Button
                  size="small"
                  type={selected === item.key ? 'primary' : 'default'}
                  onClick={() => setSelected(item.key)}
                  aria-label={`预览${item.name}`}
                >
                  预览
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="flex items-center justify-between gap-6 rounded-ui bg-sidebar px-5 py-4">
          <div className="flex items-center gap-5">
            <div
              className="w-80px h-72px flex items-center justify-center"
              role="status"
              aria-label={`${active.name}加载预览`}
            >
              <Spin
                indicator={
                  <BrandLoading
                    variant={selected}
                    className={
                      size === 24
                        ? 'text-24px! w-24px! h-24px!'
                        : size === 32
                          ? 'text-32px! w-32px! h-32px!'
                          : 'text-48px! w-48px! h-48px!'
                    }
                  />
                }
              />
            </div>
            <div>
              <h3 className="m-0 text-14px font-600 text-text">{active.name}</h3>
              <p className="m-0 mt-1.5 text-13px text-text-secondary">正在加载参数项…</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-12px text-text-secondary">图标尺寸</span>
            <Segmented
              value={size}
              onChange={setSize}
              options={[
                { label: '24px', value: 24 },
                { label: '32px', value: 32 },
                { label: '48px', value: 48 },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
