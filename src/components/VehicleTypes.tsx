import { Car, Truck, TramFront } from 'lucide-react';
import './VehicleTypes.css';

const VehicleTypes = () => {
  const vehicles = [
    {
      icon: <Car size={48} />,
      title: 'Samochody Osobowe',
      description: 'Wszystkie marki i modele. Szyby przednie, boczne i tylne.',
      details: ['Audi, BMW, Mercedes', 'Toyota, Honda, Ford', 'Pojazdy premium i popularne']
    },
    {
      icon: <Truck size={48} />,
      title: 'Samochody Ciężarowe',
      description: 'Dostawcze, TIR-y i pojazdy specjalne. Profesjonalny montaż.',
      details: ['Mercedes Actros, Volvo FH', 'MAN, Scania, DAF', 'Iveco, Renault Trucks']
    },
    {
      icon: <TramFront size={48} />,
      title: 'Maszyny Budowlane',
      description: 'Koparki, ładowarki, ciągniki rolnicze i maszyny specjalistyczne.',
      details: ['CAT, JCB, Komatsu', 'John Deere, Case', 'Liebherr, Volvo']
    }
  ];

  return (
    <section id="pojazdy" className="vehicle-types">
      <div className="container">
        <div className="section-header">
          <h2>Obsługiwane Pojazdy</h2>
          <p>Wymieniamy szyby w każdym typie pojazdu - od małego osobowego po ogromną koparkę</p>
        </div>

        <div className="vehicle-grid">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="vehicle-card">
              <div className="vehicle-icon">
                {vehicle.icon}
              </div>
              <h3>{vehicle.title}</h3>
              <p className="vehicle-description">{vehicle.description}</p>
              <ul className="vehicle-details">
                {vehicle.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VehicleTypes;
