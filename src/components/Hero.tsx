import { Phone, FileText } from 'lucide-react';
import './Hero.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useDynamicContent } from '../contexts/DynamicContentContext';

interface HeroProps {
  onQuoteClick: () => void;
}

const Hero = ({ onQuoteClick }: HeroProps) => {
  const { language } = useLanguage();
  const { hero } = useDynamicContent();
  const phoneNumber = "+48 502 557 767";
  const pl = language === 'pl';

  const title        = hero.title        ?? (pl ? 'Wymiana i Naprawa Szyb\nw Każdym Pojeździe'  : 'Car Glass Repair and Replacement\nFor All Vehicle Types');
  const subtitle     = hero.subtitle     ?? (pl ? 'Szybko, Profesjonalnie, Kompleksowo'           : 'Fast, Professional, Comprehensive');
  const description  = hero.description  ?? (pl ? 'Osobowe • Ciężarowe • Maszyny Budowlane'       : 'Cars • Trucks • Construction Equipment');
  const ctaPrimary   = hero.ctaPrimary   ?? (pl ? 'Zadzwoń Teraz'                                 : 'Call Now');
  const ctaSecondary = hero.ctaSecondary ?? (pl ? 'Szybka Wycena'                                 : 'Quick Quote');
  const badge1       = hero.badge1       ?? (pl ? 'Markowe Szyby'                                 : 'Branded Glass');
  const badge2       = hero.badge2       ?? (pl ? 'Kalibracja ADAS'                               : 'ADAS Calibration');
  const badge3       = hero.badge3       ?? (pl ? 'Gwarancja Jakości'                             : 'Quality Guarantee');

  const titleLines = title.split(/\\n|\n/);

  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="container hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            {titleLines.map((line, i) => (
              <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>
            ))}
          </h1>
          <p className="hero-subtitle">{subtitle}</p>
          <p className="hero-description">{description}</p>
          <div className="hero-cta">
            <a href={`tel:${phoneNumber}`} className="btn btn-primary">
              <Phone size={20} />
              {ctaPrimary}
            </a>
            <button onClick={onQuoteClick} className="btn btn-secondary">
              <FileText size={20} />
              {ctaSecondary}
            </button>
          </div>
          <div className="hero-features">
            <div className="feature-badge">{badge1}</div>
            <div className="feature-badge">{badge2}</div>
            <div className="feature-badge">{badge3}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
