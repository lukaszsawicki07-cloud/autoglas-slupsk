import { Phone, FileText } from 'lucide-react';
import './Hero.css';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  onQuoteClick: () => void;
}

const Hero = ({ onQuoteClick }: HeroProps) => {
  const { language } = useLanguage();
  const phoneNumber = "+48 502 557 767";

  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="container hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            {language === 'pl' ? (
              <>Wymiana i Naprawa Szyb<br />w Każdym Pojeździe</>
            ) : (
              <>Car Glass Repair and Replacement<br />For All Vehicle Types</>
            )}
          </h1>
          <p className="hero-subtitle">
            {language === 'pl' ? 'Szybko, Profesjonalnie, Kompleksowo' : 'Fast, Professional, Comprehensive'}
          </p>
          <p className="hero-description">
            {language === 'pl' ? 'Osobowe • Ciężarowe • Maszyny Budowlane' : 'Cars • Trucks • Construction Equipment'}
          </p>
          <div className="hero-cta">
            <a href={`tel:${phoneNumber}`} className="btn btn-primary">
              <Phone size={20} />
              {language === 'pl' ? 'Zadzwoń Teraz' : 'Call Now'}
            </a>
            <button onClick={onQuoteClick} className="btn btn-secondary">
              <FileText size={20} />
              {language === 'pl' ? 'Szybka Wycena' : 'Quick Quote'}
            </button>
          </div>
          <div className="hero-features">
            <div className="feature-badge">{language === 'pl' ? 'Markowe Szyby' : 'Branded Glass'}</div>
            <div className="feature-badge">{language === 'pl' ? 'Kalibracja ADAS' : 'ADAS Calibration'}</div>
            <div className="feature-badge">{language === 'pl' ? 'Gwarancja Jakości' : 'Quality Guarantee'}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
