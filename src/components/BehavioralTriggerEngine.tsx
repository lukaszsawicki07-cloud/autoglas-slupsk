import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { BehavioralTrigger } from './AdminPanel';
import { X, Phone } from 'lucide-react';
import './BehavioralTriggerEngine.css';

interface Props {
  quoteOpened: boolean;
  onQuoteClick: () => void;
}

const PHONE = '+48 502 557 767';

const BehavioralTriggerEngine = ({ quoteOpened, onQuoteClick }: Props) => {
  const { language } = useLanguage();
  const [triggers, setTriggers] = useState<BehavioralTrigger[]>([]);
  const [firedTrigger, setFiredTrigger] = useState<BehavioralTrigger | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const scrollDepth = useRef(0);
  const viewedSections = useRef<Set<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Load triggers once
  useEffect(() => {
    supabase.rpc('get_active_behavioral_triggers').then(({ data }) => {
      setTriggers((data as BehavioralTrigger[]) || []);
    });
  }, []);

  // Track scroll depth
  useEffect(() => {
    const onScroll = () => {
      const pct = Math.round(
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      );
      scrollDepth.current = Math.max(scrollDepth.current, Math.min(100, pct));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track viewed sections via SectionTracker data-section attributes
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const section = (e.target as HTMLElement).dataset.section;
            if (section) viewedSections.current.add(section);
          }
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Evaluate triggers whenever they change or quote state changes
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (firedTrigger || dismissed) return;

    for (const t of triggers) {
      if (!t.is_active) continue;

      const delayMs = (t.condition_delay_seconds || 0) * 1000;

      const check = () => {
        if (firedTrigger || dismissed) return;
        if (t.condition_no_quote_open && quoteOpened) return;
        if (t.condition_min_scroll != null && scrollDepth.current < t.condition_min_scroll) return;
        if (t.condition_section && !viewedSections.current.has(t.condition_section)) return;

        if (t.action_type === 'popup') {
          // exit-intent: fire on mouseleave top of viewport
          const onMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 5) {
              setFiredTrigger(t);
              document.removeEventListener('mouseleave', onMouseLeave);
            }
          };
          document.addEventListener('mouseleave', onMouseLeave);
          timers.current.push(setTimeout(() => {
            document.removeEventListener('mouseleave', onMouseLeave);
          }, 60000));
        } else {
          setFiredTrigger(t);
        }
      };

      const id = setTimeout(check, delayMs);
      timers.current.push(id);
    }

    return () => timers.current.forEach(clearTimeout);
  }, [triggers, quoteOpened, dismissed, firedTrigger]);

  const dismiss = () => {
    setDismissed(true);
    setFiredTrigger(null);
  };

  if (!firedTrigger || dismissed) return null;

  const text = language === 'pl' ? firedTrigger.action_text_pl : (firedTrigger.action_text_en || firedTrigger.action_text_pl);
  const cta = language === 'pl' ? firedTrigger.action_cta_pl : (firedTrigger.action_cta_en || firedTrigger.action_cta_pl);

  if (firedTrigger.action_type === 'popup') {
    return (
      <div className="bt-overlay" onClick={dismiss}>
        <div className="bt-popup" onClick={e => e.stopPropagation()}>
          <button className="bt-close" onClick={dismiss}><X size={18} /></button>
          <div className="bt-popup-icon">🛡️</div>
          <p className="bt-popup-text">{text}</p>
          {cta && (
            <div className="bt-popup-actions">
              <a href={`tel:${PHONE}`} className="bt-btn bt-btn--primary">
                <Phone size={16} /> {cta}
              </a>
              <button className="bt-btn bt-btn--secondary" onClick={() => { dismiss(); onQuoteClick(); }}>
                {language === 'pl' ? 'Szybka Wycena' : 'Quick Quote'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bt-banner">
      <p className="bt-banner-text">{text}</p>
      <div className="bt-banner-actions">
        {cta && (
          <a href={`tel:${PHONE}`} className="bt-btn bt-btn--primary bt-btn--sm">
            <Phone size={14} /> {cta}
          </a>
        )}
        <button className="bt-btn bt-btn--secondary bt-btn--sm" onClick={() => { dismiss(); onQuoteClick(); }}>
          {language === 'pl' ? 'Wycena' : 'Quote'}
        </button>
      </div>
      <button className="bt-close bt-close--banner" onClick={dismiss}><X size={16} /></button>
    </div>
  );
};

export default BehavioralTriggerEngine;
