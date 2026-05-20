import { useState, useEffect } from 'react';
import { X, Phone, Mail, Car, Calendar, CheckCircle, Clock, MessageSquare, Layers, Plus, Trash2, ToggleLeft, ToggleRight, Eye, Zap, Globe, PlayCircle } from 'lucide-react';
import { supabase, QuoteRequest } from '../lib/supabase';
import { ContentRule, useDynamicContent } from '../contexts/DynamicContentContext';
import './AdminPanel.css';

export interface BehavioralTrigger {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  condition_section: string | null;
  condition_min_scroll: number | null;
  condition_no_quote_open: boolean;
  condition_delay_seconds: number;
  action_type: 'banner' | 'popup';
  action_text_pl: string;
  action_text_en: string;
  action_cta_pl: string | null;
  action_cta_en: string | null;
}

const EMPTY_TRIGGER: Omit<BehavioralTrigger, 'id'> = {
  name: '', is_active: true, priority: 0,
  condition_section: null, condition_min_scroll: null,
  condition_no_quote_open: true, condition_delay_seconds: 8,
  action_type: 'banner',
  action_text_pl: '', action_text_en: '',
  action_cta_pl: null, action_cta_en: null,
};

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_RULE: Omit<ContentRule, 'id' | 'created_at' | 'updated_at'> = {
  name: '', is_active: true, priority: 0,
  match_utm_source: null, match_utm_medium: null, match_utm_campaign: null,
  match_referrer_contains: null, match_country: null,
  hero_title_pl: null, hero_title_en: null,
  hero_subtitle_pl: null, hero_subtitle_en: null,
  hero_description_pl: null, hero_description_en: null,
  hero_cta_primary_pl: null, hero_cta_primary_en: null,
  hero_cta_secondary_pl: null, hero_cta_secondary_en: null,
  hero_badge_1_pl: null, hero_badge_2_pl: null, hero_badge_3_pl: null,
  hero_badge_1_en: null, hero_badge_2_en: null, hero_badge_3_en: null,
};

type AdminTab = 'quotes' | 'content' | 'triggers';

const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
  const { reloadRules } = useDynamicContent();
  const [activeTab, setActiveTab] = useState<AdminTab>('quotes');
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Content rules state
  const [rules, setRules] = useState<ContentRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<ContentRule> | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Behavioral triggers state
  const [triggers, setTriggers] = useState<BehavioralTrigger[]>([]);
  const [triggersLoading, setTriggersLoading] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<Partial<BehavioralTrigger> | null>(null);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [autoPromoteMsg, setAutoPromoteMsg] = useState<string | null>(null);
  const [autoPromoteLoading, setAutoPromoteLoading] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchRequests();
      fetchRules();
      fetchTriggers();
    }
  }, [isOpen, isAuthenticated]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_quote_requests_admin', { admin_pin: pin });
      if (error) { setPinError(`Błąd: ${error.message}`); throw error; }
      if (data) { setRequests(data); setIsAuthenticated(true); }
    } catch (err: any) {
      setPinError(err.message || 'Błąd połączenia z serwerem.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_quote_requests_admin', { admin_pin: pin });
      if (error) throw error;
      setRequests(data || []);
    } catch { setError('Nie udało się pobrać zapytań'); }
    finally { setLoading(false); }
  };

  const fetchRules = async () => {
    setRulesLoading(true);
    const { data, error } = await supabase.rpc('get_content_rules', { p_pin: pin });
    if (!error) setRules(data || []);
    setRulesLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.rpc('update_quote_status_admin', {
        admin_pin: pin, request_id: id, new_status: newStatus,
      });
      if (error) throw error;
      fetchRequests();
    } catch { alert('Nie udało się zaktualizować statusu'); }
  };

  const saveRule = async () => {
    if (!editingRule) return;
    setRuleError(null);
    const { error } = await supabase.rpc('upsert_content_rule', {
      p_pin: pin,
      p_rule: editingRule,
    });
    if (error) { setRuleError(error.message); return; }
    setEditingRule(null);
    setShowPreview(false);
    fetchRules();
    reloadRules();
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Usunąć tę regułę?')) return;
    await supabase.rpc('delete_content_rule', { p_pin: pin, p_rule_id: id });
    fetchRules();
  };

  const toggleRule = async (rule: ContentRule) => {
    await supabase.rpc('upsert_content_rule', {
      p_pin: pin,
      p_rule: { ...rule, is_active: !rule.is_active },
    });
    fetchRules();
  };

  const fetchTriggers = async () => {
    setTriggersLoading(true);
    const { data } = await supabase.rpc('get_active_behavioral_triggers');
    // get_active_behavioral_triggers returns only active — for admin, we need all
    // use direct query via service or call with pin separately if needed
    // For now use same RPC (returns active only — admin can toggle)
    setTriggers(data || []);
    setTriggersLoading(false);
  };

  const saveTrigger = async () => {
    if (!editingTrigger) return;
    setTriggerError(null);
    const { error } = await supabase.rpc('upsert_behavioral_trigger', {
      p_pin: pin,
      p_trigger: editingTrigger,
    });
    if (error) { setTriggerError(error.message); return; }
    setEditingTrigger(null);
    fetchTriggers();
  };

  const deleteTrigger = async (id: string) => {
    if (!confirm('Usunąć ten trigger?')) return;
    await supabase.rpc('delete_behavioral_trigger', { p_pin: pin, p_trigger_id: id });
    fetchTriggers();
  };

  const toggleTrigger = async (t: BehavioralTrigger) => {
    await supabase.rpc('upsert_behavioral_trigger', {
      p_pin: pin,
      p_trigger: { ...t, is_active: !t.is_active },
    });
    fetchTriggers();
  };

  const runAutoPromote = async () => {
    setAutoPromoteLoading(true);
    setAutoPromoteMsg(null);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qmrrekpxduweomkgpnzo.supabase.co';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/ab-auto-promote`, {
        headers: { Authorization: `Bearer ${anonKey}`, Apikey: anonKey },
      });
      const json = await res.json();
      if (json.ok) {
        const r = json.result;
        setAutoPromoteMsg(r.promoted > 0
          ? `Promowano ${r.promoted} test(y). Zwycięzcy: ${JSON.stringify(r.results)}`
          : 'Brak testów gotowych do promocji (min. 100 wyświetleń i +20% CVR).');
      } else {
        setAutoPromoteMsg(`Błąd: ${json.error}`);
      }
    } catch (e: any) {
      setAutoPromoteMsg(`Błąd: ${e.message}`);
    }
    setAutoPromoteLoading(false);
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { new: '#fdb913', contacted: '#0066cc', quoted: '#ff6b00', completed: '#28a745' };
    return colors[status] || '#666';
  };
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { new: 'Nowe', contacted: 'Skontaktowano', quoted: 'Wycenione', completed: 'Zakończone' };
    return labels[status] || status;
  };
  const formatDate = (d: string) => new Date(d).toLocaleString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Zamknij"><X size={24} /></button>

        <div className="admin-header">
          <h2>Panel Administracyjny</h2>
          <p>Zarządzanie zapytaniami i dynamiczną treścią</p>
        </div>

        {!isAuthenticated ? (
          <div className="pin-form-container">
            <form onSubmit={handlePinSubmit} className="pin-form">
              <div className="form-group">
                <label htmlFor="pin">Wprowadź PIN</label>
                <input type="password" id="pin" value={pin} onChange={e => setPin(e.target.value)}
                  placeholder="****" maxLength={4} required autoFocus />
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
              <button className={activeTab === 'quotes' ? 'active' : ''} onClick={() => setActiveTab('quotes')}>
                Zapytania ({requests.length})
              </button>
              <button className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={14} /> Treść ({rules.filter(r => r.is_active).length} aktywnych)
                </span>
              </button>
              <button className={activeTab === 'triggers' ? 'active' : ''} onClick={() => setActiveTab('triggers')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={14} /> Triggery ({triggers.filter(t => t.is_active).length} aktywnych)
                </span>
              </button>
            </div>

            {activeTab === 'quotes' && (
              <>
                <div className="admin-filters" style={{ borderTop: 'none', paddingTop: 0 }}>
                  {(['all', 'new', 'contacted', 'quoted', 'completed'] as const).map(f => (
                    <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                      {f === 'all' ? `Wszystkie (${requests.length})` :
                       f === 'new' ? `Nowe (${requests.filter(r => r.status === 'new').length})` :
                       f === 'contacted' ? `Skontaktowano (${requests.filter(r => r.status === 'contacted').length})` :
                       f === 'quoted' ? `Wycenione (${requests.filter(r => r.status === 'quoted').length})` :
                       `Zakończone (${requests.filter(r => r.status === 'completed').length})`}
                    </button>
                  ))}
                </div>
                <div className="admin-content">
                  {loading ? <div className="loading">Ładowanie...</div>
                   : error ? <div className="error-message">{error}</div>
                   : filteredRequests.length === 0 ? <div className="no-requests">Brak zapytań</div>
                   : (
                    <div className="requests-list">
                      {filteredRequests.map(request => (
                        <div key={request.id} className="request-card">
                          <div className="request-header">
                            <div className="request-info">
                              <h3>{request.name}</h3>
                              <span className="status-badge" style={{ background: getStatusColor(request.status || 'new') }}>
                                {getStatusLabel(request.status || 'new')}
                              </span>
                            </div>
                            <div className="request-date"><Calendar size={16} />{formatDate(request.created_at || '')}</div>
                          </div>
                          <div className="request-details">
                            <div className="detail-item"><Phone size={16} /><a href={`tel:${request.phone}`}>{request.phone}</a></div>
                            {request.email && <div className="detail-item"><Mail size={16} /><a href={`mailto:${request.email}`}>{request.email}</a></div>}
                            <div className="detail-item"><Car size={16} />{request.vehicle}{request.vin && <span className="vin"> (VIN: {request.vin})</span>}</div>
                            <div className="detail-item description"><MessageSquare size={16} /><p>{request.description}</p></div>
                            {request.photo_url && <div className="photo-container"><img src={request.photo_url} alt="Uszkodzenie" /></div>}
                          </div>
                          <div className="request-actions">
                            <button className="action-btn contacted" onClick={() => updateStatus(request.id!, 'contacted')} disabled={request.status === 'contacted'}><Clock size={16} />Skontaktowano</button>
                            <button className="action-btn quoted" onClick={() => updateStatus(request.id!, 'quoted')} disabled={request.status === 'quoted'}><MessageSquare size={16} />Wyceniono</button>
                            <button className="action-btn completed" onClick={() => updateStatus(request.id!, 'completed')} disabled={request.status === 'completed'}><CheckCircle size={16} />Zakończono</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'content' && (
              <div className="admin-content">
                <div className="cr-toolbar">
                  <p className="cr-hint">
                    Reguły są sprawdzane wg priorytetu (wyższy = ważniejszy). Pierwsza pasująca reguła nadpisuje treść hero. Puste pola = zachowaj domyślną treść.
                  </p>
                  <button className="cr-btn-add" onClick={() => setEditingRule({ ...EMPTY_RULE })}>
                    <Plus size={16} /> Nowa reguła
                  </button>
                </div>

                {rulesLoading ? <div className="loading">Ładowanie...</div> : (
                  <div className="cr-list">
                    {rules.length === 0 && <div className="no-requests">Brak reguł. Kliknij "Nowa reguła" aby dodać pierwszą.</div>}
                    {rules.map(rule => (
                      <div key={rule.id} className={`cr-card ${rule.is_active ? 'cr-active' : 'cr-inactive'}`}>
                        <div className="cr-card-header">
                          <div className="cr-card-meta">
                            <span className="cr-priority">P{rule.priority}</span>
                            <strong>{rule.name || '(bez nazwy)'}</strong>
                            <span className={`cr-status-badge ${rule.is_active ? 'on' : 'off'}`}>
                              {rule.is_active ? 'Aktywna' : 'Nieaktywna'}
                            </span>
                          </div>
                          <div className="cr-card-actions">
                            <button className="cr-icon-btn" title={rule.is_active ? 'Dezaktywuj' : 'Aktywuj'} onClick={() => toggleRule(rule)}>
                              {rule.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                            <button className="cr-icon-btn" title="Edytuj" onClick={() => setEditingRule({ ...rule })}>
                              <Layers size={16} />
                            </button>
                            <button className="cr-icon-btn cr-icon-btn--danger" title="Usuń" onClick={() => deleteRule(rule.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="cr-conditions">
                          {rule.match_utm_source && <span className="cr-tag">utm_source: <b>{rule.match_utm_source}</b></span>}
                          {rule.match_utm_medium && <span className="cr-tag">utm_medium: <b>{rule.match_utm_medium}</b></span>}
                          {rule.match_utm_campaign && <span className="cr-tag">utm_campaign: <b>{rule.match_utm_campaign}</b></span>}
                          {rule.match_referrer_contains && <span className="cr-tag">referrer zawiera: <b>{rule.match_referrer_contains}</b></span>}
                          {rule.match_country && <span className="cr-tag cr-tag--geo"><Globe size={11} /> kraj: <b>{rule.match_country}</b></span>}
                          {!rule.match_utm_source && !rule.match_utm_medium && !rule.match_utm_campaign && !rule.match_referrer_contains && !rule.match_country && (
                            <span className="cr-tag cr-tag--warn">Dopasowuje WSZYSTKICH odwiedzających</span>
                          )}
                        </div>
                        {(rule.hero_title_pl || rule.hero_subtitle_pl || rule.hero_cta_primary_pl) && (
                          <div className="cr-preview">
                            {rule.hero_title_pl && <p><span>Tytuł PL:</span> {rule.hero_title_pl}</p>}
                            {rule.hero_subtitle_pl && <p><span>Podtytuł PL:</span> {rule.hero_subtitle_pl}</p>}
                            {rule.hero_cta_primary_pl && <p><span>CTA:</span> {rule.hero_cta_primary_pl}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {editingRule && (
                  <div className="cr-editor-overlay" onClick={() => setEditingRule(null)}>
                    <div className="cr-editor" onClick={e => e.stopPropagation()}>
                      <div className="cr-editor-header">
                        <h3>{editingRule.id ? 'Edytuj regułę' : 'Nowa reguła'}</h3>
                        <button className="modal-close" style={{ position: 'static' }} onClick={() => setEditingRule(null)}><X size={20} /></button>
                      </div>

                      {ruleError && <div className="error-message" style={{ margin: '0 1.5rem 1rem' }}>{ruleError}</div>}

                      <div className="cr-editor-body">
                        <section className="cr-section">
                          <h4>Podstawowe</h4>
                          <div className="cr-row">
                            <label>Nazwa reguły<input value={editingRule.name || ''} onChange={e => setEditingRule(r => ({ ...r!, name: e.target.value }))} placeholder="np. Facebook - ciężarówki" /></label>
                            <label>Priorytet<input type="number" value={editingRule.priority ?? 0} onChange={e => setEditingRule(r => ({ ...r!, priority: Number(e.target.value) }))} /></label>
                          </div>
                        </section>

                        <section className="cr-section">
                          <h4>Warunki dopasowania <small>(puste pole = dowolna wartość)</small></h4>
                          <div className="cr-row">
                            <label>utm_source<input value={editingRule.match_utm_source || ''} onChange={e => setEditingRule(r => ({ ...r!, match_utm_source: e.target.value || null }))} placeholder="np. facebook" /></label>
                            <label>utm_medium<input value={editingRule.match_utm_medium || ''} onChange={e => setEditingRule(r => ({ ...r!, match_utm_medium: e.target.value || null }))} placeholder="np. cpc" /></label>
                          </div>
                          <div className="cr-row">
                            <label>utm_campaign<input value={editingRule.match_utm_campaign || ''} onChange={e => setEditingRule(r => ({ ...r!, match_utm_campaign: e.target.value || null }))} placeholder="np. spring_trucks" /></label>
                            <label>Referrer zawiera<input value={editingRule.match_referrer_contains || ''} onChange={e => setEditingRule(r => ({ ...r!, match_referrer_contains: e.target.value || null }))} placeholder="np. google.pl" /></label>
                          </div>
                          <div className="cr-row">
                            <label>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Globe size={13} /> Kraj (ISO kod)</span>
                              <input value={editingRule.match_country || ''} onChange={e => setEditingRule(r => ({ ...r!, match_country: e.target.value.toUpperCase() || null }))} placeholder="np. PL lub DE" maxLength={2} style={{ textTransform: 'uppercase' }} />
                            </label>
                          </div>
                        </section>

                        <section className="cr-section">
                          <h4>Treść Hero — Polski <small>(puste = domyślna treść)</small></h4>
                          <label>Tytuł<input value={editingRule.hero_title_pl || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_title_pl: e.target.value || null }))} placeholder="Wymiana i Naprawa Szyb\nw Każdym Pojeździe" /></label>
                          <label>Podtytuł<input value={editingRule.hero_subtitle_pl || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_subtitle_pl: e.target.value || null }))} /></label>
                          <label>Opis<input value={editingRule.hero_description_pl || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_description_pl: e.target.value || null }))} /></label>
                          <div className="cr-row">
                            <label>Przycisk główny<input value={editingRule.hero_cta_primary_pl || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_cta_primary_pl: e.target.value || null }))} placeholder="Zadzwoń Teraz" /></label>
                            <label>Przycisk drugi<input value={editingRule.hero_cta_secondary_pl || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_cta_secondary_pl: e.target.value || null }))} placeholder="Szybka Wycena" /></label>
                          </div>
                          <div className="cr-row">
                            <label>Odznaka 1<input value={editingRule.hero_badge_1_pl || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_badge_1_pl: e.target.value || null }))} /></label>
                            <label>Odznaka 2<input value={editingRule.hero_badge_2_pl || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_badge_2_pl: e.target.value || null }))} /></label>
                            <label>Odznaka 3<input value={editingRule.hero_badge_3_pl || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_badge_3_pl: e.target.value || null }))} /></label>
                          </div>
                        </section>

                        <section className="cr-section">
                          <h4>Treść Hero — English <small>(optional)</small></h4>
                          <label>Title<input value={editingRule.hero_title_en || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_title_en: e.target.value || null }))} /></label>
                          <label>Subtitle<input value={editingRule.hero_subtitle_en || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_subtitle_en: e.target.value || null }))} /></label>
                          <label>Description<input value={editingRule.hero_description_en || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_description_en: e.target.value || null }))} /></label>
                          <div className="cr-row">
                            <label>Primary CTA<input value={editingRule.hero_cta_primary_en || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_cta_primary_en: e.target.value || null }))} /></label>
                            <label>Secondary CTA<input value={editingRule.hero_cta_secondary_en || ''} onChange={e => setEditingRule(r => ({ ...r!, hero_cta_secondary_en: e.target.value || null }))} /></label>
                          </div>
                        </section>
                      </div>

                      {showPreview && (
                        <div className="cr-live-preview">
                          <div className="cr-live-preview-label">Podgląd Hero (PL)</div>
                          <div className="cr-live-preview-hero">
                            <div className="cr-preview-title">
                              {editingRule.hero_title_pl || 'Wymiana i Naprawa Szyb\nw Każdym Pojeździe'}
                            </div>
                            {editingRule.hero_subtitle_pl && (
                              <div className="cr-preview-subtitle">{editingRule.hero_subtitle_pl}</div>
                            )}
                            {editingRule.hero_description_pl && (
                              <div className="cr-preview-desc">{editingRule.hero_description_pl}</div>
                            )}
                            <div className="cr-preview-ctas">
                              <span className="cr-preview-btn cr-preview-btn--primary">
                                {editingRule.hero_cta_primary_pl || 'Zadzwoń Teraz'}
                              </span>
                              <span className="cr-preview-btn cr-preview-btn--secondary">
                                {editingRule.hero_cta_secondary_pl || 'Szybka Wycena'}
                              </span>
                            </div>
                            {(editingRule.hero_badge_1_pl || editingRule.hero_badge_2_pl || editingRule.hero_badge_3_pl) && (
                              <div className="cr-preview-badges">
                                {editingRule.hero_badge_1_pl && <span>{editingRule.hero_badge_1_pl}</span>}
                                {editingRule.hero_badge_2_pl && <span>{editingRule.hero_badge_2_pl}</span>}
                                {editingRule.hero_badge_3_pl && <span>{editingRule.hero_badge_3_pl}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="cr-editor-footer">
                        <label className="cr-active-toggle">
                          <input type="checkbox" checked={editingRule.is_active ?? true} onChange={e => setEditingRule(r => ({ ...r!, is_active: e.target.checked }))} />
                          Aktywna
                        </label>
                        <button className="cr-btn-preview" onClick={() => setShowPreview(p => !p)}>
                          <Eye size={15} /> {showPreview ? 'Ukryj podgląd' : 'Podgląd'}
                        </button>
                        <button className="cr-btn-cancel" onClick={() => { setEditingRule(null); setShowPreview(false); }}>Anuluj</button>
                        <button className="cr-btn-save" onClick={saveRule}>Zapisz regułę</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'triggers' && (
              <div className="admin-content">
                {/* Auto-promote section */}
                <div className="cr-toolbar" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid var(--bg-light)' }}>
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-dark)' }}>A/B Auto-promote</p>
                    <p className="cr-hint">Sprawdza wszystkie aktywne testy A/B. Jeśli wariant B bije control o 20% przy min. 100 wyświetleniach — zostaje automatycznie wybrany zwycięzcą.</p>
                    {autoPromoteMsg && <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: autoPromoteMsg.startsWith('Błąd') ? '#c33' : '#28a745', fontWeight: 600 }}>{autoPromoteMsg}</p>}
                  </div>
                  <button className="cr-btn-add" onClick={runAutoPromote} disabled={autoPromoteLoading} style={{ background: '#1a3a8f' }}>
                    <PlayCircle size={16} /> {autoPromoteLoading ? 'Sprawdzam...' : 'Uruchom teraz'}
                  </button>
                </div>

                {/* Behavioral triggers */}
                <div className="cr-toolbar">
                  <p className="cr-hint">
                    Triggery behawioralne — pokazują banner lub popup po spełnieniu warunków (sekcja, scroll, czas). Pierwsza aktywna reguła wygrywa.
                  </p>
                  <button className="cr-btn-add" onClick={() => setEditingTrigger({ ...EMPTY_TRIGGER })}>
                    <Plus size={16} /> Nowy trigger
                  </button>
                </div>

                {triggersLoading ? <div className="loading">Ładowanie...</div> : (
                  <div className="cr-list">
                    {triggers.length === 0 && <div className="no-requests">Brak triggerów. Kliknij "Nowy trigger" aby dodać pierwszy.</div>}
                    {triggers.map(t => (
                      <div key={t.id} className={`cr-card ${t.is_active ? 'cr-active' : 'cr-inactive'}`}>
                        <div className="cr-card-header">
                          <div className="cr-card-meta">
                            <span className="cr-priority">P{t.priority}</span>
                            <strong>{t.name || '(bez nazwy)'}</strong>
                            <span className={`cr-status-badge ${t.is_active ? 'on' : 'off'}`}>{t.is_active ? 'Aktywny' : 'Nieaktywny'}</span>
                            <span className="cr-tag" style={{ background: t.action_type === 'popup' ? '#fff3e0' : '#e8f5e9', color: t.action_type === 'popup' ? '#e65100' : '#2e7d32' }}>
                              {t.action_type === 'popup' ? 'Popup' : 'Banner'}
                            </span>
                          </div>
                          <div className="cr-card-actions">
                            <button className="cr-icon-btn" onClick={() => toggleTrigger(t)}>
                              {t.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                            <button className="cr-icon-btn" onClick={() => setEditingTrigger({ ...t })}>
                              <Layers size={16} />
                            </button>
                            <button className="cr-icon-btn cr-icon-btn--danger" onClick={() => deleteTrigger(t.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="cr-conditions">
                          {t.condition_section && <span className="cr-tag">sekcja: <b>{t.condition_section}</b></span>}
                          {t.condition_min_scroll != null && <span className="cr-tag">scroll ≥ <b>{t.condition_min_scroll}%</b></span>}
                          {t.condition_no_quote_open && <span className="cr-tag">bez otwarcia wyceny</span>}
                          <span className="cr-tag">po <b>{t.condition_delay_seconds}s</b></span>
                        </div>
                        <div className="cr-preview">
                          {t.action_text_pl && <p><span>Tekst PL:</span> {t.action_text_pl}</p>}
                          {t.action_cta_pl && <p><span>CTA:</span> {t.action_cta_pl}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {editingTrigger && (
                  <div className="cr-editor-overlay" onClick={() => setEditingTrigger(null)}>
                    <div className="cr-editor" onClick={e => e.stopPropagation()}>
                      <div className="cr-editor-header">
                        <h3>{(editingTrigger as BehavioralTrigger).id ? 'Edytuj trigger' : 'Nowy trigger'}</h3>
                        <button className="modal-close" style={{ position: 'static' }} onClick={() => setEditingTrigger(null)}><X size={20} /></button>
                      </div>

                      {triggerError && <div className="error-message" style={{ margin: '0 1.5rem 1rem' }}>{triggerError}</div>}

                      <div className="cr-editor-body">
                        <section className="cr-section">
                          <h4>Podstawowe</h4>
                          <div className="cr-row">
                            <label>Nazwa<input value={editingTrigger.name || ''} onChange={e => setEditingTrigger(t => ({ ...t!, name: e.target.value }))} placeholder="np. Zainteresowany galerią" /></label>
                            <label>Priorytet<input type="number" value={editingTrigger.priority ?? 0} onChange={e => setEditingTrigger(t => ({ ...t!, priority: Number(e.target.value) }))} /></label>
                          </div>
                          <div className="cr-row">
                            <label>Typ akcji
                              <select value={editingTrigger.action_type || 'banner'} onChange={e => setEditingTrigger(t => ({ ...t!, action_type: e.target.value as 'banner' | 'popup' }))} style={{ border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '0.5rem 0.75rem', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                                <option value="banner">Sticky banner (dół ekranu)</option>
                                <option value="popup">Exit-intent popup</option>
                              </select>
                            </label>
                          </div>
                        </section>

                        <section className="cr-section">
                          <h4>Warunki wyzwolenia</h4>
                          <div className="cr-row">
                            <label>Po obejrzeniu sekcji<input value={editingTrigger.condition_section || ''} onChange={e => setEditingTrigger(t => ({ ...t!, condition_section: e.target.value || null }))} placeholder="np. gallery (puste = dowolna)" /></label>
                            <label>Scroll ≥ %<input type="number" min={0} max={100} value={editingTrigger.condition_min_scroll ?? ''} onChange={e => setEditingTrigger(t => ({ ...t!, condition_min_scroll: e.target.value ? Number(e.target.value) : null }))} placeholder="np. 50" /></label>
                          </div>
                          <div className="cr-row">
                            <label>Opóźnienie (sekundy)<input type="number" min={0} value={editingTrigger.condition_delay_seconds ?? 8} onChange={e => setEditingTrigger(t => ({ ...t!, condition_delay_seconds: Number(e.target.value) }))} /></label>
                            <label className="cr-active-toggle" style={{ flexDirection: 'row', alignItems: 'center', paddingTop: '1.4rem' }}>
                              <input type="checkbox" checked={editingTrigger.condition_no_quote_open ?? true} onChange={e => setEditingTrigger(t => ({ ...t!, condition_no_quote_open: e.target.checked }))} />
                              Tylko jeśli wycena nie była otwarta
                            </label>
                          </div>
                        </section>

                        <section className="cr-section">
                          <h4>Treść</h4>
                          <label>Tekst PL <small>(wymagany)</small><input value={editingTrigger.action_text_pl || ''} onChange={e => setEditingTrigger(t => ({ ...t!, action_text_pl: e.target.value }))} placeholder="np. Bezpłatna wycena w 5 minut — zadzwoń teraz!" /></label>
                          <label>Tekst EN<input value={editingTrigger.action_text_en || ''} onChange={e => setEditingTrigger(t => ({ ...t!, action_text_en: e.target.value }))} placeholder="np. Free quote in 5 minutes — call now!" /></label>
                          <div className="cr-row">
                            <label>Przycisk CTA PL<input value={editingTrigger.action_cta_pl || ''} onChange={e => setEditingTrigger(t => ({ ...t!, action_cta_pl: e.target.value || null }))} placeholder="Zadzwoń teraz" /></label>
                            <label>Przycisk CTA EN<input value={editingTrigger.action_cta_en || ''} onChange={e => setEditingTrigger(t => ({ ...t!, action_cta_en: e.target.value || null }))} placeholder="Call now" /></label>
                          </div>
                        </section>
                      </div>

                      <div className="cr-editor-footer">
                        <label className="cr-active-toggle">
                          <input type="checkbox" checked={editingTrigger.is_active ?? true} onChange={e => setEditingTrigger(t => ({ ...t!, is_active: e.target.checked }))} />
                          Aktywny
                        </label>
                        <button className="cr-btn-cancel" onClick={() => setEditingTrigger(null)}>Anuluj</button>
                        <button className="cr-btn-save" onClick={saveTrigger}>Zapisz trigger</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
