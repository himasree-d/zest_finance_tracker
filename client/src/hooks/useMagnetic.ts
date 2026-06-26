import { useEffect } from 'react';

/**
 * Attach to a container ref — any child with data-magnetic gets
 * a magnetic pull toward the cursor on hover.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useMagnetic(ref);
 *   <div ref={ref}>
 *     <button data-magnetic="0.35">Click me</button>
 *   </div>
 *
 * data-magnetic value = pull strength (0.2 subtle → 0.6 strong)
 */
export function useMagnetic(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = container.querySelectorAll<HTMLElement>('[data-magnetic]');
    const cleanup: Array<() => void> = [];

    targets.forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic || '0.35');

      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      };

      const onLeave = () => {
        el.style.transform = 'translate(0,0)';
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanup.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        el.style.transform = '';
      });
    });

    return () => cleanup.forEach((fn) => fn());
  }, []);
}