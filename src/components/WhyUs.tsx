import { Shield, Wrench, Zap, Camera } from 'lucide-react';
import './WhyUs.css';
import { useLanguage } from '../contexts/LanguageContext';

const WhyUs = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Shield size={40} />,
      titleKey: 'whyUs.brandedGlass.title',
      descriptionKey: 'whyUs.brandedGlass.description'
    },
    {
      icon: <Camera size={40} />,
      titleKey: 'whyUs.adasCalibration.title',
      descriptionKey: 'whyUs.adasCalibration.description'
    },
    {
      icon: <Zap size={40} />,
      titleKey: 'whyUs.howWeWork.title',
      descriptionKey: 'whyUs.howWeWork.description'
    },
    {
      icon: <Wrench size={40} />,
      titleKey: 'whyUs.experience.title',
      descriptionKey: 'whyUs.experience.description'
    }
  ];

  return (
    <section id="oferta" className="why-us">
      <div className="container">
        <div className="section-header">
          <h2>{t('whyUs.title')}</h2>
          <p>{t('whyUs.subtitle')}</p>
        </div>

        <div className="about-intro">
          <p>{t('whyUs.intro')}</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3>{t(feature.titleKey)}</h3>
              <p>{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>

        <div className="brands-section">
          <h3>{t('whyUs.brandsTitle')}</h3>
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
