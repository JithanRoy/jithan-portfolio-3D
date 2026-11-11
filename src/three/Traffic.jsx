import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { curve, ROAD_LENGTH, LANE_CENTER } from './roadPath.js';
import { ride } from '../store.js';
import { palette } from '../theme.js';

const COLORS = [palette.cyan, palette.orange, '#8b7bff', '#f5f7ff'];
const UP = new THREE.Vector3(0, 1, 0);

function Car({ color }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.8, 0.6, 4]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.05, -0.3]}>
        <boxGeometry args={[1.5, 0.5, 2]} />
        <meshStandardMaterial color="#141826" roughness={0.2} metalness={0.6} />
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.6, 2.01]}>
            <boxGeometry args={[0.4, 0.15, 0.02]} />
            <meshBasicMaterial color="#fff4d6" toneMapped={false} />
          </mesh>
          <mesh position={[x, 0.65, -2.01]}>
            <boxGeometry args={[0.4, 0.12, 0.02]} />
            <meshBasicMaterial color="#ff2340" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {[[-0.85, 1.3], [0.85, 1.3], [-0.85, -1.3], [0.85, -1.3]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.24, 10]} />
          <meshStandardMaterial color="#0e0f14" />
        </mesh>
      ))}
    </group>
  );
}

/** Oncoming cars that loop around the rider so there is always some traffic. */
export function Traffic({ count = 4 }) {
  const refs = useRef([]);
  const cars = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ t: 0.05 + i * 0.05, speed: 14 + i * 3, color: COLORS[i % COLORS.length] })),
    [count]
  );
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), tan: new THREE.Vector3(), left: new THREE.Vector3() }), []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    cars.forEach((car, i) => {
      const g = refs.current[i];
      if (!g) return;
      car.t -= (car.speed * d) / ROAD_LENGTH;
      // Respawn ahead of the rider once behind (or too far ahead).
      const rel = (car.t - ride.progress) * ROAD_LENGTH;
      if (rel < -40 || rel > 320 || car.t <= 0) {
        car.t = Math.min(ride.progress + (160 + Math.random() * 140) / ROAD_LENGTH, 0.995);
      }
      curve.getPointAt(car.t, tmp.p);
      curve.getTangentAt(car.t, tmp.tan);
      tmp.left.crossVectors(UP, tmp.tan).normalize();
      tmp.p.addScaledVector(tmp.left, -LANE_CENTER);
      g.position.copy(tmp.p);
      g.lookAt(tmp.p.sub(tmp.tan));
      g.visible = rel > -40 && car.t < 0.99;
    });
  });

  return cars.map((c, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)}>
      <Car color={c.color} />
    </group>
  ));
}
