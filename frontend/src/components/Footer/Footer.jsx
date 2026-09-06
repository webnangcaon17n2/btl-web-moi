import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiYoutube } from 'react-icons/fi'
import { PiPlantFill } from 'react-icons/pi'
import './Footer.css'

const footerLinks = {
  'Quick Links': [
    { label: 'Home', href: '#' },
    { label: 'Shop', href: '#shop' },
    { label: 'About Us', href: '#about' },
    { label: 'Blog', href: '#blog' },
    { label: 'Contact', href: '#contact' },
  ],
  'Categories': [
    { label: 'Indoor Plants', href: '#' },
    { label: 'Outdoor Plants', href: '#' },
    { label: 'Succulents', href: '#' },
    { label: 'Plant Care', href: '#' },
    { label: 'Pots & Planters', href: '#' },
  ],
  'Support': [
    { label: 'FAQ', href: '#' },
    { label: 'Shipping Info', href: '#' },
    { label: 'Returns', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
}

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <a href="#" className="footer__logo">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6 2 10c0 3 2 5.5 5 7v5h10v-5c3-1.5 5-4 5-7 0-4-4.48-8-10-8z" />
                <path d="M12 2v10" />
                <path d="M8 6c2 2 6 2 8 0" />
              </svg>
              <span>Aether</span>
            </a>
            <p className="footer__desc">
              Bringing nature into your space. We curate the finest indoor and outdoor plants to transform your living environment.
            </p>
            <div className="footer__contact">
              <a href="mailto:hello@aether.com" className="footer__contact-item">
                <FiMail size={16} />
                <span>hello@aether.com</span>
              </a>
              <a href="tel:+1234567890" className="footer__contact-item">
                <FiPhone size={16} />
                <span>+1 (234) 567-890</span>
              </a>
              <div className="footer__contact-item">
                <FiMapPin size={16} />
                <span>New York, NY 10001</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="footer__col">
              <h3 className="footer__col-title">{title}</h3>
              <ul className="footer__links">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="footer__link">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © 2026 Aether. All rights reserved. Made with <PiPlantFill size={14} style={{ verticalAlign: 'middle', color: '#4caf50' }} /> for plant lovers.
          </p>
          <div className="footer__socials">
            <a href="#" className="footer__social" aria-label="Instagram"><FiInstagram size={18} /></a>
            <a href="#" className="footer__social" aria-label="Facebook"><FiFacebook size={18} /></a>
            <a href="#" className="footer__social" aria-label="Twitter"><FiTwitter size={18} /></a>
            <a href="#" className="footer__social" aria-label="YouTube"><FiYoutube size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
