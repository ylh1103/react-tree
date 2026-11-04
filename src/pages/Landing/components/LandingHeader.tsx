import { useNavigate } from 'react-router';
import logo from '@/assets/logo.jpg';
import { ActionButton } from './ActionButton';

const navigation = [
  { href: '#features', label: '核心功能' },
  { href: '#advantages', label: '产品优势' },
  { href: '#stats', label: '落地数据' },
  { href: '#compare', label: '方案对比' },
];

/** 顶部悬浮导航：页面滚动后才显出边框与毛玻璃底色。 */
export function LandingHeader({ scrolled }: { scrolled: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 md:px-6">
      <div
        className={`mx-auto flex h-14 max-w-1200px items-center justify-between gap-6 rounded-2xl border border-solid px-3 transition-[background-color,border-color,box-shadow] duration-300 md:px-4 ${
          scrolled
            ? 'border-[var(--lp-line)] bg-[rgba(17,17,21,0.72)] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="flex items-center gap-5">
          <a href="#top" className="flex items-center gap-2.5 text-[var(--lp-fg)] no-underline">
            <img src={logo} alt="" width={24} height={24} className="rounded-md" />
            <span className="text-15px font-700">灵动参数管家</span>
          </a>
          <span aria-hidden="true" className="hidden text-[var(--lp-line)] md:inline">
            /
          </span>
          <nav aria-label="页面导航" className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-14px text-[var(--lp-muted)] no-underline transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--lp-fg)]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <ActionButton size="sm" onClick={() => void navigate('/')}>
          进入平台
        </ActionButton>
      </div>
    </header>
  );
}
