/** 从官方 Navbar 提取首页分支；移除文档站专用的搜索、偏好和路由依赖。 */
import { useEffect, useRef, useState } from 'react';
import { Logo } from '../../common/SVGComponents';
import { FaGithub } from 'react-icons/fa6';
import { LuSun, LuMoon } from 'react-icons/lu';
import { Link } from '@/pages/ReactBits/TemplateLink';
import { templateContent } from '@/pages/ReactBits/content';
import { useColorMode, useTemplateRoot } from '@/pages/ReactBits/hooks/useTemplateTheme';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const root = useTemplateRoot();
  const highlight = useRef(null);
  const { resolvedTheme, toggleColorMode } = useColorMode();
  const light = resolvedTheme === 'light';
  const stars = templateContent.community.stars;
  const formattedStars =
    stars >= 1000 ? `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k` : stars;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const scroll = () => setScrolled(element.scrollTop > 50);
    element.addEventListener('scroll', scroll, { passive: true });
    return () => element.removeEventListener('scroll', scroll);
  }, [root]);
  useEffect(() => {
    if (!menuOpen) return;
    const element = root.current;
    const previous = element.style.overflow;
    element.style.setProperty('overflow', 'hidden');
    const escape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', escape);
    return () => {
      element.style.setProperty('overflow', previous);
      document.removeEventListener('keydown', escape);
    };
  }, [menuOpen, root]);
  function hover(event) {
    const link = event.currentTarget.getBoundingClientRect();
    const parent = event.currentTarget.parentElement.getBoundingClientRect();
    Object.assign(highlight.current.style, {
      width: `${link.width}px`,
      height: `${link.height}px`,
      transform: `translateX(${link.left - parent.left}px)`,
      opacity: '1',
    });
  }
  return (
    <header className={`ln-navbar${scrolled || menuOpen ? ' ln-navbar-scrolled' : ''}`}>
      <div className="ln-navbar-inner">
        <div className="ln-navbar-left">
          <Link
            to="#reactbits-top"
            className="ln-navbar-logo"
            aria-label={templateContent.brand.name}
          >
            {templateContent.brand.logo ? (
              <img
                src={templateContent.brand.logo}
                alt={templateContent.brand.name}
                className="h-20px w-auto"
              />
            ) : templateContent.brand.name === 'React Bits' ? (
              <Logo />
            ) : (
              <span>{templateContent.brand.name}</span>
            )}
          </Link>
          <span className="ln-navbar-divider">/</span>
          <nav
            className="ln-navbar-links"
            aria-label="Main navigation"
            onMouseLeave={() => {
              highlight.current.style.opacity = '0';
            }}
          >
            <div className="ln-navbar-link-highlight" ref={highlight} />
            {templateContent.navigation.map(({ label, to, tag }) => (
              <Link key={to} className="ln-navbar-link" to={to} onMouseEnter={hover}>
                {label}
                {tag && <span className="ln-navbar-tag">{tag}</span>}
              </Link>
            ))}
          </nav>
        </div>
        <div className="ln-navbar-right">
          <button
            type="button"
            className="ln-navbar-icon-btn ln-navbar-theme-btn"
            onClick={toggleColorMode}
            aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {light ? <LuMoon size={16} /> : <LuSun size={16} />}
          </button>
          {templateContent.community.show && (
            <a
              className="ln-navbar-github"
              href={templateContent.community.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub size={16} />
              <span>{formattedStars}</span>
            </a>
          )}
          <a href={templateContent.headerAction.to} className="ln-navbar-pro">
            <span className="ln-navbar-pro-label ln-navbar-pro-label-desktop">
              {templateContent.headerAction.label}
            </span>
            <span className="ln-navbar-pro-label ln-navbar-pro-label-mobile">
              {templateContent.headerAction.shortLabel}
            </span>
          </a>
          <button
            type="button"
            className={`ln-navbar-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="reactbits-menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        {menuOpen && (
          <nav id="reactbits-menu" className="ln-navbar-mobile-menu" aria-label="Mobile navigation">
            {templateContent.navigation.map(({ label, to, tag }) => (
              <Link
                key={to}
                className="ln-navbar-mobile-link"
                to={to}
                onClick={() => setMenuOpen(false)}
              >
                {label}
                {tag && <span className="ln-navbar-tag">{tag}</span>}
              </Link>
            ))}
            {templateContent.community.show && (
              <a
                href={templateContent.community.href}
                className="ln-navbar-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                GitHub<span>{formattedStars}</span>
              </a>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
