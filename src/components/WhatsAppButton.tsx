import { MessageCircle } from 'lucide-react';
import './WhatsAppButton.css';

const WhatsAppButton = () => {
  const phoneNumber = "48502557767";
  const message = "Witam! Interesuje mnie wymiana szyby w moim pojeździe.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-button"
      aria-label="Napisz na WhatsApp"
    >
      <MessageCircle size={28} />
      <span className="whatsapp-tooltip">Napisz na WhatsApp</span>
    </a>
  );
};

export default WhatsAppButton;
