import { Star } from 'lucide-react';
import './Reviews.css';
import { useLanguage } from '../contexts/LanguageContext';

const Reviews = () => {
  const { t } = useLanguage();
  const reviews = t('reviews.items') as unknown as Array<{
    name: string;
    text: string;
    vehicle: string;
  }>;

  const reviewsWithRating = reviews.map(review => ({ ...review, rating: 5 }));

  return (
    <section className="reviews">
      <div className="container">
        <div className="section-header">
          <h2>{t('reviews.title')}</h2>
          <p>{t('reviews.subtitle')}</p>
        </div>

        <div className="reviews-grid">
          {reviewsWithRating.map((review, index) => (
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
              <p>{t('reviews.googleBadge')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
