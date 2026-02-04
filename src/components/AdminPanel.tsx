import { useState, useEffect } from 'react';
import { X, Phone, Mail, Car, Calendar, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { supabase, QuoteRequest } from '../lib/supabase';
import './AdminPanel.css';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchRequests();
    }
  }, [isOpen, isAuthenticated]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_quote_requests_admin', {
        admin_pin: pin
      });

      console.log('RPC Response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      if (data) {
        console.log('Setting requests:', data);
        setRequests(data);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error('Error authenticating:', err);
      setPinError(err.message || 'Nieprawidłowy PIN');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_quote_requests_admin', {
        admin_pin: pin
      });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Nie udało się pobrać zapytań');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.rpc('update_quote_status_admin', {
        admin_pin: pin,
        request_id: id,
        new_status: newStatus
      });

      if (error) throw error;
      fetchRequests();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Nie udało się zaktualizować statusu');
    }
  };

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(req => req.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#fdb913';
      case 'contacted': return '#0066cc';
      case 'quoted': return '#ff6b00';
      case 'completed': return '#28a745';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nowe';
      case 'contacted': return 'Skontaktowano';
      case 'quoted': return 'Wycenione';
      case 'completed': return 'Zakończone';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Zamknij">
          <X size={24} />
        </button>

        <div className="admin-header">
          <h2>Panel Administracyjny</h2>
          <p>Zarządzanie zapytaniami o wycenę</p>
        </div>

        {!isAuthenticated ? (
          <div className="pin-form-container">
            <form onSubmit={handlePinSubmit} className="pin-form">
              <div className="form-group">
                <label htmlFor="pin">Wprowadź PIN</label>
                <input
                  type="password"
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="****"
                  maxLength={4}
                  required
                  autoFocus
                />
              </div>
              {pinError && <div className="error-message">{pinError}</div>}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Sprawdzanie...' : 'Zaloguj'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="admin-filters">
              <button
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                Wszystkie ({requests.length})
              </button>
              <button
                className={filter === 'new' ? 'active' : ''}
                onClick={() => setFilter('new')}
              >
                Nowe ({requests.filter(r => r.status === 'new').length})
              </button>
              <button
                className={filter === 'contacted' ? 'active' : ''}
                onClick={() => setFilter('contacted')}
              >
                Skontaktowano ({requests.filter(r => r.status === 'contacted').length})
              </button>
              <button
                className={filter === 'quoted' ? 'active' : ''}
                onClick={() => setFilter('quoted')}
              >
                Wycenione ({requests.filter(r => r.status === 'quoted').length})
              </button>
              <button
                className={filter === 'completed' ? 'active' : ''}
                onClick={() => setFilter('completed')}
              >
                Zakończone ({requests.filter(r => r.status === 'completed').length})
              </button>
            </div>

            <div className="admin-content">
              {loading ? (
                <div className="loading">Ładowanie...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : filteredRequests.length === 0 ? (
                <div className="no-requests">Brak zapytań</div>
              ) : (
                <div className="requests-list">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="request-card">
                      <div className="request-header">
                        <div className="request-info">
                          <h3>{request.name}</h3>
                          <span
                            className="status-badge"
                            style={{ background: getStatusColor(request.status || 'new') }}
                          >
                            {getStatusLabel(request.status || 'new')}
                          </span>
                        </div>
                        <div className="request-date">
                          <Calendar size={16} />
                          {formatDate(request.created_at || '')}
                        </div>
                      </div>

                      <div className="request-details">
                        <div className="detail-item">
                          <Phone size={16} />
                          <a href={`tel:${request.phone}`}>{request.phone}</a>
                        </div>
                        {request.email && (
                          <div className="detail-item">
                            <Mail size={16} />
                            <a href={`mailto:${request.email}`}>{request.email}</a>
                          </div>
                        )}
                        <div className="detail-item">
                          <Car size={16} />
                          {request.vehicle}
                          {request.vin && <span className="vin"> (VIN: {request.vin})</span>}
                        </div>
                        <div className="detail-item description">
                          <MessageSquare size={16} />
                          <p>{request.description}</p>
                        </div>
                        {request.photo_url && (
                          <div className="photo-container">
                            <img src={request.photo_url} alt="Uszkodzenie" />
                          </div>
                        )}
                      </div>

                      <div className="request-actions">
                        <button
                          className="action-btn contacted"
                          onClick={() => updateStatus(request.id!, 'contacted')}
                          disabled={request.status === 'contacted'}
                        >
                          <Clock size={16} />
                          Skontaktowano
                        </button>
                        <button
                          className="action-btn quoted"
                          onClick={() => updateStatus(request.id!, 'quoted')}
                          disabled={request.status === 'quoted'}
                        >
                          <MessageSquare size={16} />
                          Wyceniono
                        </button>
                        <button
                          className="action-btn completed"
                          onClick={() => updateStatus(request.id!, 'completed')}
                          disabled={request.status === 'completed'}
                        >
                          <CheckCircle size={16} />
                          Zakończono
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
