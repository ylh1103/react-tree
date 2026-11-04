import { Button } from 'antd';
import { useNavigate } from 'react-router';
import { palette } from '../palette';
import { Squares } from '../reactbits/Squares';
import { BlurText } from '../reactbits/BlurText';
import { GradientText } from '../reactbits/GradientText';
import { ShinyText } from '../reactbits/ShinyText';
import { AnimatedContent } from '../reactbits/AnimatedContent';
import { ConfigTerminal } from './ConfigTerminal';

const pillars = ['自动化发布', '可视化运维', '版本化管理'];

export function HeroSection() {
  const navigate = useNavigate();
  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden">
      <Squares
        className="absolute inset-0 h-full w-full"
        borderColor="rgba(14,26,43,0.07)"
        hoverFillColor="rgba(22,119,255,0.08)"
      />
      <div className="relative mx-auto grid max-w-1200px items-center gap-14 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
        <div className="flex flex-col items-start gap-7">
          <AnimatedContent distance={12}>
            <p className="m-0 inline-flex items-center gap-2 rounded-full border border-solid border-[var(--lp-line)] bg-[var(--lp-surface)] px-3.5 py-1.5 text-13px">
              <span aria-hidden="true" className="i-lucide-sparkles h-3.5 w-3.5 text-[var(--lp-red)]" />
              <ShinyText
                text="面向行内开发人员的技术参数管理工具集"
                baseColor={palette.muted}
                shineColor={palette.blue}
              />
            </p>
          </AnimatedContent>
          <h1 id="hero-title" className="m-0 flex flex-col gap-3 font-800 leading-[1.08] tracking-tight">
            <GradientText
              colors={[palette.blue, palette.red, palette.blue]}
              animationSpeed={7}
              className="text-48px md:text-68px"
            >
              灵动 · 参数管家
            </GradientText>
            <BlurText
              text="一站式参数管理平台"
              delay={70}
              className="text-36px text-[var(--lp-ink)] md:text-52px"
            />
          </h1>
          <AnimatedContent delay={0.5} distance={16}>
            <p className="m-0 max-w-520px text-pretty text-17px leading-relaxed text-[var(--lp-muted)]">
              实现参数发布的自动化、可视化、版本化管理。降低参数修改的风险，提升操作效率，配置中心异常也不影响系统运行。
            </p>
          </AnimatedContent>
          <AnimatedContent delay={0.65} distance={16} className="flex flex-wrap gap-3">
            <Button type="primary" size="large" onClick={() => void navigate('/')}>
              开始使用
              <span aria-hidden="true" className="i-lucide-arrow-right h-4 w-4" />
            </Button>
            <Button size="large" href="#intro">
              产品介绍
            </Button>
            <Button size="large" type="text" href="#workflow">
              核心功能
            </Button>
          </AnimatedContent>
          <AnimatedContent delay={0.8} distance={8}>
            <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-14px text-[var(--lp-muted)]">
              {pillars.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span aria-hidden="true" className="i-lucide-check h-4 w-4 text-[var(--lp-blue)]" />
                  {item}
                </li>
              ))}
            </ul>
          </AnimatedContent>
        </div>
        <AnimatedContent delay={0.3} distance={40} className="lg:[transform:perspective(1600px)_rotateY(-6deg)]">
          <ConfigTerminal />
        </AnimatedContent>
      </div>
    </section>
  );
}
