'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const parameter = 'queue.consumer.enabled';

const steps = [
  {
    title: '保存参数',
    copy: '在生产环境补齐缺失的队列消费开关，保存本次修改。',
    panelLabel: '参数差异',
    rows: [
      ['修改前', '未配置'],
      ['保存后', 'true'],
    ],
  },
  {
    title: '生成快照',
    copy: '将应用参数与引用的公共参数合并，生成待发布快照。',
    panelLabel: '快照详情',
    rows: [
      ['快照 v24', '待发布'],
      ['配置来源', '应用参数 + 公共参数'],
      ['本次新增', 'true'],
    ],
  },
  {
    title: '发布快照',
    copy: '确认目标环境后发布快照。需要回退时，可选择历史版本。',
    panelLabel: '发布记录',
    rows: [
      ['快照 v24', '发布成功'],
      ['历史快照 v23', '可选作回退版本'],
    ],
  },
  {
    title: '确认生效',
    copy: '根据应用接入方式重启或触发热更新，再核对各实例实际读取的参数。',
    panelLabel: '实例运行时参数',
    rows: [
      ['实例 01', 'true'],
      ['实例 02', 'true'],
    ],
  },
] as const;

/** 沿用 how-it-works-9 的步骤切换，演示同一次参数变更的发布流程。 */
export default function LandingReleaseFlow() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: EASE },
    },
  };

  const selectTab = (index: number) => {
    const next = (index + steps.length) % steps.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectTab(active + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      selectTab(active - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      selectTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      selectTab(steps.length - 1);
    }
  };

  const step = steps[active];

  return (
    <section
      aria-labelledby="hiw9-heading"
      className="w-full bg-[var(--landing-hero-background)] py-12 lg:py-20"
    >
      <div className="mx-auto w-full max-w-1280px pl-44px pr-32px [@media(max-width:768px)]:px-22px">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(320px,0.9fr)_1.25fr] lg:items-start lg:gap-16"
        >
          <motion.div variants={item}>
            <h2
              id="hiw9-heading"
              className="m-0 text-3xl font-medium leading-[1.1] tracking-tight text-[var(--color-text)] text-balance sm:text-4xl lg:text-5xl"
            >
              从保存参数到确认生效
            </h2>
            <p className="m-0 mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
              补齐生产环境的队列消费开关，生成并发布参数快照，最后核对实例实际读取的值。
            </p>

            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="参数发布步骤"
              onKeyDown={handleKeyDown}
              className="mt-8 flex flex-col gap-1.5 lg:mt-10"
            >
              {steps.map((step, index) => {
                const isActive = active === index;
                return (
                  <button
                    key={step.title}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`hiw9-tab-${index}`}
                    aria-selected={isActive}
                    aria-controls="hiw9-panel"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActive(index)}
                    className={`relative w-full cursor-pointer rounded-2xl px-5 py-4 text-left transition-colors duration-200 border-0 bg-transparent font-inherit focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-[var(--color-accent)] ${
                      isActive ? '' : 'hover:bg-[var(--landing-risk-preview-bg)]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="hiw9-indicator"
                        transition={{ duration: 0.4, ease: EASE }}
                        className="absolute inset-0 rounded-2xl bg-[var(--landing-risk-preview-bg)]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative flex items-start gap-4">
                      <span
                        className={`pt-0.5 font-mono text-xs ${
                          isActive
                            ? 'text-[var(--color-text)]'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        0{index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span
                            className={`text-sm font-medium sm:text-base ${
                              isActive
                                ? 'text-[var(--color-text)]'
                                : 'text-[var(--color-text-secondary)]'
                            }`}
                          >
                            {step.title}
                          </span>
                        </span>
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.span
                              key="copy"
                              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                              animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: EASE }}
                              className="block overflow-hidden"
                            >
                              <span className="block pt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                                {step.copy}
                              </span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={item} className="min-w-0">
            <div className="rounded-3xl border border-solid border-[var(--color-border-subtle)] bg-[var(--landing-risk-preview-bg)] p-2">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                  发布详情 · 生产环境
                </span>
                <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                  第 {active + 1} 步 / 共 {steps.length} 步
                </span>
              </div>
              <div
                id="hiw9-panel"
                role="tabpanel"
                tabIndex={0}
                aria-labelledby={`hiw9-tab-${active}`}
                className="min-h-[240px] overflow-hidden rounded-2xl border border-solid border-[var(--color-border-subtle)] bg-[var(--color-surface)] sm:min-h-[300px]"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="p-5 sm:p-7"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="m-0 text-base font-semibold">{step.panelLabel}</h3>
                      <span className="rounded-full bg-[var(--color-canvas)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]">
                        示例数据
                      </span>
                    </div>
                    <code className="mt-4 block break-all rounded-lg bg-[var(--color-canvas)] p-3 text-sm">
                      {parameter}
                    </code>
                    <dl className="m-0 mt-4 grid gap-2">
                      {step.rows.map(([label, value]) => (
                        <div
                          key={label}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-solid border-[var(--color-border-subtle)] px-3 py-2.5 text-sm"
                        >
                          <dt className="text-[var(--color-text-secondary)]">{label}</dt>
                          <dd className="m-0 font-medium">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
