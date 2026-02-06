import { Car, Truck, TramFront } from 'lucide-react';
import './VehicleTypes.css';
import { useLanguage } from '../contexts/LanguageContext';

const VehicleTypes = () => {
  const { t } = useLanguage();

  const vehicles = [
    {
      icon: <Car size={48} />,
      titleKey: 'vehicleTypes.passengerCars.title',
      descriptionKey: 'vehicleTypes.passengerCars.description',
      detailsKey: 'vehicleTypes.passengerCars.details'
    },
    {
      icon: <Truck size={48} />,
      titleKey: 'vehicleTypes.trucks.title',
      descriptionKey: 'vehicleTypes.trucks.description',
      detailsKey: 'vehicleTypes.trucks.details'
    },
    {
      icon: <TramFront size={48} />,
      titleKey: 'vehicleTypes.construction.title',
      descriptionKey: 'vehicleTypes.construction.description',
      detailsKey: 'vehicleTypes.construction.details'
    }
  ];

  return (
    <section id="pojazdy" className="vehicle-types">
      <div className="container">
        <div className="section-header">
          <h2>{t('vehicleTypes.title')}</h2>
          <p>{t('vehicleTypes.subtitle')}</p>
        </div>

        <div className="vehicle-grid">
          {vehicles.map((vehicle, index) => {
            const details = t(vehicle.detailsKey) as unknown as string[];
            return (
              <div key={index} className="vehicle-card">
                <div className="vehicle-icon">
                  {vehicle.icon}
                </div>
                <h3>{t(vehicle.titleKey)}</h3>
                <p className="vehicle-description">{t(vehicle.descriptionKey)}</p>
                <ul className="vehicle-details">
                  {details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VehicleTypes;
