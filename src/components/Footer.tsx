import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import './Footer.css';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const phoneNumber = "+48 502 557 767";
  const email = "autoglasslupsk@gmail.com";

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-col">
            <h3>AUTO-GLAS<span>Słupsk</span></h3>
            <p>{t('footer.description')}</p>
            <div className="social-links">
              <a href="https://www.facebook.com/autoglasslupsk" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t('footer.services')}</h4>
            <ul>
              <li><a href="#pojazdy">{t('footer.passengerCars')}</a></li>
              <li><a href="#pojazdy">{t('footer.trucks')}</a></li>
              <li><a href="#pojazdy">{t('footer.construction')}</a></li>
              <li><a href="#oferta">{t('footer.adasCalibration')}</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.information')}</h4>
            <ul>
              <li><a href="#oferta">{t('footer.aboutUs')}</a></li>
              <li><a href="#realizacje">{t('footer.projects')}</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.contact')}</h4>
            <ul className="contact-list">
              <li>
                <Phone size={16} />
                <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>
              </li>
              <li>
                <Mail size={16} />
                <a href={`mailto:${email}`}>{email}</a>
              </li>
              <li>
                <MapPin size={16} />
                <span>ul. Kniaziewicza 1/1<br />76-200 Słupsk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Auto-Glas Słupsk. {t('footer.rights')}.</p>
          <div className="footer-links">
            <a href="#">{t('footer.privacy')}</a>
            <a href="#">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
