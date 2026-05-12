import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface HeatmapPoint {
  x: number;
  y: number;
  weight: number;
}

interface ClickHeatmapProps {
  isVisible: boolean;
  onClose: () => void;
}

const ClickHeatmap: React.FC<ClickHeatmapProps> = ({ isVisible, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    loadAndDraw();
  }, [isVisible]);

  async function loadAndDraw() {
    setLoading(true);
    const { data } = await supabase
      .from('analytics_events')
      .select('click_x, click_y, page_width, page_height')
      .eq('event_type', 'click')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    setLoading(false);
    if (!data || data.length === 0) return;
    setTotalClicks(data.length);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, vw, vh);

    const points: HeatmapPoint[] = data.map(d => ({
      x: (d.click_x / (d.page_width || vw)) * vw,
      y: (d.click_y / (d.page_height || document.documentElement.scrollHeight)) * vh,
      weight: 1,
    }));

    for (const p of points) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 40);
      grad.addColorStop(0, 'rgba(255, 50, 0, 0.25)');
      grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 40, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'fixed', top: 16, right: 16, background: '#111', color: '#fff',
        padding: '12px 20px', borderRadius: 8, fontSize: 14, pointerEvents: 'all',
        display: 'flex', alignItems: 'center', gap: 16, zIndex: 10000,
      }}>
        <span>
          {loading ? 'Ładowanie...' : `Heatmapa kliknięć — ${totalClicks} kliknięć (30 dni)`}
        </span>
        <button
          onClick={onClose}
          style={{
            background: '#fdb913', color: '#111', border: 'none', borderRadius: 6,
            padding: '6px 14px', cursor: 'pointer', fontWeight: 700,
          }}
        >
          Zamknij
        </button>
      </div>
    </div>
  );
};

export default ClickHeatmap;
