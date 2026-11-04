import { Button } from 'antd';
import { useNavigate } from 'react-router';
import logo from '@/assets/logo.jpg';

const navigation = [
  { href: '#intro', label: '产品简介' },
  { href: '#advantages', label: '核心优势' },
  { href: '#workflow', label: '核心功能' },
  { href: '#stats', label: '产品现状' },
  { href: '#compare', label: '方案对比' },
];

export function LandingHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 border-b border-b-solid border-[var(--lp-line)] bg-[rgba(245,247,250,0.82)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-1200px items-center justify-between gap-6 px-5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5 text-[var(--lp-ink)] no-underline">
          <img src={logo} alt="" width={28} height={28} className="rounded-md" />
          <span className="text-17px font-700 tracking-wide">灵动参数管家</span>
        </a>
        <nav aria-label="页面导航" className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-14px text-[var(--lp-muted)] no-underline transition-colors hover:text-[var(--lp-blue)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Button type="primary" onClick={() => void navigate('/')}>
          进入平台
        </Button>
      </div>
    </header>
  );
}
