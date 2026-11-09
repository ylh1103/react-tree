'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { ChevronDown, TriangleAlert } from 'lucide-react';

// 三种发布前风险共用原版手风琴和预览切换，数据仅用于演示。
type FeatureId = 'missing' | 'dependencies' | 'validation';

const features: {
  id: FeatureId;
  title: string;
  body: string;
  caption: string;
}[] = [
  {
    id: 'missing',
    title: '漏配提示',
    body: '将生产环境与基准环境比对，找出生产环境缺少的配置。',
    caption: '发布前比对生产环境与基准环境',
  },
  {
    id: 'dependencies',
    title: '公共参数依赖',
    body: '查看系统内哪些应用引用了公共参数，确认本次变更的影响范围。',
    caption: '变更公共参数前确认影响范围',
  },
  {
    id: 'validation',
    title: '格式与规则校验',
    body: '检查 YAML 格式和参数取值，在保存前定位具体问题。',
    caption: '保存前定位格式与取值问题',
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const vignetteStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const vignetteItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const previews = {
  missing: { title: '跨环境参数对比', notice: '生产环境缺少队列消费开关' },
  dependencies: { title: '公共参数引用', notice: '公共参数已修改，尚未生成快照' },
  validation: { title: '参数校验', notice: '第 2 行：端口值超出允许范围' },
};

function VignetteCard({ id }: { id: FeatureId }) {
  const { title, notice } = previews[id];

  return (
    <motion.div
      variants={vignetteStagger}
      initial="hidden"
      animate="show"
      className="w-full max-w-sm rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-sm"
    >
      <motion.div
        variants={vignetteItem}
        className="flex flex-wrap items-center justify-between gap-2"
      >
        <span className="text-xs font-semibold text-[var(--color-text)]">{title}</span>
        <span className="rounded-full bg-[var(--color-canvas)] px-2.5 py-1 text-[10px] font-medium text-[var(--color-text-secondary)]">
          示例数据
        </span>
      </motion.div>
      <motion.div
        variants={vignetteItem}
        className="mt-4 rounded-xl bg-[var(--color-canvas)] p-3 text-xs"
      >
        {id === 'missing' && (
          <>
            <code className="block break-all text-[var(--color-text)]">queue.consumer.enabled</code>
            <dl className="m-0 mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2">
                <dt className="text-[var(--color-text-secondary)]">基准环境</dt>
                <dd className="m-0 mt-1 font-mono">true</dd>
              </div>
              <div className="rounded-lg bg-[var(--landing-risk-warning-bg)] p-2">
                <dt className="text-[var(--color-text-secondary)]">生产环境</dt>
                <dd className="m-0 mt-1 font-semibold">未配置</dd>
              </div>
            </dl>
          </>
        )}
        {id === 'dependencies' && (
          <>
            <code className="block break-all text-[var(--color-text)]">queue.consumer.enabled</code>
            <ul aria-label="引用该参数的应用" className="m-0 mt-3 list-none space-y-2 p-0">
              <li className="rounded-lg bg-[var(--color-surface)] px-3 py-2">订单服务</li>
              <li className="rounded-lg bg-[var(--color-surface)] px-3 py-2">通知服务</li>
            </ul>
          </>
        )}
        {id === 'validation' && (
          <pre aria-label="YAML 配置示例" className="m-0 whitespace-pre-wrap leading-6">
            <code>
              <span className="block">
                <span aria-hidden="true" className="mr-3 text-[var(--color-text-secondary)]">
                  1
                </span>
                server:
              </span>
              <span className="block rounded bg-[var(--landing-risk-warning-bg)]">
                <span aria-hidden="true" className="mr-3 text-[var(--color-text-secondary)]">
                  2
                </span>
                {'  port: 70000'}
              </span>
            </code>
          </pre>
        )}
      </motion.div>
      <motion.p
        variants={vignetteItem}
        className="mt-4 flex items-start gap-2 border-t border-[var(--color-border-subtle)] pt-3 text-xs leading-5 text-[var(--color-text-secondary)]"
      >
        <TriangleAlert
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]"
        />
        {notice}
      </motion.p>
    </motion.div>
  );
}

export function Features13() {
  const [activeId, setActiveId] = useState<FeatureId>('missing');
  const active = features.find((feature) => feature.id === activeId) ?? features[0];

  return (
    <section className="w-full bg-[var(--landing-hero-background)] pb-16 pt-6 sm:pb-20 sm:pt-8 lg:pb-24 lg:pt-10">
      <div className="mx-auto w-full max-w-1280px pl-44px pr-32px [@media(max-width:768px)]:px-22px">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="max-w-2xl"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-semibold leading-[1.1] tracking-tight text-[var(--color-text)] sm:text-4xl md:text-5xl"
          >
            发布前，先发现参数风险
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg"
          >
            比对环境配置、查看公共参数依赖、检查格式与取值，把问题留在发布前处理。
          </motion.p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid grid-cols-1 items-start gap-10 sm:mt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16"
        >
          <motion.div
            variants={container}
            className="divide-y divide-[var(--color-border-subtle)] border-y border-[var(--color-border-subtle)]"
          >
            {features.map((feature, index) => {
              const isOpen = feature.id === activeId;
              return (
                <motion.div key={feature.id} variants={fadeUp}>
                  <h3>
                    <button
                      type="button"
                      id={`risk-trigger-${feature.id}`}
                      aria-expanded={isOpen}
                      aria-controls={`risk-panel-${feature.id}`}
                      onClick={() => setActiveId(feature.id)}
                      className="group flex w-full cursor-pointer items-baseline gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px] sm:py-6"
                    >
                      <span className="w-7 shrink-0 text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
                        0{index + 1}
                      </span>
                      <span
                        className={`flex-1 text-lg font-medium tracking-tight transition-colors duration-200 sm:text-xl ${
                          isOpen
                            ? 'text-[var(--color-text)]'
                            : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]'
                        }`}
                      >
                        {feature.title}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className={`self-center transition-colors duration-200 ${
                          isOpen ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        id={`risk-panel-${feature.id}`}
                        role="region"
                        aria-labelledby={`risk-trigger-${feature.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.45,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 sm:pb-7">
                          <p className="max-w-md pl-11 pr-8 text-base leading-relaxed text-[var(--color-text-secondary)]">
                            {feature.body}
                          </p>
                          <div className="mt-6 flex justify-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--landing-risk-preview-bg)] p-4 lg:hidden">
                            <VignetteCard id={feature.id} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="hidden min-h-[480px] flex-col items-center justify-center rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--landing-risk-preview-bg)] p-8 lg:flex"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full flex-col items-center"
              >
                <VignetteCard id={active.id} />
                <p className="mt-6 text-sm text-[var(--color-text-secondary)]">{active.caption}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Features13;
