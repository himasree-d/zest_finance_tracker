import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

// Magnetic hover — applies to any element with data-magnetic
function useMagneticEffect(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = container.querySelectorAll<HTMLElement>('[data-magnetic]');

    const handlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];

    targets.forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic || '0.35');

      const move = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      };

      const leave = () => {
        el.style.transform = 'translate(0px, 0px)';
      };

      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      handlers.push({ el, move, leave });
    });

    return () => {
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
        el.style.transform = '';
      });
    };
  }, [containerRef]);
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useMagneticEffect(panelRef);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className={cn('modal-panel flex flex-col max-h-[90vh]', maxWidth)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Glass sheen line at top */}
        <div className="absolute top-0 left-6 right-6 h-px rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }} />

        <div className="flex items-center justify-between p-6 border-b border-charcoal-600">
          <h2 id="modal-title" className="text-xl font-semibold" style={{ color: '#1A1815' }}>
            {title}
          </h2>
          <button
            data-magnetic="0.4"
            onClick={onClose}
            className="transition-colors focus:outline-none rounded-lg p-1"
            style={{ color: '#9E9A93', transition: 'transform 0.15s cubic-bezier(0.23,1,0.32,1), color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1A1815')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9E9A93')}
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}