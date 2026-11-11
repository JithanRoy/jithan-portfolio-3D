import { lazy } from 'react';
import { bikeConfig } from './bikeConfig.js';
import { PrimitiveBike } from './PrimitiveBike.jsx';

// The GLB loader is only downloaded when a model is configured.
const GLTFBike = lazy(() => import('./GLTFBike.jsx').then((m) => ({ default: m.GLTFBike })));

/** Swap point between the primitive bike and a .glb model. */
export function Bike({ anim }) {
  return bikeConfig.modelUrl ? <GLTFBike anim={anim} /> : <PrimitiveBike anim={anim} />;
}
