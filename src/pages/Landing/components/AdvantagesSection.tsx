import { AnimatedContent } from '../reactbits/AnimatedContent';
import { SectionHeading } from './SectionHeading';

const advantages = [
  {
    before: '参数管理更',
    keyword: '稳健',
    after: '',
    body: '采用参数快照机制实现版本化管理，提供丰富的参数比对模式，轻松掌握参数的变化历程。',
  },
  {
    before: '自动发布更',
    keyword: '高效',
    after: '',
    body: '一键式参数发布和快速回退功能，大幅降低人工操作成本。',
  },
  {
    before: '可视化运维更',
    keyword: '便捷',
    after: '',
    body: '支持参数热更新（含灰度）和运行时参数查看，无需重启应用即可完成更新。',
  },
  {
    before: '',
    keyword: '质量',
    after: '检测更精准',
    body: '发布前静态检查与动态分析降低误配风险；发布后运行时差异扫描，实例级精准定位未生效参数。',
  },
  {
    before: '',
    keyword: '兼容',
    after: '性更广泛',
    body: '兼容 Spring Boot 2.0 以上的应用，完美适配 ZA21 与 ZA24 应用。',
  },
];

export function AdvantagesSection() {
  return (
    <section aria-labelledby="advantages-title" id="advantages" className="scroll-mt-16">
      <div className="mx-auto flex max-w-1200px flex-col gap-12 px-5 py-24 md:px-8">
        <SectionHeading
          id="advantages-title"
          eyebrow="核心优势"
          title="五个“更”，重新定义参数运维"
          description="从修改、检查、发布到生效，每个环节都被纳入可控、可追溯的流程。"
        />
        <ul className="m-0 flex list-none flex-col p-0">
          {advantages.map((item, index) => (
            <li key={item.keyword} className="border-t border-t-solid border-[var(--lp-line)] last:border-b last:border-b-solid">
              <AnimatedContent
                delay={index * 0.05}
                distance={20}
                className="group grid items-baseline gap-3 py-7 transition-colors md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-10"
              >
                <h3 className="m-0 text-28px font-700 text-[var(--lp-ink)] md:text-36px">
                  {item.before}
                  <span className="text-[var(--lp-red)] transition-colors duration-300 group-hover:text-[var(--lp-blue)]">
                    {item.keyword}
                  </span>
                  {item.after}
                </h3>
                <p className="m-0 text-pretty text-15px leading-relaxed text-[var(--lp-muted)] md:text-16px">
                  {item.body}
                </p>
              </AnimatedContent>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
