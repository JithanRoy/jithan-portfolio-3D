import { Suspense, useEffect } from 'react';
import { ScrollControls } from '@react-three/drei';
import { SCROLL_PAGES } from '../route.js';
import { ride, store } from '../store.js';
import { Atmosphere } from './Atmosphere.jsx';
import { Road } from './Road.jsx';
import { Scenery } from './Scenery.jsx';
import { Traffic } from './Traffic.jsx';
import { Landmarks } from './Landmarks.jsx';
import { Rider } from './Rider.jsx';

/** Signals the loader once everything inside the Suspense boundary has mounted. */
function Ready() {
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => store.set({ ready: true })));
    return () => cancelAnimationFrame(id);
  }, []);
  return null;
}

export function Scene() {
  return (
    <ScrollControls
      pages={SCROLL_PAGES}
      damping={ride.reducedMotion ? 0.05 : 0.22}
      maxSpeed={2}
      style={{ scrollbarWidth: 'none' }}
    >
      <Atmosphere />
      <Suspense fallback={null}>
        <Road />
        <Scenery />
        <Traffic />
        <Landmarks />
        <Rider />
        <Ready />
      </Suspense>
    </ScrollControls>
  );
}
