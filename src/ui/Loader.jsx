import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { store, useStore } from '../store.js';
import { profile } from '../content.js';

/**
 * Shows real asset progress (useProgress — e.g. a .glb bike) and otherwise eases
 * toward 90% until the scene reports it has mounted and rendered.
 */
export function Loader() {
  const { progress: assetProgress, active } = useProgress();
  const ready = useStore((s) => s.ready);
  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let id;
    const tick = () => {
      setShown((v) => {
        const target = ready && !active ? 100 : Math.max(Math.min(90, v + (90 - v) * 0.04), active ? assetProgress * 0.9 : 0);
        return v + (target - v) * 0.2;
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [ready, active, assetProgress]);

  const done = ready && !active && shown > 99;
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setGone(true), 700);
    return () => clearTimeout(id);
  }, [done]);

  if (gone) return null;
  return (
    <div className={`loader ${done ? 'is-done' : ''}`} role="status" aria-live="polite">
      <div className="loader__inner">
        <div className="loader__wheel" aria-hidden="true" />
        <p className="loader__name">{profile.name}</p>
        <p className="loader__label">Warming up the engine… {Math.round(shown)}%</p>
        <div className="loader__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${shown / 100})` }} />
        </div>
        <button className="btn btn--ghost" onClick={() => store.set({ simple: true })}>
          View simple version instead
        </button>
      </div>
    </div>
  );
}
