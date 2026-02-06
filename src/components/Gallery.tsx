import './Gallery.css';
import { useLanguage } from '../contexts/LanguageContext';

const Gallery = () => {
  const { t } = useLanguage();

  const projects = [
    {
      titleKey: 'gallery.projects.audiA6.title',
      categoryKey: 'gallery.projects.audiA6.category',
      descriptionKey: 'gallery.projects.audiA6.description',
      image: '/1000074390.jpg'
    },
    {
      titleKey: 'gallery.projects.volvoFH.title',
      categoryKey: 'gallery.projects.volvoFH.category',
      descriptionKey: 'gallery.projects.volvoFH.description',
      image: '/volvo_fh.jpg'
    },
    {
      titleKey: 'gallery.projects.porsche928.title',
      categoryKey: 'gallery.projects.porsche928.category',
      descriptionKey: 'gallery.projects.porsche928.description',
      image: '/20250401_171028.jpg'
    },
    {
      titleKey: 'gallery.projects.mercedesE.title',
      categoryKey: 'gallery.projects.mercedesE.category',
      descriptionKey: 'gallery.projects.mercedesE.description',
      image: '/benze.jpg'
    },
    {
      titleKey: 'gallery.projects.sprinter.title',
      categoryKey: 'gallery.projects.sprinter.category',
      descriptionKey: 'gallery.projects.sprinter.description',
      image: '/mercedessprinter.jpg'
    },
    {
      titleKey: 'gallery.projects.adas.title',
      categoryKey: 'gallery.projects.adas.category',
      descriptionKey: 'gallery.projects.adas.description',
      image: '/20250811_143253.jpg'
    }
  ];

  return (
    <section id="realizacje" className="gallery">
      <div className="container">
        <div className="section-header">
          <h2>{t('gallery.title')}</h2>
          <p>{t('gallery.subtitle')}</p>
        </div>

        <div className="gallery-grid">
          {projects.map((project, index) => (
            <div key={index} className="gallery-item">
              <div className="gallery-image">
                <img
                  src={project.image}
                  alt={t(project.titleKey)}
                  loading="lazy"
                />
              </div>
              <div className="gallery-content">
                <span className="gallery-category">{t(project.categoryKey)}</span>
                <h3>{t(project.titleKey)}</h3>
                <p>{t(project.descriptionKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
