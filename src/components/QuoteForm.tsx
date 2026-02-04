import { X, Upload, User, Phone, Car, Mail } from 'lucide-react';
import { useState } from 'react';
import './QuoteForm.css';
import { supabase } from '../lib/supabase';

interface QuoteFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuoteForm = ({ isOpen, onClose }: QuoteFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle: '',
    vin: '',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let photoUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `quote-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('quote-photos')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
        } else {
          const { data } = supabase.storage
            .from('quote-photos')
            .getPublicUrl(filePath);
          photoUrl = data.publicUrl;
        }
      }

      const { error: insertError } = await supabase
        .from('quote_requests')
        .insert([
          {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            vehicle: formData.vehicle,
            vin: formData.vin || null,
            description: formData.description,
            photo_url: photoUrl,
            status: 'new'
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quote-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            vehicle: formData.vehicle,
            vin: formData.vin,
            description: formData.description
          })
        });
      } catch (emailError) {
        console.error('Error sending notification:', emailError);
      }

      alert('Dziękujemy! Skontaktujemy się z Tobą w ciągu 30 minut.');
      onClose();
      setFormData({ name: '', phone: '', email: '', vehicle: '', vin: '', description: '' });
      setSelectedFile(null);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Wystąpił błąd podczas wysyłania formularza. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Zamknij">
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>Szybka Wycena</h2>
          <p>Wypełnij formularz, a skontaktujemy się z Tobą w ciągu 30 minut</p>
        </div>

        <form onSubmit={handleSubmit} className="quote-form">
          <div className="form-group">
            <label htmlFor="name">
              <User size={18} />
              Imię i Nazwisko
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Jan Kowalski"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">
                <Phone size={18} />
                Telefon
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="+48 123 456 789"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vehicle">
              <Car size={18} />
              Pojazd
            </label>
            <input
              type="text"
              id="vehicle"
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              required
              placeholder="np. Toyota Yaris 2018"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vin">
              Numer VIN (opcjonalnie)
            </label>
            <input
              type="text"
              id="vin"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              placeholder="17 znaków"
              maxLength={17}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Opis uszkodzenia
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Opisz uszkodzenie szyby..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="photo" className="file-upload-label">
              <Upload size={18} />
              Zdjęcie uszkodzenia (opcjonalnie)
            </label>
            <input
              type="file"
              id="photo"
              onChange={handleFileChange}
              accept="image/*"
              className="file-input"
            />
            {selectedFile && (
              <div className="file-selected">
                Wybrano: {selectedFile.name}
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Wysyłanie...' : 'Wyślij zapytanie'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuoteForm;
