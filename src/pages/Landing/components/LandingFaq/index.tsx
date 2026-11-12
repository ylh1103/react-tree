'use client';

import { useState } from 'react';
import { ArrowUpRight, BookOpen, Plus, Users } from 'lucide-react';
import { m as motion, useReducedMotion, type Variants } from 'motion/react';

import { useLandingTheme } from '../../hooks/useLandingTheme';

import supportGroupQr from './support-group-qr.jpg';

const faqs = [
  {
    question: '参数发布后什么时候生效？',
    answer:
      '快照发布到配置中心后，应用需要重启或触发热更新才能加载新值。可以在控制台查看各实例的运行时参数，确认是否已生效。',
  },
  {
    question: '哪些参数支持热更新？',
    answer:
      '配置类使用 @ConfigurationProperties，或读取 @Value 的类添加 @RefreshScope，即满足文档列出的热更新条件之一。',
  },
  {
    question: '发布到生产环境需要什么权限？',
    answer: '办公网可以查询生产参数，发布生产参数前需要提权。接入与配置说明见帮助文档。',
  },
  {
    question: '参数发布有误，怎么回退？',
    answer: '选择历史快照即可回退。应用重新加载配置后，可在控制台核对实例实际读取的参数值。',
  },
  {
    question: '参数快照包含哪些配置？',
    answer: '快照将业务应用参数和它引用的公共模块配置合并，形成发布到配置中心的静态配置。',
  },
  {
    question: '如何在发布前发现生产环境漏配？',
    answer: '将生产环境与选定的基准环境做参数对比，系统会提示生产环境缺少的配置项。',
  },
  {
    question: '修改公共参数前，怎么确认影响范围？',
    answer:
      '先查看系统内的公共参数依赖，确认哪些应用引用了这项配置。修改后留意尚未创建快照的提醒。',
  },
  {
    question: '保存参数时可以检查哪些问题？',
    answer: '可以检查 YAML 缩进、重复节点等格式问题，也可以通过内置或自定义规则检查参数取值。',
  },
  {
    question: 'ZA21 和 ZA24 应用如何接入？',
    answer:
      'ZA21 按应用参数接入流程迁移配置，再添加客户端依赖和配置。ZA24 引入参数客户端，迁移自定义 YAML，完成平台配置后部署并验证。',
  },
];

// 两个链接暂用测试地址，支持群二维码使用已提供的图片。
const channels = [
  {
    icon: BookOpen,
    label: '帮助文档',
    detail: '查看接入说明和使用指南',
    href: 'https://example.org/help',
  },
  {
    icon: Users,
    label: '加入支持群',
    detail: '点击链接或扫码加入支持群',
    href: 'https://example.org/support-group',
  },
];

/** 帮助入口和二维码作为一组，复用 FAQ 的入场节奏。 */
function FaqChannels({ className, variants }: { className?: string; variants: Variants }) {
  return (
    <motion.div className={className} variants={variants}>
      <div
        className={`overflow-hidden rounded-16.8px border border-solid [border-color:var(--faq-doc-border)] [background:var(--faq-doc-background)] [--faq-doc-background:#fff] [--faq-doc-border:#e5e5e5] [--faq-doc-text:#0a0a0a] [--faq-doc-muted:#414141] [--faq-doc-row:rgb(255_255_255/50%)] [--faq-doc-hover:rgb(245_245_245/50%)] [--faq-doc-divider:rgb(229_229_229/60%)] dark:[--faq-doc-background:#0a0a0a] dark:[--faq-doc-border:#1f1f1f] dark:[--faq-doc-text:#fff] dark:[--faq-doc-muted:#d6d6d6] dark:[--faq-doc-row:rgb(17_17_17/50%)] dark:[--faq-doc-hover:rgb(31_31_31/50%)] dark:[--faq-doc-divider:rgb(31_31_31/60%)] [&>a:not(:last-child)]:[border-bottom:1px_solid_var(--faq-doc-divider)]`}
      >
        {channels.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            className="flex cursor-pointer items-center gap-4 [background-color:var(--faq-doc-row)] p-5 text-[var(--faq-doc-text)] transition-colors duration-200 hover:[background-color:var(--faq-doc-hover)] [&:hover>svg]:[color:var(--faq-doc-text)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full [background-color:var(--faq-doc-background)] ring-1 ring-[var(--faq-doc-border)]">
              <channel.icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium tracking-tight">{channel.label}</span>
              <span className="mt-0.5 block text-sm text-[var(--faq-doc-muted)]">
                {channel.detail}
              </span>
            </div>
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[var(--faq-doc-muted)] transition-colors duration-200 motion-reduce:transition-none"
            />
          </a>
        ))}
      </div>
      <figure className="m-0 mt-5 flex flex-col items-center gap-2">
        <img
          src={supportGroupQr}
          alt="支持群二维码"
          width={611}
          height={608}
          className="block h-auto w-176px max-w-full rounded-8px bg-white p-3"
        />
        <figcaption className="text-sm text-text-secondary">扫码加入支持群</figcaption>
      </figure>
    </motion.div>
  );
}

/** 保留 FAQ 6 的双栏、文档入口，解答参数发布常见问题。 */
export default function LandingFaq() {
  const { theme } = useLandingTheme();
  const reduce = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className={theme === 'dark' ? 'dark' : undefined}>
      <div id="faq" style={{ scrollMarginTop: 88 }}>
        <section
          aria-labelledby="landing-faq-heading"
          className="w-full bg-[var(--landing-hero-background)] py-12 lg:py-20"
        >
          <div className="mx-auto w-full max-w-1280px pl-44px pr-32px [@media(max-width:768px)]:px-22px">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-20">
              <motion.div
                variants={container}
                initial={reduce ? false : 'hidden'}
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                className="lg:sticky lg:top-24 lg:self-start"
              >
                <motion.h2
                  id="landing-faq-heading"
                  variants={item}
                  className="m-0 text-3xl font-medium leading-[1.1] tracking-tighter text-neutral-900 dark:text-white sm:text-4xl lg:text-5xl"
                >
                  常见问题
                </motion.h2>
                <motion.p
                  variants={item}
                  className="m-0 mt-5 max-w-md text-base leading-relaxed text-neutral-600 dark:text-neutral-400"
                >
                  了解参数何时生效、如何热更新，以及生产发布和回退时需要注意什么。
                </motion.p>
                <FaqChannels className="mt-10 hidden max-w-md lg:block" variants={item} />
              </motion.div>

              <motion.div
                variants={container}
                initial={reduce ? false : 'hidden'}
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                className="flex min-w-0 flex-col gap-12px lg:gap-8px"
              >
                {faqs.map((faq, index) => {
                  const isOpen = openIndex === index;
                  const triggerId = `landing-faq-question-${index}`;
                  const panelId = `landing-faq-answer-${index}`;

                  return (
                    <motion.div
                      key={faq.question}
                      variants={item}
                      className="rounded-14px border border-solid border-[var(--color-border-subtle)]"
                    >
                      <h3 className="m-0">
                        <button
                          id={triggerId}
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => setOpenIndex(isOpen ? null : index)}
                          className="m-0 flex w-full cursor-pointer items-center justify-between gap-6 rounded-14px border-0 bg-transparent px-20px py-18px text-left text-base font-medium leading-snug text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                        >
                          <span>{faq.question}</span>
                          <Plus
                            aria-hidden="true"
                            size={17}
                            className={`shrink-0 text-[var(--color-text-secondary)] transition-transform duration-350 motion-reduce:transition-none ${isOpen ? 'rotate-135' : ''}`}
                          />
                        </button>
                      </h3>
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={triggerId}
                        aria-hidden={!isOpen}
                        inert={!isOpen}
                        className={`grid transition-[grid-template-rows] duration-350 motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <p className="m-0 mx-20px mb-20px text-15px leading-[1.7] text-[var(--color-text-secondary)]">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div
                variants={container}
                initial={reduce ? false : 'hidden'}
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                className="lg:hidden"
              >
                <FaqChannels variants={item} />
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
