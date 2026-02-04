import { Star } from 'lucide-react';
import './Reviews.css';

const Reviews = () => {
  const reviews = [
    {
      name: 'Marek K.',
      rating: 5,
      text: 'Profesjonalna obsługa. Wymiana szyby w moim Mercedesie przebiegła sprawnie. Ekipa przyjechała do mnie do firmy, nie musiałem tracić czasu. Kalibracja kamery wykonana perfekcyjnie.',
      vehicle: 'Mercedes-Benz C-Class'
    },
    {
      name: 'Anna W.',
      rating: 5,
      text: 'Polecam! Szybka realizacja, uczciwa cena. Szyba wymieniona tego samego dnia. Pan montażysta bardzo dokładny i kulturalny. Współpraca z ubezpieczalnią bez problemu.',
      vehicle: 'Toyota Yaris'
    },
    {
      name: 'Piotr S.',
      rating: 5,
      text: 'Wymiana szyby w ciężarówce. Duży plus za mobilność - przyjechali na parking. Jakość wykonania na najwyższym poziomie. Już drugi raz korzystam z ich usług.',
      vehicle: 'Volvo FH'
    },
    {
      name: 'Tomasz L.',
      rating: 5,
      text: 'Najlepszy serwis w okolicy! Wymieniali szybę w koparce CAT. Profesjonalne podejście, markowe części. Polecam każdemu właścicielowi maszyn budowlanych.',
      vehicle: 'CAT 320'
    },
    {
      name: 'Katarzyna M.',
      rating: 5,
      text: 'Bardzo miła obsługa, fachowe doradztwo. Pomoc w kontakcie z ubezpieczycielem była nieoceniona. Szyba idealnie dopasowana, bez przecieków. Gorąco polecam!',
      vehicle: 'Audi A4'
    },
    {
      name: 'Jan B.',
      rating: 5,
      text: 'Firma godna zaufania. Szybka wycena przez telefon, terminowa realizacja. Szyba markowa, montaż wykonany perfekcyjnie. Świetny kontakt i profesjonalizm na każdym etapie.',
      vehicle: 'Ford Transit'
    }
  ];

  return (
    <section className="reviews">
      <div className="container">
        <div className="section-header">
          <h2>Opinie Klientów</h2>
          <p>Zobacz co mówią o nas nasi zadowoleni klienci</p>
        </div>

        <div className="reviews-grid">
          {reviews.map((review, index) => (
            <div key={index} className="review-card">
              <div className="review-header">
                <div className="review-author">
                  <div className="author-avatar">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4>{review.name}</h4>
                    <span className="review-vehicle">{review.vehicle}</span>
                  </div>
                </div>
                <div className="review-rating">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="review-text">{review.text}</p>
            </div>
          ))}
        </div>

        <div className="google-reviews">
          <div className="google-badge">
            <div className="google-logo">G</div>
            <div className="google-info">
              <div className="google-rating">
                <strong>4.9</strong>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p>Na podstawie 150+ opinii Google</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
