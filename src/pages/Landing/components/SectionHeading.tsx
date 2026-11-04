import type { ReactNode } from 'react';
import { AnimatedContent } from '../reactbits/AnimatedContent';

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  id: string;
}

export function SectionHeading({ eyebrow, title, description, id }: SectionHeadingProps) {
  return (
    <AnimatedContent className="flex max-w-720px flex-col gap-4">
      <p className="m-0 flex items-center gap-2 text-13px font-600 tracking-[0.2em] text-[var(--lp-blue)]">
        <span aria-hidden="true" className="h-2px w-6 bg-[var(--lp-red)]" />
        {eyebrow}
      </p>
      <h2 id={id} className="m-0 text-balance text-32px font-700 leading-tight text-[var(--lp-ink)] md:text-44px">
        {title}
      </h2>
      {description && (
        <p className="m-0 text-pretty text-16px leading-relaxed text-[var(--lp-muted)]">{description}</p>
      )}
    </AnimatedContent>
  );
}
