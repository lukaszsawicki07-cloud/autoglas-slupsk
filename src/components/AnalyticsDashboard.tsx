import { useState, useEffect } from 'react';
import { X, Users, MousePointer, Eye, TrendingUp, BarChart2, RefreshCw, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onShowHeatmap: () => void;
}

interface SectionStat {
  section: string;
  views: number;
  avg_time_ms: number;
}

interface ABResult {
  test_name: string;
  variant_name: string;
  description: string;
  impressions: number;
  conversions: number;
  cvr: number;
}

interface DashboardData {
  totalSessions: number;
  totalClicks: number;
  totalQuoteOpens: number;
  totalQuoteSubmits: number;
  avgScrollDepth: number;
  sectionStats: SectionStat[];
  abResults: ABResult[];
  dailyVisitors: { day: string; count: number }[];
}

const EMPTY: DashboardData = {
  totalSessions: 0,
  totalClicks: 0,
  totalQuoteOpens: 0,
  totalQuoteSubmits: 0,
  avgScrollDepth: 0,
  sectionStats: [],
  abResults: [],
  dailyVisitors: [],
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onClose, onShowHeatmap }) => {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<7 | 30>(7);
  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'ab'>('overview');

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, range]);

  async function load() {
    setLoading(true);
    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: summary },
      { data: sections },
      { data: daily },
      { data: abVariants },
    ] = await Promise.all([
      supabase.rpc('get_analytics_summary', { p_since: since }),
      supabase.rpc('get_section_stats', { p_since: since }),
      supabase.rpc('get_daily_sessions', { p_since: since }),
      supabase.from('ab_variants').select('name, description, impressions, conversions, ab_tests(name)'),
    ]);

    const sectionStats: SectionStat[] = (sections || []).map((s: any) => ({
      section: s.section,
      views: Number(s.views),
      avg_time_ms: Number(s.avg_time_ms),
    }));

    const abResults: ABResult[] = (abVariants || []).map((v: any) => ({
      test_name: v.ab_tests?.name || '',
      variant_name: v.name,
      description: v.description,
      impressions: v.impressions,
      conversions: v.conversions,
      cvr: v.impressions > 0 ? Math.round((v.conversions / v.impressions) * 1000) / 10 : 0,
    }));

    const dailyVisitors = (daily || []).map((d: any) => ({
      day: d.day,
      count: Number(d.cnt),
    }));

    setData({
      totalSessions: summary?.total_sessions || 0,
      totalClicks: summary?.total_clicks || 0,
      totalQuoteOpens: summary?.quote_opens || 0,
      totalQuoteSubmits: summary?.quote_submits || 0,
      avgScrollDepth: summary?.avg_scroll || 0,
      sectionStats,
      abResults,
      dailyVisitors,
    });
    setLoading(false);
  }

  if (!isOpen) return null;

  const maxDailyCount = Math.max(...data.dailyVisitors.map(d => d.count), 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="analytics-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={24} /></button>

        <div className="analytics-header">
          <h2><BarChart2 size={24} /> Analytics Dashboard</h2>
          <div className="analytics-controls">
            <div className="range-selector">
              <button className={range === 7 ? 'active' : ''} onClick={() => setRange(7)}>7 dni</button>
              <button className={range === 30 ? 'active' : ''} onClick={() => setRange(30)}>30 dni</button>
            </div>
            <button className="btn-refresh" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn-heatmap" onClick={() => { onClose(); onShowHeatmap(); }}>
              <MousePointer size={16} /> Heatmapa
            </button>
          </div>
        </div>

        <div className="analytics-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Przegląd</button>
          <button className={activeTab === 'sections' ? 'active' : ''} onClick={() => setActiveTab('sections')}>Sekcje</button>
          <button className={activeTab === 'ab' ? 'active' : ''} onClick={() => setActiveTab('ab')}>A/B Testy</button>
        </div>

        <div className="analytics-body">
          {loading ? (
            <div className="analytics-loading">Ładowanie danych...</div>
          ) : activeTab === 'overview' ? (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <Users size={28} />
                  <div>
                    <span className="kpi-value">{data.totalSessions}</span>
                    <span className="kpi-label">Sesje</span>
                  </div>
                </div>
                <div className="kpi-card">
                  <MousePointer size={28} />
                  <div>
                    <span className="kpi-value">{data.totalClicks}</span>
                    <span className="kpi-label">Kliknięcia</span>
                  </div>
                </div>
                <div className="kpi-card">
                  <Eye size={28} />
                  <div>
                    <span className="kpi-value">{data.totalQuoteOpens}</span>
                    <span className="kpi-label">Otwarcia wyceny</span>
                  </div>
                </div>
                <div className="kpi-card">
                  <TrendingUp size={28} />
                  <div>
                    <span className="kpi-value">{data.totalQuoteSubmits}</span>
                    <span className="kpi-label">Wysłane wyceny</span>
                  </div>
                </div>
                <div className="kpi-card">
                  <BarChart2 size={28} />
                  <div>
                    <span className="kpi-value">{data.avgScrollDepth}%</span>
                    <span className="kpi-label">Śr. głębokość scrolla</span>
                  </div>
                </div>
                <div className="kpi-card accent">
                  <TrendingUp size={28} />
                  <div>
                    <span className="kpi-value">
                      {data.totalQuoteOpens > 0
                        ? Math.round((data.totalQuoteSubmits / data.totalQuoteOpens) * 100)
                        : 0}%
                    </span>
                    <span className="kpi-label">Konwersja wycen</span>
                  </div>
                </div>
              </div>

              <div className="chart-section">
                <h3>Dzienni odwiedzający</h3>
                {data.dailyVisitors.length === 0 ? (
                  <p className="no-data">Brak danych</p>
                ) : (
                  <div className="bar-chart">
                    {data.dailyVisitors.map(d => (
                      <div key={d.day} className="bar-item">
                        <div className="bar-fill" style={{ height: `${(d.count / maxDailyCount) * 100}%` }} />
                        <span className="bar-label">{d.day.slice(5)}</span>
                        <span className="bar-value">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'sections' ? (
            <div className="section-stats">
              <h3>Czas na sekcji</h3>
              {data.sectionStats.length === 0 ? (
                <p className="no-data">Brak danych o sekcjach</p>
              ) : (
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Sekcja</th>
                      <th>Wyświetlenia</th>
                      <th>Śr. czas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sectionStats.map(s => (
                      <tr key={s.section}>
                        <td>{s.section}</td>
                        <td>{s.views}</td>
                        <td>{s.avg_time_ms >= 1000 ? `${(s.avg_time_ms / 1000).toFixed(1)}s` : `${s.avg_time_ms}ms`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="ab-results">
              <h3>Wyniki testów A/B</h3>
              {data.abResults.length === 0 ? (
                <p className="no-data">Brak danych A/B</p>
              ) : (
                data.abResults.map((r, i) => (
                  <div key={i} className="ab-card">
                    <div className="ab-card-header">
                      <span className="ab-test-name">{r.test_name}</span>
                      <span className="ab-variant-name">{r.variant_name}</span>
                      {r.cvr === Math.max(...data.abResults.filter(x => x.test_name === r.test_name).map(x => x.cvr)) && r.impressions > 0 && (
                        <span className="ab-winner"><Award size={14} /> Lider</span>
                      )}
                    </div>
                    <p className="ab-description">{r.description}</p>
                    <div className="ab-metrics">
                      <span>Wyświetlenia: <strong>{r.impressions}</strong></span>
                      <span>Konwersje: <strong>{r.conversions}</strong></span>
                      <span className="ab-cvr">CVR: <strong>{r.cvr}%</strong></span>
                    </div>
                    <div className="ab-bar-wrap">
                      <div className="ab-bar" style={{ width: `${Math.min(r.cvr * 5, 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
