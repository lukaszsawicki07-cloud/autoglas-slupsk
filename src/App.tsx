import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import VehicleTypes from './components/VehicleTypes';
import WhyUs from './components/WhyUs';
import Gallery from './components/Gallery';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import Footer from './components/Footer';
import QuoteForm from './components/QuoteForm';
import WhatsAppButton from './components/WhatsAppButton';
import AdminPanel from './components/AdminPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ClickHeatmap from './components/ClickHeatmap';
import SectionTracker from './components/SectionTracker';
import { initSession, trackClick, trackScrollDepth, trackEvent } from './lib/analytics';
import { useLanguage } from './contexts/LanguageContext';
import { DynamicContentProvider } from './contexts/DynamicContentContext';

interface AdminPanelWindow extends Window {
  openAdminPanel?: () => void;
  openAnalytics?: () => void;
}

function App() {
  const { language } = useLanguage();
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);

  // Init analytics session on mount
  useEffect(() => {
    initSession(language);
    trackEvent('page_view');
  }, []);

  // Scroll depth tracking (fire at 25%, 50%, 75%, 100%)
  useEffect(() => {
    const fired = new Set<number>();
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);
      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !fired.has(milestone)) {
          fired.add(milestone);
          trackScrollDepth(milestone);
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click tracking
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const section = target.closest('[data-section]')?.getAttribute('data-section') || 'unknown';
      trackClick(e.clientX + window.scrollX, e.clientY + window.scrollY, section);
    };
    window.addEventListener('click', onClick, { passive: true });
    return () => window.removeEventListener('click', onClick);
  }, []);

  // Keyboard shortcuts and console helpers
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsAdminPanelOpen(true);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsAnalyticsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    (window as AdminPanelWindow).openAdminPanel = () => setIsAdminPanelOpen(true);
    (window as AdminPanelWindow).openAnalytics = () => setIsAnalyticsOpen(true);

    console.log('%cAuto-Glas Admin', 'color: #fdb913; font-size: 16px; font-weight: bold;');
    console.log('Ctrl+Shift+A — Panel administracyjny');
    console.log('Ctrl+Shift+D — Analytics Dashboard');

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      delete (window as AdminPanelWindow).openAdminPanel;
      delete (window as AdminPanelWindow).openAnalytics;
    };
  }, []);

  const handleQuoteOpen = useCallback(() => {
    trackEvent('quote_open');
    setIsQuoteFormOpen(true);
  }, []);

  return (
    <DynamicContentProvider language={language}>
      <Header />
      <main>
        <SectionTracker sectionId="hero"><div data-section="hero"><Hero onQuoteClick={handleQuoteOpen} /></div></SectionTracker>
        <SectionTracker sectionId="vehicles"><div data-section="vehicles"><VehicleTypes /></div></SectionTracker>
        <SectionTracker sectionId="why-us"><div data-section="why-us"><WhyUs /></div></SectionTracker>
        <SectionTracker sectionId="gallery"><div data-section="gallery"><Gallery /></div></SectionTracker>
        <SectionTracker sectionId="reviews"><div data-section="reviews"><Reviews /></div></SectionTracker>
        <SectionTracker sectionId="contact"><div data-section="contact"><Contact /></div></SectionTracker>
      </main>
      <Footer onAdminOpen={() => setIsAdminPanelOpen(true)} />
      <WhatsAppButton />
      <QuoteForm
        isOpen={isQuoteFormOpen}
        onClose={() => setIsQuoteFormOpen(false)}
      />
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        onShowHeatmap={() => setIsHeatmapVisible(true)}
      />
      <ClickHeatmap
        isVisible={isHeatmapVisible}
        onClose={() => setIsHeatmapVisible(false)}
      />
    </DynamicContentProvider>
  );
}

export default App;
