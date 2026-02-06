import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import './Contact.css';
import { useLanguage } from '../contexts/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();
  const phoneNumber = "+48 502 557 767";
  const email = "autoglasslupsk@gmail.com";

  return (
    <section id="kontakt" className="contact">
      <div className="container">
        <div className="section-header">
          <h2>{t('contact.title')}</h2>
          <p>{t('contact.subtitle')}</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-card">
              <div className="contact-icon">
                <Phone size={28} />
              </div>
              <h3>{t('contact.phone')}</h3>
              <a href={`tel:${phoneNumber}`} className="contact-link">
                {phoneNumber}
              </a>
              <p>{t('contact.phoneDesc')}</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <Mail size={28} />
              </div>
              <h3>{t('contact.email')}</h3>
              <a href={`mailto:${email}`} className="contact-link">
                {email}
              </a>
              <p>{t('contact.emailDesc')}</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <MapPin size={28} />
              </div>
              <h3>{t('contact.address')}</h3>
              <p className="contact-address">
                ul. Kniaziewicza 1/1<br />
                76-200 Słupsk
              </p>
              <p>{t('contact.addressDesc')}</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <Clock size={28} />
              </div>
              <h3>{t('contact.hours')}</h3>
              <p className="contact-hours" style={{ whiteSpace: 'pre-line' }}>
                {t('contact.hoursValue')}
              </p>
            </div>
          </div>

          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2333.9!2d17.0286!3d54.4645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46fdb8b0c8b8b8b1%3A0x1!2sKniaziewicza%201%2C%20S%C5%82upsk!5e0!3m2!1spl!2spl!4v1234567890"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Auto-Glas Słupsk - ul. Kniaziewicza 1/1, Słupsk"
            />
          </div>
        </div>

        <div className="company-info">
          <h3>{t('contact.companyInfo')}</h3>
          <div className="company-details">
            <p><strong>Auto-Glas Słupsk Sp. z o.o.</strong></p>
            <p>NIP: 8392961720</p>
            <p>REGON: 221499735</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
