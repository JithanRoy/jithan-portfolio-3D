import { useEffect, useRef, useState } from 'react';
import { stops, sections } from '../route.js';
import { ride, rideTo, useStore } from '../store.js';
import { StopBlock } from './blocks.jsx';

/**
 * Wheel/touch over the panel would normally be swallowed by the panel.
 * Forward it to the ride's scroll container unless the panel itself can scroll that way.
 */
function useForwardScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const canScroll = (dy) =>
      dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
    const onWheel = (e) => {
      if (canScroll(e.deltaY) || !ride.scrollEl) return;
      e.preventDefault();
      ride.scrollEl.scrollTop += e.deltaY;
    };
    let lastY = 0;
    const onStart = (e) => (lastY = e.touches[0].clientY);
    const onMove = (e) => {
      const y = e.touches[0].clientY;
      const dy = lastY - y;
      lastY = y;
      if (canScroll(dy) || !ride.scrollEl) return;
      e.preventDefault();
      ride.scrollEl.scrollTop += dy * 1.5;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
    };
  }, [ref]);
}

export function SectionPanel() {
  const active = useStore((s) => s.activeStop);
  const [shown, setShown] = useState(0);
  const ref = useRef();
  useForwardScroll(ref);

  useEffect(() => {
    if (active >= 0) setShown(active);
  }, [active]);

  const stop = stops[shown];
  const next = stops[shown + 1];
  const sectionLabel = sections.find((s) => s.id === stop.section)?.label;
  const visible = active >= 0;

  return (
    <aside
      ref={ref}
      className={`panel ${visible ? 'is-visible' : ''}`}
      aria-live="polite"
      aria-hidden={!visible}
      inert={visible ? undefined : ''}
    >
      <div className="panel__eyebrow">
        <span>{sectionLabel}</span>
        <span>
          Stop {shown + 1} / {stops.length}
        </span>
      </div>
      <div className="panel__body" key={stop.key}>
        <StopBlock stop={stop} />
      </div>
      <div className="panel__footer">
        {shown > 0 && (
          <button className="btn btn--ghost" onClick={() => rideTo(stops[shown - 1].t)}>
            ← Back
          </button>
        )}
        {next ? (
          <button className="btn btn--ghost" onClick={() => rideTo(next.t)}>
            Next: {next.title} →
          </button>
        ) : (
          <button className="btn btn--ghost" onClick={() => rideTo(0)}>
            Ride again ↺
          </button>
        )}
      </div>
    </aside>
  );
}
