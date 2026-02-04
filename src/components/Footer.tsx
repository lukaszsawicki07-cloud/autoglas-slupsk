import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const phoneNumber = "+48 502 557 767";
  const email = "autoglasslupsk@gmail.com";

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-col">
            <h3>AUTO-GLAS<span>Słupsk</span></h3>
            <p>Profesjonalna wymiana i naprawa szyb samochodowych. Obsługujemy wszystkie typy pojazdów.</p>
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
            <h4>Nasze Usługi</h4>
            <ul>
              <li><a href="#pojazdy">Samochody Osobowe</a></li>
              <li><a href="#pojazdy">Samochody Ciężarowe</a></li>
              <li><a href="#pojazdy">Maszyny Budowlane</a></li>
              <li><a href="#oferta">Kalibracja ADAS</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Informacje</h4>
            <ul>
              <li><a href="#oferta">O nas</a></li>
              <li><a href="#realizacje">Realizacje</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Kontakt</h4>
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
          <p>&copy; {currentYear} Auto-Glas Słupsk. Wszelkie prawa zastrzeżone.</p>
          <div className="footer-links">
            <a href="#">Polityka Prywatności</a>
            <a href="#">Regulamin</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
