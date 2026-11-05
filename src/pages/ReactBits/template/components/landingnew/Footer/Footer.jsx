import { templateContent } from '@/pages/ReactBits/content';
import { Link } from '@/pages/ReactBits/TemplateLink';
import ReactBitsLogo from '../../../assets/logos/react-bits-logo.svg';
import { proLinkProps } from '../../../utils/pro';
import FooterWaves from './FooterWaves';
import './Footer.css';

const Footer = ({ wide = false, lead = null }) => (
  <footer className={`ln-footer${wide ? ' ln-footer--wide' : ''}${lead ? ' ln-footer--lead' : ''}`}>
    <div className="ln-footer-inner">
      <div className="ln-footer-card">
        {lead}
        <div className="ln-footer-top">
          <div className="ln-footer-brand">
            <Link to="#reactbits-top" aria-label={templateContent.brand.name}>
              {templateContent.brand.name === 'React Bits' || templateContent.brand.logo ? (
                <img
                  className="ln-footer-logo"
                  src={templateContent.brand.logo || ReactBitsLogo}
                  alt={templateContent.brand.name}
                  width="180"
                  height="36"
                />
              ) : (
                <span>{templateContent.brand.name}</span>
              )}
            </Link>
            <p>
              {templateContent.footer.description[0]}
              <br />
              {templateContent.footer.description[1]}
            </p>
          </div>

          <nav className="ln-footer-nav" aria-label="Footer">
            <div className="ln-footer-col">
              <span className="ln-footer-col-title">Community</span>
              <a
                href="https://github.com/DavidHDev/react-bits"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a href="https://vue-bits.dev/" target="_blank" rel="noopener noreferrer">
                Vue Bits
              </a>
              <a href="https://sveltebits.xyz/" target="_blank" rel="noopener noreferrer">
                Svelte Bits
              </a>
            </div>
            <div className="ln-footer-col">
              <span className="ln-footer-col-title">Product</span>
              <Link to="https://reactbits.dev/get-started/introduction">Docs</Link>
              <Link to="https://reactbits.dev/tools">Tools</Link>
              <Link to="https://reactbits.dev/showcase">Showcase</Link>
              <Link to="https://reactbits.dev/sponsors">Sponsors</Link>
            </div>
            <div className="ln-footer-col">
              <span className="ln-footer-col-title">Pro</span>
              <Link to="https://reactbits.dev/pro">What&apos;s in Pro</Link>
              <a
                {...proLinkProps('/docs/components', 'footer', {
                  params: { section: 'components' },
                  sameTab: true,
                })}
              >
                Components
              </a>
              <a
                {...proLinkProps('/docs/blocks', 'footer', {
                  params: { section: 'blocks' },
                  sameTab: true,
                })}
              >
                Blocks
              </a>
              <a
                {...proLinkProps('/docs/templates', 'footer', {
                  params: { section: 'templates' },
                  sameTab: true,
                })}
              >
                Templates
              </a>
            </div>
          </nav>

          <div className="ln-footer-legal">
            <span>
              © {new Date().getFullYear()} {templateContent.brand.name}
            </span>
            <span>
              Built with love by{' '}
              <a href="https://x.com/davidhaz" target="_blank" rel="noopener noreferrer">
                @davidhaz
              </a>
            </span>
            <a
              href="https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              License
            </a>
          </div>
        </div>

        <FooterWaves />
      </div>
    </div>
  </footer>
);

export default Footer;
