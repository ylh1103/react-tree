import LandingActions from '../LandingActions';
import LandingClosingBackground from './LandingClosingBackground';

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

const footerLinkClass = 'w-fit rounded-3px text-inherit layout-focus hover:text-text';

/** 落地页页尾沿用平台主题，组装行动区与页脚导航。 */
export default function LandingClosing() {
  return (
    <footer className="overflow-hidden bg-[var(--landing-hero-background)] pt-[clamp(24px,3vw,40px)] pb-[clamp(32px,4vw,56px)] text-text-secondary">
      <div className="mx-auto max-w-1280px pl-44px pr-32px [@media(max-width:768px)]:px-22px">
        <div className="overflow-hidden rounded-24px bg-canvas p-6px ring-1 ring-inset ring-border-subtle [@media(max-width:700px)]:rounded-20px">
          <section
            aria-labelledby="landing-closing-title"
            className="relative isolate flex flex-col items-center overflow-hidden rounded-18px bg-surface px-6 pt-[clamp(80px,7.5vw,104px)] pb-[clamp(120px,11vw,156px)] text-center [@media(max-width:700px)]:rounded-14px [@media(max-width:600px)]:px-5 [@media(max-width:600px)]:pt-56px [@media(max-width:600px)]:pb-96px"
          >
            <LandingClosingBackground />
            <h2
              id="landing-closing-title"
              className="m-0 mb-3 text-[clamp(28px,4vw,44px)] text-text font-500 leading-[1.1] tracking-[-0.045em]"
            >
              让下一次参数变更，从容一些。
            </h2>
            <p className="m-0 mb-8 max-w-44ch text-14px leading-[1.6]">
              从集中管理到快照发布，通过发布前检查与运行时比对，让每一次参数变更更可控。
            </p>
            <LandingActions className="[@media(max-width:600px)]:w-full [@media(max-width:600px)]:flex-col" />
          </section>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-12 gap-y-8 p-10 [@media(max-width:700px)]:grid-cols-1 [@media(max-width:700px)]:px-22px [@media(max-width:700px)]:py-7">
            <div>
              <a href="#landing-top" className={footerLinkClass}>
                灵动参数管家
              </a>
              <p className="m-0 mt-14px text-13px leading-[1.55]">
                集中化技术参数管理。
                <br />
                快照发布，检查与比对。
              </p>
            </div>
            <nav
              aria-label="页脚导航"
              className="grid row-span-2 grid-cols-[repeat(3,max-content)] gap-x-[clamp(40px,5vw,80px)] text-13px [@media(max-width:700px)]:row-span-1 [@media(max-width:700px)]:grid-cols-3 [@media(max-width:700px)]:gap-x-4 [@media(max-width:600px)]:text-12px"
            >
              {footerLinks.map(({ title, links }) => (
                <div key={title} className="flex flex-col items-start gap-3">
                  <h2
                    id={title === '接入文档' ? 'landing-integration' : undefined}
                    className="m-0 flex min-h-34px scroll-mt-24 items-center text-12px text-text font-500"
                  >
                    {title}
                  </h2>
                  {links.map(([label, href]) => (
                    <a key={href} href={href} className={footerLinkClass}>
                      {label}
                    </a>
                  ))}
                </div>
              ))}
            </nav>
            <div className="flex flex-wrap items-center self-end gap-x-4 gap-y-1.5 text-12px [@media(max-width:600px)]:flex-col [@media(max-width:600px)]:items-start">
              <span>© {new Date().getFullYear()} 灵动参数管家</span>
              <a href="https://github.com/DavidHDev/react-bits" className={footerLinkClass}>
                界面素材 · React Bits
              </a>
              <a
                href="https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md"
                className={footerLinkClass}
              >
                素材许可
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
