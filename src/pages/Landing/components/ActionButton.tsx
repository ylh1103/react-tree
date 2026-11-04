import type { ReactNode } from 'react';

interface ActionButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'sm';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const base =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-600 no-underline transition-[background-color,border-color,opacity,transform] duration-200 active:scale-97 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-[var(--lp-blue)] focus-visible:outline-offset-2';

const variants = {
  primary: 'border border-solid border-transparent bg-[var(--lp-fg)] text-[var(--lp-bg)] hover:opacity-88',
  ghost:
    'border border-solid border-[var(--lp-line)] bg-[var(--lp-panel)] text-[var(--lp-fg)] hover:border-[rgba(255,255,255,0.22)]',
};

const sizes = { md: 'h-11 px-5 text-14px', sm: 'h-8 px-3 text-13px rounded-lg' };

export function ActionButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled,
  className,
}: ActionButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className ?? ''}`;
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
