import '@/pages/ReactBits/template/css/variables.css';
import { TemplateContext } from '@/pages/ReactBits/model/templateContext';
import CTA from '@/pages/ReactBits/template/components/landingnew/CTA/CTA';
import Footer from '@/pages/ReactBits/template/components/landingnew/Footer/Footer';
import { theme as antdTheme } from 'antd';
import LandingActions from '../LandingActions';
import { useLandingTheme } from '../../hooks/useLandingTheme';

const footerLinks = [
  {
    title: '产品介绍',
    links: [
      ['产品能力', '#core-features'],
      ['使用流程', '#how-it-works'],
      ['常见问题', '#faq'],
    ],
  },
  {
    title: '接入文档',
    links: [
      ['应用参数', 'https://doc.cmbchina.com/f/v?id=MkvTb'],
      ['DB 参数', 'https://doc.cmbchina.com/f/v?id=lDALt'],
      ['ZA21 客户端', 'https://doc.cmbchina.com/f/v?id=zuyq7E'],
      ['ZA24 客户端', 'https://doc.cmbchina.com/f/v?id=zuykdn'],
    ],
  },
  {
    title: '快捷入口',
    links: [
      ['进入控制台', '/'],
      ['返回顶部', '#landing-top'],
    ],
  },
] as const;

/** 复用参考页完整的 CTA 和页脚组合，接入落地页当前主题及导航地址。 */
export default function LandingClosing() {
  const { theme, setTheme, root } = useLandingTheme();
  const { token } = antdTheme.useToken();

  return (
    <TemplateContext value={{ theme, setTheme, root }}>
      <div
        data-reactbits-template
        data-theme={theme}
        className="[&_.ln-footer]:bg-[var(--landing-hero-background)]! [&_.ln-footer]:text-text-secondary! [&_.ln-footer-inner]:max-w-1280px! [&_.ln-footer-inner]:pl-44px! [&_.ln-footer-inner]:pr-32px! [@media(max-width:768px)]:[&_.ln-footer-inner]:px-22px! [&_.ln-footer-card]:bg-canvas! [&_.ln-footer-card]:ring-1 [&_.ln-footer-card]:ring-inset [&_.ln-footer-card]:ring-border-subtle [&_.ln-footer-col-title]:text-text! [&_.ln-footer-top_a:hover]:text-text! [&_.ln-cta-card]:bg-surface! [&_.ln-cta-headline]:text-text! [&_.ln-cta-sub]:text-text-secondary!"
      >
        <Footer
          brandHref="#landing-top"
          artworkText="Ling Dong"
          navigation={
            <nav className="ln-footer-nav" aria-label="页脚导航">
              {footerLinks.map(({ title, links }) => (
                <div key={title} className="ln-footer-col">
                  <span className="ln-footer-col-title">{title}</span>
                  {links.map(([label, href]) => (
                    <a key={href} href={href}>
                      {label}
                    </a>
                  ))}
                </div>
              ))}
            </nav>
          }
          credits={
            <>
              <a href="https://github.com/DavidHDev/react-bits">界面素材 · React Bits</a>
              <a href="https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md">素材许可</a>
            </>
          }
          lead={
            <CTA
              actions={
                <LandingActions className="[@media(max-width:600px)]:w-full [@media(max-width:600px)]:flex-col" />
              }
              waveColors={{
                horizonColor: token.colorPrimary,
                waveColor: token.colorPrimaryBorder,
                crestColor: token.colorPrimaryBgHover,
              }}
            />
          }
        />
      </div>
    </TemplateContext>
  );
}
