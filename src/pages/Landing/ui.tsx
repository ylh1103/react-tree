/** 落地页局部排版与真实链接，避免将示意面板变成业务操作。 */
import type { ReactNode } from 'react';
import StarBorder from './components/StarBorder';
export const container = 'mx-auto box-border w-full max-w-1280px px-5 min-[768px]:px-8';
export const section = `${container} py-8 min-[768px]:py-13 scroll-mt-104px`;
export const muted = 'text-[var(--landing-muted)]';
export const secondary =
  'inline-flex min-h-46px items-center justify-center gap-2 rounded-10px border border-solid border-[var(--landing-control)] bg-[var(--landing-surface)] px-5 text-14px font-600 text-inherit no-underline transition-colors hover:bg-[var(--landing-raised)]';
export const illustration = '交互示意 · 非真实运行数据';
export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8 max-w-760px">
      <h2 className="m-0 text-26px font-650 leading-[1.4] min-[768px]:text-34px">{title}</h2>
      {description && <p className={`mb-0 mt-4 text-16px leading-[1.8] ${muted}`}>{description}</p>}
    </div>
  );
}
export function ConsoleLink() {
  return (
    <StarBorder
      as="a"
      href="/"
      hover="reveal"
      sparkle={false}
      clickPulse={false}
      radius={10}
      color="var(--color-accent)"
      trailColor="var(--color-accent)"
      backgroundColor="var(--color-accent)"
      textColor="var(--landing-on-accent)"
      borderColor="var(--color-accent)"
      className="min-h-46px box-border gap-3 px-5! py-3! text-14px active:scale-97"
    >
      进入控制台
      <span aria-hidden="true" className="i-lucide-arrow-up-right" />
    </StarBorder>
  );
}
export function Actions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ConsoleLink />
      <a href="#integration" className={secondary}>
        查看接入指南
        <span aria-hidden="true" className="i-lucide-arrow-down" />
      </a>
    </div>
  );
}
export function DocLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <a
      href={`https://doc.cmbchina.com/f/v?id=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-44px items-center gap-2 text-14px text-inherit underline decoration-[var(--landing-control)] underline-offset-5 hover:text-[var(--landing-link)]"
    >
      {children}
      <span aria-hidden="true" className="i-lucide-arrow-up-right shrink-0" />
      <span className="sr-only">（新标签页，需行内访问权限）</span>
    </a>
  );
}
export function SampleNote() {
  return <p className={`mb-0 mt-5 text-12px leading-[1.7] ${muted}`}>{illustration}</p>;
}
