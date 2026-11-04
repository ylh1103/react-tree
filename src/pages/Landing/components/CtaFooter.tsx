import { Button } from 'antd';
import { useNavigate } from 'react-router';
import logo from '@/assets/logo.jpg';
import { palette } from '../palette';
import { AnimatedContent } from '../reactbits/AnimatedContent';
import { GradientText } from '../reactbits/GradientText';

export function CtaFooter() {
  const navigate = useNavigate();
  return (
    <>
      <section aria-labelledby="cta-title">
        <AnimatedContent className="mx-auto flex max-w-1200px flex-col items-center gap-7 px-5 py-28 text-center md:px-8">
          <h2 id="cta-title" className="m-0 text-balance text-34px font-800 leading-tight text-[var(--lp-ink)] md:text-52px">
            参数修改，从此
            <GradientText colors={[palette.blue, palette.red, palette.blue]} animationSpeed={6}>
              灵动
            </GradientText>
            可控
          </h2>
          <p className="m-0 max-w-560px text-pretty text-16px leading-relaxed text-[var(--lp-muted)]">
            兼容 Spring Boot 2.0 以上应用，完美适配 ZA21 与 ZA24。5 分钟接入，即刻获得版本化、可视化的参数管理能力。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="primary" size="large" onClick={() => void navigate('/')}>
              立即开始
              <span aria-hidden="true" className="i-lucide-arrow-right h-4 w-4" />
            </Button>
            <Button size="large" href="#workflow">
              了解核心功能
            </Button>
          </div>
        </AnimatedContent>
      </section>
      <footer className="border-t border-t-solid border-[var(--lp-line)]">
        <div className="mx-auto flex max-w-1200px flex-col items-center justify-between gap-3 px-5 py-8 text-13px text-[var(--lp-muted)] md:flex-row md:px-8">
          <span className="flex items-center gap-2">
            <img src={logo} alt="" width={20} height={20} className="rounded" />
            灵动参数管家 · 一站式参数管理平台
          </span>
          <span>为行内开发人员提供技术参数管理工具集</span>
        </div>
      </footer>
    </>
  );
}
