import { useEffect, useRef } from 'react';
import { trackSectionView } from '../lib/analytics';

interface SectionTrackerProps {
  sectionId: string;
  children: React.ReactNode;
  className?: string;
}

const SectionTracker: React.FC<SectionTrackerProps> = ({ sectionId, children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const enterTime = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          enterTime.current = Date.now();
        } else if (enterTime.current !== null) {
          const timeMs = Date.now() - enterTime.current;
          trackSectionView(sectionId, timeMs);
          enterTime.current = null;
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default SectionTracker;
