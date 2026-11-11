import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Scene } from './three/Scene.jsx';
import { Hud } from './ui/Hud.jsx';
import { Loader } from './ui/Loader.jsx';
import { profile } from './content.js';

/** The 3D experience (code-split so the simple version never downloads three.js). */
export default function RideApp() {
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio || 1, 2));
  return (
    <div className="ride">
      <h1 className="sr-only">
        {profile.name} — {profile.role}
      </h1>
      <div className="ride__canvas">
        <Canvas
          dpr={[1, dpr]}
          camera={{ fov: 55, near: 0.1, far: 900, position: [0, 3, 48] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          aria-label="3D motorbike ride through the portfolio"
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(window.devicePixelRatio || 1, 2))} />
          <Scene />
        </Canvas>
      </div>
      <Hud />
      <Loader />
    </div>
  );
}
