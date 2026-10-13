import { Button, Segmented, Spin, Tag } from 'antd';
import { useState } from 'react';
import { BrandLoading3D, type BrandLoading3DVariant } from '../../../components/BrandLoading3D';

const variants: {
  key: BrandLoading3DVariant;
  letter: string;
  name: string;
  material: string;
  description: string;
}[] = [
  {
    key: 'magnet',
    letter: 'A',
    name: '磨砂双片磁吸',
    material: '柔和高光 · 磁吸回弹 · 1.8s',
    description: '品牌形态稳定，分离时露出厚度，合拢时轻轻回弹。适合日常页面与列表加载。',
  },
  {
    key: 'enamel',
    letter: 'B',
    name: '瓷釉双片翻转',
    material: '亮面边缘 · 错峰翻转 · 2.4s',
    description: '红蓝两片依次翻转，亮面与深色侧面交替出现。适合页面初次加载。',
  },
  {
    key: 'orbital',
    letter: 'C',
    name: '悬浮轨道交换',
    material: '前后穿行 · 空间环绕 · 2.8s',
    description: '双片沿空间轨道前后交换，保留可辨认的红蓝轮廓。空间感最强。',
  },
];

export default function ThreeDimensionalGallery() {
  const [selected, setSelected] = useState<BrandLoading3DVariant>('magnet');
  const [size, setSize] = useState(48);
  const [background, setBackground] = useState('浅色');
  const active = variants.find((item) => item.key === selected)!;
  const sizeClass =
    size === 32
      ? 'text-32px! w-32px! h-32px!'
      : size === 48
        ? 'text-48px! w-48px! h-48px!'
        : 'text-64px! w-64px! h-64px!';
  return (
    <section className="workspace-panel p-5 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h2 className="m-0 text-18px font-600 text-text">给等待一点立体感</h2>
          <p className="m-0 mt-2 text-13px leading-22px text-text-secondary">
            真实厚度、透视与表面高光。先看材质，再看实际页面里的加载效果。
          </p>
        </div>
        <Segmented
          aria-label="展示背景"
          value={background}
          onChange={setBackground}
          options={['浅色', '深色']}
        />
      </header>
      <div className="grid grid-cols-3 gap-5">
        {variants.map((item) => (
          <article
            key={item.key}
            className={`min-w-0 overflow-hidden rounded-ui border border-solid ${selected === item.key ? 'border-accent' : 'border-border-subtle'}`}
          >
            <div
              className={`relative h-176px flex items-center justify-center ${background === '深色' ? 'bg-[#111b2c]' : 'bg-[#f2f5fa]'}`}
            >
              <BrandLoading3D
                variant={item.key}
                data-testid={`brand-3d-${item.key}`}
                className="text-96px"
              />
              <span
                className={`absolute left-4 top-3.5 text-12px font-600 ${background === '深色' ? 'text-white/60' : 'text-text-muted'}`}
              >
                {item.letter}
              </span>
              <div
                className={`absolute right-4 bottom-3.5 flex items-center gap-2.5 ${background === '深色' ? 'text-white/50' : 'text-text-muted'}`}
              >
                <BrandLoading3D variant={item.key} className="text-32px" />
                <span className="text-11px">实际 32px</span>
              </div>
            </div>
            <div className="p-4 bg-surface">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="m-0 text-15px font-600 text-text">{item.name}</h3>
                {item.key === 'magnet' && (
                  <Tag color="blue" className="m-0!">
                    推荐
                  </Tag>
                )}
              </div>
              <p className="m-0 text-11px text-text-muted">{item.material}</p>
              <p className="m-0 mt-3 mb-4 text-12px leading-21px text-text-secondary min-h-42px">
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
      <div className="rounded-ui border border-solid border-border-subtle overflow-hidden">
        <div className="flex items-center justify-between gap-5 bg-sidebar px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-13px font-600 text-text">页面数据加载</span>
            <span className="text-12px text-text-secondary">
              {active.letter} · {active.name}
            </span>
          </div>
          <Segmented
            aria-label="图标尺寸"
            value={size}
            onChange={setSize}
            options={[
              { label: '32px', value: 32 },
              { label: '48px', value: 48 },
              { label: '64px', value: 64 },
            ]}
          />
        </div>
        <div className="relative h-140px bg-surface flex items-center justify-center">
          <div
            className="flex flex-col items-center gap-6"
            role="status"
            aria-label={`${active.name}页面加载预览`}
          >
            <Spin indicator={<BrandLoading3D variant={selected} className={sizeClass} />} />
            <span className="text-12px text-text-secondary">正在获取参数数据…</span>
          </div>
        </div>
      </div>
    </section>
  );
}
