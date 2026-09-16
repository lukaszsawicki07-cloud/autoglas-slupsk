import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';
import { useLanguage } from '../contexts/LanguageContext';

const FAQ = () => {
  const { t } = useLanguage();

  const faqs: { question: string; answer: string }[] = [
    {
      question: t('faq.q1'),
      answer: t('faq.a1')
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2')
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3')
    },
    {
      question: t('faq.q4'),
      answer: t('faq.a4')
    },
    {
      question: t('faq.q5'),
      answer: t('faq.a5')
    },
    {
      question: t('faq.q6'),
      answer: t('faq.a6')
    },
    {
      question: t('faq.q7'),
      answer: t('faq.a7')
    },
    {
      question: t('faq.q8'),
      answer: t('faq.a8')
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section id="faq" className="faq">
      <div className="container">
        <div className="section-header">
          <h2>{t('faq.title')}</h2>
          <p>{t('faq.subtitle')}</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={24}
                  className={`faq-chevron ${openIndex === index ? 'rotated' : ''}`}
                />
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </section>
  );
};

export default FAQ;
