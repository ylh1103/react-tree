'use client';

import { m as motion } from 'motion/react';
import { useLandingTheme } from '../../hooks/useLandingTheme';

const stats = [
  {
    label: '接入系统数',
    value: '328',
    highlight: false,
  },
  {
    label: '接入应用数',
    value: '2,640',
    highlight: false,
  },
  {
    label: '参数项数',
    value: '125,801',
    highlight: false,
  },
  {
    label: '参数发布次数',
    value: '116,863',
    highlight: true,
  },
];

/** 迁移 Stats 4 原版排版、点阵卡片与指标高亮，展示产品历史统计。 */
export default function LandingAdoptionStats() {
  const { theme } = useLandingTheme();
  return (
    <div className={theme === 'dark' ? 'dark' : undefined}>
      <div id="landing-adoption">
        <section
          aria-labelledby="landing-adoption-heading"
          className="w-full py-12 bg-[var(--landing-hero-background)]"
        >
          <div className="mx-auto w-full max-w-1280px pl-44px pr-32px [@media(max-width:768px)]:px-22px">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
              <div className="flex flex-col self-start gap-5">
                <motion.h2
                  id="landing-adoption-heading"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="m-0 text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-tight"
                >
                  行内使用情况
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="m-0 max-w-md text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg"
                >
                  灵动参数管家已接入行内多个系统和应用，支持集中管理配置、生成快照和发布参数。
                </motion.p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                    className="relative rounded-3xl border border-solid border-neutral-200 dark:border-neutral-800 shadow-md overflow-hidden p-6 min-h-[180px] sm:min-h-[200px] flex flex-col justify-between bg-white dark:bg-neutral-900"
                  >
                    <div
                      className="absolute inset-0 z-0"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.1) 1px, transparent 0)',
                        backgroundSize: '14px 14px',
                      }}
                    />
                    <div
                      className="absolute inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)',
                        backgroundSize: '14px 14px',
                      }}
                    />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div className="flex items-center gap-2">
                        <p
                          className={`m-0 text-sm sm:text-base ${
                            stat.highlight
                              ? 'text-green-600 dark:text-green-500'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {stat.label}
                        </p>
                        {stat.highlight && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600 dark:bg-green-500"></span>
                          </span>
                        )}
                      </div>
                      <p
                        className={`m-0 text-4xl font-medium tracking-tighter tabular-nums sm:text-5xl lg:text-[clamp(32px,3.6vw,60px)] ${
                          stat.highlight
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {stat.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <p className="m-0 text-right text-xs text-neutral-600 dark:text-neutral-400 sm:col-span-2">
                  统计截至 <time dateTime="2025-03-03">2025 年 3 月 3 日</time>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
