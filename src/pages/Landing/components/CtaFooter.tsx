import { useNavigate } from 'react-router';
import logo from '@/assets/logo.jpg';
import { palette } from '../palette';
import { AnimatedContent } from '../reactbits/AnimatedContent';
import { GradientText } from '../reactbits/GradientText';
import { ActionButton } from './ActionButton';

export function CtaFooter() {
  const navigate = useNavigate();
  return (
    <>
      <section aria-labelledby="cta-title" className="mx-auto max-w-1200px px-4 pb-24 md:px-8 md:pb-32">
        <AnimatedContent className="flex flex-col items-center gap-8 rounded-3xl border border-solid border-[var(--lp-line)] bg-[var(--lp-panel)] px-6 py-20 text-center md:py-28">
          <h2 id="cta-title" className="m-0 text-balance text-32px font-700 leading-tight tracking-tight md:text-52px">
            5 分钟，接入
            <GradientText colors={[palette.blue, '#a9c2ff', palette.red, palette.blue]} animationSpeed={7}>
              第一个应用
            </GradientText>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <ActionButton onClick={() => void navigate('/')}>
              开始使用
              <span aria-hidden="true" className="i-lucide-arrow-right h-4 w-4" />
            </ActionButton>
            <ActionButton variant="ghost" href="#features">
              查看核心功能
            </ActionButton>
          </div>
        </AnimatedContent>
      </section>
      <footer className="border-t border-t-solid border-[var(--lp-line)]">
        <div className="mx-auto flex max-w-1200px flex-col items-center justify-between gap-3 px-4 py-8 text-13px text-[var(--lp-muted)] md:flex-row md:px-8">
          <span className="flex items-center gap-2">
            <img src={logo} alt="" width={18} height={18} className="rounded" />
            灵动参数管家
          </span>
          <span className="font-mono text-12px">兼容 Spring Boot 2.0+ · ZA21 · ZA24</span>
        </div>
      </footer>
    </>
  );
}
