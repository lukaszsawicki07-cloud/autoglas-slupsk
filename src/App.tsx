import { useState, useEffect } from 'react';
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

interface AdminPanelWindow extends Window {
  openAdminPanel?: () => void;
}

function App() {
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        console.log('Admin panel opening...');
        setIsAdminPanelOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    (window as AdminPanelWindow).openAdminPanel = () => {
      console.log('Opening admin panel via console command...');
      setIsAdminPanelOpen(true);
    };

    console.log('%cAdmin Panel Control', 'color: #fdb913; font-size: 16px; font-weight: bold;');
    console.log('To open admin panel, use one of these methods:');
    console.log('1. Press Ctrl+Shift+A');
    console.log('2. Type: window.openAdminPanel()');

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      delete (window as AdminPanelWindow).openAdminPanel;
    };
  }, []);

  useEffect(() => {
    console.log('Admin panel state:', isAdminPanelOpen);
  }, [isAdminPanelOpen]);

  return (
    <>
      <Header />
      <main>
        <Hero onQuoteClick={() => setIsQuoteFormOpen(true)} />
        <VehicleTypes />
        <WhyUs />
        <Gallery />
        <Reviews />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      <QuoteForm
        isOpen={isQuoteFormOpen}
        onClose={() => setIsQuoteFormOpen(false)}
      />
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    </>
  );
}

export default App;
