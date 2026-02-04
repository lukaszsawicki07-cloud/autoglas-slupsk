import './Gallery.css';

const Gallery = () => {
  const projects = [
    {
      title: 'Audi A6',
      category: 'Samochód Osobowy Premium',
      description: 'Wymiana szyby czołowej z kalibracją ADAS',
      image: '/1000074390.jpg'
    },
    {
      title: 'Volvo FH',
      category: 'Samochód Ciężarowy',
      description: 'Kompleksowa wymiana szyb w kabinie',
      image: '/volvo_fh.jpg'
    },
    {
      title: 'Porsche 928',
      category: 'Samochód Osobowy Klasyczny',
      description: 'Wymiana szyby czołowej',
      image: '/20250401_171028.jpg'
    },
    {
      title: 'Mercedes-Benz E-Class',
      category: 'Samochód Osobowy Premium',
      description: 'Wymiana szyby czołowej',
      image: '/benze.jpg'
    },
    {
      title: 'Mercedes Sprinter',
      category: 'Samochód Dostawczy',
      description: 'Wymiana szyby bocznej',
      image: '/mercedessprinter.jpg'
    },
    {
      title: 'System ADAS (Advanced Driver Assistance Systems)',
      category: 'Samochód z Systemem',
      description: 'Konfiguracja aktywnych systemów bezpieczeństwa',
      image: '/20250811_143253.jpg'
    }
  ];

  return (
    <section id="realizacje" className="gallery">
      <div className="container">
        <div className="section-header">
          <h2>Nasze Realizacje</h2>
          <p>Zobacz przykładowe projekty - od luksusowych aut po ogromne maszyny</p>
        </div>

        <div className="gallery-grid">
          {projects.map((project, index) => (
            <div key={index} className="gallery-item">
              <div className="gallery-image">
                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                />
              </div>
              <div className="gallery-content">
                <span className="gallery-category">{project.category}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
