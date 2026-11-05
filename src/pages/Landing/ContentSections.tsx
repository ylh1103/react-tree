/** 静态规模、能力证据、架构、接入与 FAQ；公开 Pro 布局参考均为独立实现。 */
import MagicBento from './components/MagicBento';
import { documents, faqs, integrationSteps } from './content';
import { Actions, DocLink, muted, SampleNote, section, SectionHeading, secondary } from './ui';
import { RuntimeTable, VersionDiff } from './Previews';
export function StatsSection() {
  return (
    <section
      className={`${section} grid items-center gap-8 min-[768px]:grid-cols-[.36fr_.64fr] min-[768px]:gap-12`}
      aria-labelledby="stats-title"
    >
      <div>
        <h2 id="stats-title" className="m-0 text-26px font-650 leading-[1.4] min-[768px]:text-30px">
          已有系统与应用的
          <br className="hidden min-[768px]:block" />
          使用记录。
        </h2>
        <p className={`my-4 text-16px leading-[1.8] ${muted}`}>
          从系统接入到参数发布，集中管理实际使用中的参数配置。
        </p>
        <p className={`m-0 text-14px leading-[1.8] ${muted}`}>
          统计截至 <time dateTime="2025-03-03">2025-03-03</time>
          <br />
          来源：产品介绍文档
        </p>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-4 max-[375px]:grid-cols-1">
        {[
          ['328', '接入系统'],
          ['2,640', '接入应用'],
          ['125,801', '参数项'],
          ['116,863', '参数发布次数'],
        ].map(([value, label]) => (
          <div
            key={label}
            className="flex flex-col-reverse gap-2 rounded-12px border border-solid border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 min-[768px]:p-6"
          >
            <dt className={`text-14px ${muted}`}>{label}</dt>
            <dd className="m-0 text-30px font-600 leading-[1.2] tracking-tight tabular-nums min-[1200px]:text-38px">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
export function CapabilitiesSection() {
  return (
    <section className={section} aria-label="核心能力展示">
      <SectionHeading
        title="修改前有检查，发布后有核对。"
        description="发布前发现问题，发布时掌握变化，发布后确认生效。"
      />
      <MagicBento
        items={[
          {
            id: 'checks',
            wide: true,
            content: (
              <div className="grid items-start gap-8 min-[900px]:grid-cols-[.4fr_.6fr]">
                <div>
                  <span
                    aria-hidden="true"
                    className="i-lucide-scan-line mb-5 text-28px text-[var(--landing-link)]"
                  />
                  <h3 className="m-0 text-23px leading-[1.5]">发布前，检查配置中的疑点</h3>
                  <p className={`text-15px leading-[1.8] ${muted}`}>
                    从格式、规则、host 和推荐取值等维度发现异常，辅助开发人员判断修改是否合理。
                  </p>
                </div>
                <div>
                  <div className="overflow-hidden rounded-10px border border-solid border-[var(--landing-border)] bg-[var(--landing-canvas)]">
                    {[
                      ['格式检查', 'YAML 缩进异常', '保存阶段阻断'],
                      ['规则检查', '端口超出范围', '检查提示'],
                      ['推荐取值', '取值需要复核', '建议人工核对'],
                    ].map(([label, reason, result]) => (
                      <div
                        key={label}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-b-solid border-[var(--landing-border)] p-4 last:border-b-0"
                      >
                        <div>
                          <p className="m-0 text-14px font-600">{label}</p>
                          <p className={`mb-0 mt-1 text-13px ${muted}`}>{reason}</p>
                        </div>
                        <span className="rounded-5px bg-[var(--landing-raised)] px-2 py-1 text-12px">
                          {result}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className={`mb-0 mt-4 text-12px leading-[1.8] ${muted}`}>
                    检查类型示意，规则配置与阻断策略以实际产品为准。
                  </p>
                  <SampleNote />
                </div>
              </div>
            ),
          },
          {
            id: 'versions',
            content: (
              <>
                <span
                  aria-hidden="true"
                  className="i-lucide-git-compare-arrows mb-5 text-26px text-[var(--landing-link)]"
                />
                <h3 className="m-0 text-22px">发布时，看清版本与差异</h3>
                <p className={`mb-6 text-15px leading-[1.8] ${muted}`}>
                  比对不同环境与快照版本，明确本次变更内容，并保留返回历史版本的路径。
                </p>
                <VersionDiff compact />
                <p className={`text-13px leading-[1.8] ${muted}`}>
                  修改前后并排查看，保留历史版本作为回退依据。
                </p>
                <SampleNote />
              </>
            ),
          },
          {
            id: 'runtime',
            content: (
              <>
                <span
                  aria-hidden="true"
                  className="i-lucide-monitor-check mb-5 text-26px text-[var(--landing-link)]"
                />
                <h3 className="m-0 text-22px">发布后，查看实例实际参数</h3>
                <p className={`mb-6 text-15px leading-[1.8] ${muted}`}>
                  查看实例运行时配置差异，辅助定位未生效或被其他配置来源覆盖的参数。
                </p>
                <RuntimeTable />
                <p className={`text-13px leading-[1.8] ${muted}`}>
                  结合配置来源进一步排查，不仅凭差异自动断定原因。
                </p>
                <SampleNote />
              </>
            ),
          },
        ]}
      />
    </section>
  );
}
export function IntegrationSection() {
  return (
    <section id="integration" className={section} aria-label="架构与接入指南">
      <SectionHeading title="控制台管理变更，SDK 连接应用运行时。" />
      <MagicBento
        columns={3}
        items={[
          {
            id: 'console',
            content: (
              <>
                <span
                  aria-hidden="true"
                  className="i-lucide-panels-top-left mb-5 text-26px text-[var(--landing-link)]"
                />
                <h3 className="m-0 text-20px">参数管家控制台</h3>
                <p className={`mb-0 text-15px leading-[1.8] ${muted}`}>
                  集中维护参数，查看版本、差异与操作入口。
                </p>
              </>
            ),
          },
          {
            id: 'service',
            content: (
              <>
                <span
                  aria-hidden="true"
                  className="i-lucide-layers mb-5 text-26px text-[var(--landing-link)]"
                />
                <h3 className="m-0 text-20px">参数服务</h3>
                <p className={`mb-0 text-15px leading-[1.8] ${muted}`}>
                  承担参数存储、快照生成与版本管理。
                </p>
              </>
            ),
          },
          {
            id: 'sdk',
            content: (
              <>
                <span
                  aria-hidden="true"
                  className="i-lucide-boxes mb-5 text-26px text-[var(--landing-link)]"
                />
                <h3 className="m-0 text-20px">参数增强 SDK</h3>
                <p className={`mb-0 text-15px leading-[1.8] ${muted}`}>
                  应用侧集成组件，支持参数热更新与文件故障转移。
                </p>
              </>
            ),
          },
        ]}
      />
      <p className={`mt-5 text-14px leading-[1.8] ${muted}`}>
        选定参数快照发布到配置中心；应用按接入条件加载配置。SDK
        的热更新与文件故障转移条件，请按接入文档核对。
      </p>
      <div className="mt-14 min-[768px]:mt-20">
        <SectionHeading
          title="按五个步骤，开始集中管理参数。"
          description="五步是接入任务清单；ZA21 与 ZA24 的具体迁移和配置方式，请分别查阅文档。"
        />
        <div className="grid items-start gap-8 min-[900px]:grid-cols-2">
          <ol className="m-0 list-none p-0">
            {integrationSteps.map(([title, description], index) => (
              <li
                key={title}
                className="flex gap-4 border-b border-b-solid border-[var(--landing-border)] py-4 first:pt-0"
              >
                <span
                  aria-hidden="true"
                  className="flex h-30px w-30px shrink-0 items-center justify-center rounded-full bg-[var(--landing-raised)] text-12px"
                >
                  0{index + 1}
                </span>
                <div>
                  <h3 className="m-0 text-16px font-600">{title}</h3>
                  <p className={`mb-0 mt-2 text-14px leading-[1.7] ${muted}`}>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div>
            <MagicBento
              items={documents.map((doc) => ({
                id: doc.id,
                wide: true,
                content: (
                  <>
                    <span
                      aria-hidden="true"
                      className="i-lucide-book-open mb-4 text-24px text-[var(--landing-link)]"
                    />
                    <h3 className="m-0 text-20px">{doc.title}</h3>
                    <p className={`text-14px leading-[1.8] ${muted}`}>{doc.description}</p>
                    <DocLink id={doc.id}>{doc.label}</DocLink>
                  </>
                ),
              }))}
            />
            <div className="mt-4 flex flex-wrap gap-x-6">
              <DocLink id="MkvTb">应用参数接入文档</DocLink>
              <DocLink id="lDALt">DB 参数接入文档</DocLink>
            </div>
            <p className={`m-0 text-12px leading-[1.8] ${muted}`}>
              文档将在新标签页打开，需行内访问权限；地址可用性待确认。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
export function FaqSection() {
  return (
    <section
      id="faq"
      className={`${section} grid items-start gap-8 min-[768px]:grid-cols-[.34fr_.66fr] min-[768px]:gap-12`}
      aria-label="常见问题"
    >
      <div className="rounded-14px bg-[var(--landing-surface)] p-6 min-[768px]:sticky min-[768px]:top-104px min-[768px]:p-7 [@media(max-height:650px)]:static!">
        <span
          aria-hidden="true"
          className="i-lucide-messages-square mb-5 text-28px text-[var(--landing-link)]"
        />
        <h2 className="m-0 text-26px font-650 leading-[1.4]">
          接入前，你可能
          <br className="hidden min-[1200px]:block" />
          还想了解。
        </h2>
        <p className={`my-5 text-15px leading-[1.8] ${muted}`}>
          这里整理了热更新、版本回退与客户端接入的常见问题。更完整的操作步骤，请查阅接入指南。
        </p>
        <a href="#integration" className={`${secondary} mb-4`}>
          查看接入指南
        </a>
        <div className="flex flex-col items-start">
          <DocLink id="zuyq7E">ZA21 接入文档</DocLink>
          <DocLink id="zuykdn">ZA24 接入文档</DocLink>
        </div>
      </div>
      <div className="grid items-start gap-4 min-[1200px]:grid-cols-2">
        {[faqs.slice(0, 3), faqs.slice(3)].map((group, index) => (
          <div key={index} className="grid items-start gap-4">
            {group.map(([question, answer]) => (
              <details
                key={question}
                className="rounded-12px border border-solid border-[var(--landing-border)] bg-[var(--landing-surface)] [&[open]_.faq-indicator]:rotate-45"
              >
                <summary className="flex min-h-64px cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-16px font-600 leading-[1.7] [&::-webkit-details-marker]:hidden">
                  <span>{question}</span>
                  <span
                    aria-hidden="true"
                    className="faq-indicator i-lucide-plus shrink-0 text-18px transition-transform duration-200"
                  />
                </summary>
                <p className={`m-0 px-5 pb-5 text-15px leading-[1.8] ${muted}`}>{answer}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
export function ClosingSection() {
  return (
    <>
      <section className={section} aria-label="开始使用">
        <div className="flex flex-col items-start justify-between gap-8 border-y border-y-solid border-[var(--landing-border)] py-12 min-[1200px]:flex-row min-[1200px]:items-center">
          <div className="max-w-650px">
            <h2 className="m-0 text-26px font-650 leading-[1.5] min-[768px]:text-32px">
              从下一次参数变更开始，
              <br className="hidden min-[768px]:block" />
              建立清晰的版本与发布流程。
            </h2>
            <p className={`mb-0 mt-4 text-16px leading-[1.8] ${muted}`}>
              查看接入步骤，或进入控制台管理你的系统与应用。
            </p>
          </div>
          <Actions />
        </div>
      </section>
      <footer
        className={`${section} flex flex-wrap items-start justify-between gap-6 pt-3! pb-10!`}
      >
        <div>
          <p className="m-0 text-16px font-650">灵动参数管家</p>
          <p className={`mb-0 mt-3 text-13px leading-[1.8] ${muted}`}>
            面向行内开发人员的技术参数管理工具集
          </p>
        </div>
        <nav aria-label="页脚文档" className="flex flex-wrap gap-x-6">
          <DocLink id="MkvTb">应用参数文档</DocLink>
          <DocLink id="lDALt">DB 参数文档</DocLink>
          <a
            href="#top"
            className="inline-flex min-h-44px items-center text-14px text-inherit underline underline-offset-5"
          >
            返回顶部
          </a>
        </nav>
      </footer>
    </>
  );
}
