import { lazy, Suspense, useEffect } from 'react';
import { store, useStore, ride } from './store.js';
import { SimpleSite } from './ui/SimpleSite.jsx';

const RideApp = lazy(() => import('./RideApp.jsx'));

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

const canRide = hasWebGL();
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
ride.reducedMotion = motionQuery.matches;
store.set({ simple: !canRide || new URLSearchParams(location.search).get('view') === 'simple' });

export default function App() {
  const simple = useStore((s) => s.simple);

  // Keep ?view=simple in the URL so the simple version is shareable.
  useEffect(() => {
    const url = new URL(location.href);
    if (simple) url.searchParams.set('view', 'simple');
    else url.searchParams.delete('view');
    history.replaceState(null, '', url);
    document.documentElement.classList.toggle('is-riding', !simple);
  }, [simple]);

  useEffect(() => {
    const onChange = (e) => (ride.reducedMotion = e.matches);
    motionQuery.addEventListener('change', onChange);
    return () => motionQuery.removeEventListener('change', onChange);
  }, []);

  if (simple) return <SimpleSite canRide={canRide} />;
  return (
    <Suspense fallback={<div className="loader" role="status">Loading…</div>}>
      <RideApp />
    </Suspense>
  );
}
