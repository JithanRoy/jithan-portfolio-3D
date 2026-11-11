import { useEffect, useMemo, useRef, useState } from 'react';
import { samples } from '../three/roadPath.js';
import { sections, stops } from '../route.js';
import { ride, rideTo, store, useStore } from '../store.js';
import { setSound, honk } from '../audio/engine.js';
import { profile } from '../content.js';
import { SectionPanel } from './SectionPanel.jsx';

/** Route projected to 2D: forward (−Z) runs left→right, the rider's left is up. */
function useRouteMap() {
  return useMemo(() => {
    const xs = samples.map((s) => -s.point.z);
    const ys = samples.map((s) => s.point.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = (maxY - minY) * 0.15;
    const toPct = (i) => ({
      x: ((xs[i] - minX) / (maxX - minX)) * 100,
      y: ((ys[i] - minY + pad) / (maxY - minY + pad * 2)) * 100,
    });
    const pts = samples.map((_, i) => toPct(i));
    const d = pts.filter((_, i) => i % 6 === 0 || i === pts.length - 1).map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    const at = (t) => pts[Math.round(t * (pts.length - 1))];
    return { d, at };
  }, []);
}

function RouteMap() {
  const { d, at } = useRouteMap();
  const active = useStore((s) => s.activeStop);
  const clip = useRef();
  const dot = useRef();

  useEffect(() => {
    let id;
    const tick = () => {
      const p = ride.progress;
      const pt = at(p);
      clip.current?.setAttribute('width', (pt.x + 5).toFixed(2));
      if (dot.current) {
        dot.current.style.left = `${pt.x}%`;
        dot.current.style.top = `${pt.y}%`;
      }
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [at]);

  const activeSection = active >= 0 ? stops[active].section : null;

  return (
    <nav className="route" aria-label="Route progress — jump to a section">
      <div className="route__map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <clipPath id="route-done">
              <rect ref={clip} x="-5" y="-50" width="0" height="200" />
            </clipPath>
          </defs>
          <path d={d} className="route__path" vectorEffect="non-scaling-stroke" />
          <path d={d} className="route__done" vectorEffect="non-scaling-stroke" clipPath="url(#route-done)" />
        </svg>
        <span ref={dot} className="route__dot" aria-hidden="true" />
        {sections.map((s) => {
          const pt = at(s.t);
          return (
            <button
              key={s.id}
              className={`route__stop ${activeSection === s.id ? 'is-active' : ''}`}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              onClick={() => rideTo(s.t)}
              aria-label={`Ride to ${s.label}`}
            >
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function JumpMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`jump ${open ? 'is-open' : ''}`}>
      <button className="btn btn--icon jump__toggle" aria-expanded={open} aria-controls="jump-list" onClick={() => setOpen((o) => !o)}>
        Jump to ▾
      </button>
      <ul id="jump-list" className="jump__list">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => {
                rideTo(s.t);
                setOpen(false);
              }}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Speed lines + "scroll to ride" hint, driven by rAF (no React re-renders). */
function Effects() {
  const lines = useRef();
  const hint = useRef();
  useEffect(() => {
    let id;
    const tick = () => {
      const fast = ride.reducedMotion ? 0 : Math.max(0, ride.speed - 0.35) / 0.65;
      if (lines.current) lines.current.style.opacity = (fast * 0.55).toFixed(3);
      if (hint.current) hint.current.classList.toggle('is-hidden', ride.progress > 0.012);
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <>
      <div ref={lines} className="speedlines" aria-hidden="true" />
      <p ref={hint} className="hint">
        <span className="hint__mouse" aria-hidden="true" />
        Scroll or swipe to ride
        <span className="hint__keys">
          · <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> / arrows
        </span>
      </p>
    </>
  );
}

export function Hud() {
  const soundOn = useStore((s) => s.soundOn);
  const toggleSound = () => {
    setSound(!soundOn);
    store.set({ soundOn: !soundOn });
  };
  return (
    <div className="hud">
      <a className="skip-link" href="?view=simple" onClick={(e) => (e.preventDefault(), store.set({ simple: true }))}>
        Skip to the simple, accessible version
      </a>
      <header className="hud__top">
        <button className="brand" onClick={() => rideTo(0)} aria-label="Back to start">
          <span className="brand__mark">JR</span>
          <span className="brand__text">
            <strong>{profile.name}</strong>
            <small>{profile.role}</small>
          </span>
        </button>
        <div className="hud__actions">
          <JumpMenu />
          <button className="btn btn--icon" onClick={honk} aria-label="Honk the horn" title="Honk">
            📯
          </button>
          <button className="btn btn--icon" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? 'Mute engine sound' : 'Turn engine sound on'} title="Engine sound">
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button className="btn btn--icon" onClick={() => store.set({ simple: true })} title="Plain, accessible version">
            2D view
          </button>
        </div>
      </header>
      <Effects />
      <SectionPanel />
      <RouteMap />
    </div>
  );
}
