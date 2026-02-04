import { Phone, FileText } from 'lucide-react';
import './Hero.css';

interface HeroProps {
  onQuoteClick: () => void;
}

const Hero = ({ onQuoteClick }: HeroProps) => {
  const phoneNumber = "+48 502 557 767";

  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="container hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Wymiana i Naprawa Szyb<br />
            w Każdym Pojeździe
          </h1>
          <p className="hero-subtitle">
            Szybko, Profesjonalnie, Kompleksowo
          </p>
          <p className="hero-description">
            Osobowe • Ciężarowe • Maszyny Budowlane
          </p>
          <div className="hero-cta">
            <a href={`tel:${phoneNumber}`} className="btn btn-primary">
              <Phone size={20} />
              Zadzwoń Teraz
            </a>
            <button onClick={onQuoteClick} className="btn btn-secondary">
              <FileText size={20} />
              Szybka Wycena
            </button>
          </div>
          <div className="hero-features">
            <div className="feature-badge">Markowe Szyby</div>
            <div className="feature-badge">Kalibracja ADAS</div>
            <div className="feature-badge">Gwarancja Jakości</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
