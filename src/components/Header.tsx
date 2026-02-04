import { Phone, MapPin, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const phoneNumber = "+48 502 557 767";

  return (
    <>
      <div className="top-bar">
        <div className="container top-bar-content">
          <div className="top-bar-info">
            <a href={`tel:${phoneNumber}`} className="top-bar-item">
              <Phone size={16} />
              <span>{phoneNumber}</span>
            </a>
            <div className="top-bar-item">
              <MapPin size={16} />
              <span>Kniaziewicza 1/1, Słupsk</span>
            </div>
          </div>
        </div>
      </div>

      <header className="header sticky">
        <div className="container header-content">
          <a href="#" className="logo">
            <img src="/whatsapp_image_2026-01-09_at_09.06.26.jpeg" alt="Auto-Glas Słupsk" />
          </a>

          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <a href="#oferta" onClick={() => setIsMenuOpen(false)}>Oferta</a>
            <a href="#pojazdy" onClick={() => setIsMenuOpen(false)}>Pojazdy</a>
            <a href="#realizacje" onClick={() => setIsMenuOpen(false)}>Realizacje</a>
            <a href="#kontakt" onClick={() => setIsMenuOpen(false)}>Kontakt</a>
            <a href={`tel:${phoneNumber}`} className="btn-call-header">
              <Phone size={18} />
              Zadzwoń
            </a>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
