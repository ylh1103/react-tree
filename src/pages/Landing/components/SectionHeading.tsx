import type { ReactNode } from 'react';
import { AnimatedContent } from '../reactbits/AnimatedContent';

interface SectionHeadingProps {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function SectionHeading({ id, title, description, action }: SectionHeadingProps) {
  return (
    <AnimatedContent className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-640px flex-col gap-4">
        <h2 id={id} className="m-0 text-balance text-30px font-700 leading-tight tracking-tight md:text-44px">
          {title}
        </h2>
        {description && (
          <p className="m-0 text-pretty text-15px leading-relaxed text-[var(--lp-muted)] md:text-16px">
            {description}
          </p>
        )}
      </div>
      {action}
    </AnimatedContent>
  );
}
