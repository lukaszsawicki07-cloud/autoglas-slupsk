import { Shield, Wrench, Zap, Camera } from 'lucide-react';
import './WhyUs.css';

const WhyUs = () => {
  const features = [
    {
      icon: <Shield size={40} />,
      title: 'Markowe Szyby',
      description: 'Pracujemy wyłącznie z renomowanymi producentami: Pilkington, Saint Gobain Sekurit, Fuyao, Yes glas. Gwarancja jakości i bezpieczeństwa.'
    },
    {
      icon: <Camera size={40} />,
      title: 'Kalibracja ADAS',
      description: 'Profesjonalna kalibracja systemów wspomagania kierowcy. Niezbędne w nowoczesnych pojazdach po wymianie szyby.'
    },
    {
      icon: <Zap size={40} />,
      title: 'Jak działamy?',
      description: 'Stawiamy na jakość, dlatego każdą szybę zamawiamy pod konkretny model pojazdu (czas oczekiwania 2–4 dni), zapewniając pełną zgodność z sensorami i systemami ADAS.'
    },
    {
      icon: <Wrench size={40} />,
      title: 'Doświadczenie',
      description: 'Ponad 30 lat na rynku. Tysiące zadowolonych klientów. Obsługujemy pojazdy od małych osobowych po wielkie maszyny.'
    }
  ];

  return (
    <section id="oferta" className="why-us">
      <div className="container">
        <div className="section-header">
          <h2>Dlaczego Auto-Glas Słupsk?</h2>
          <p>Profesjonalizm, jakość i kompleksowa obsługa w jednym miejscu</p>
        </div>

        <div className="about-intro">
          <p>
            Wymiana szyb to nasza rodzinna specjalność. Łączymy tradycyjne podejście do klienta z nowoczesnymi standardami serwisowymi.
            Obsługujemy wszystkie gabaryty – od aut osobowych po floty ciężarowe. Wybierając nas, stawiasz na fachowość, szybkość działania
            i gwarancję solidnie wykonanej pracy przez zespół, który kocha to, co robi.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="brands-section">
          <h3>Zaufali nam producenci</h3>
          <div className="brands">
            <div className="brand">Pilkington</div>
            <div className="brand">Saint Gobain Sekurit</div>
            <div className="brand">Fuyao</div>
            <div className="brand">Yes glas</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
