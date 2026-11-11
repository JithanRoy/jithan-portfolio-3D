import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { palette } from '../../theme.js';
import { ride } from '../../store.js';

/**
 * Motorbike + rider built from primitives. Faces +Z.
 * Reads the shared `anim` object each frame: { wheel, steer, speed }.
 * Any replacement model must accept the same `anim` prop (see GLTFBike.jsx).
 */
const RAKE = -0.331; // fork tilt (radians)
const FORK = 0.68; // head-to-front-axle length

function Wheel({ wheelRef }) {
  return (
    <group ref={wheelRef}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.28, 0.085, 8, 22]} />
        <meshStandardMaterial color="#111318" roughness={0.9} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 18]} />
        <meshStandardMaterial color={palette.chrome} metalness={0.7} roughness={0.3} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[(i * Math.PI) / 3, 0, 0]}>
          <boxGeometry args={[0.08, 0.42, 0.05]} />
          <meshStandardMaterial color={palette.bike} emissive={palette.bike} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export function PrimitiveBike({ anim }) {
  const rear = useRef();
  const front = useRef();
  const steer = useRef();
  const rider = useRef();
  const torso = useRef();

  useFrame((state) => {
    rear.current.rotation.x = anim.wheel;
    front.current.rotation.x = anim.wheel;
    steer.current.rotation.y = anim.steer;
    if (!ride.reducedMotion) {
      const t = state.clock.elapsedTime;
      rider.current.position.y = Math.sin(t * 7) * 0.012 * (0.4 + anim.speed) + Math.sin(t * 1.3) * 0.008;
      torso.current.rotation.x = 0.55 + anim.speed * 0.25 + anim.rpm * 0.05; // tuck in at speed, lean on the throttle
    }
  });

  const body = <meshStandardMaterial color={palette.bike} roughness={0.35} metalness={0.3} />;
  const dark = <meshStandardMaterial color={palette.bikeDark} roughness={0.7} />;
  const chrome = <meshStandardMaterial color={palette.chrome} metalness={0.8} roughness={0.25} />;

  return (
    <group>
      {/* rear wheel + swingarm */}
      <group position={[0, 0.36, -0.7]}>
        <Wheel wheelRef={rear} />
      </group>
      <mesh position={[0, 0.42, -0.38]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.7]} />
        {dark}
      </mesh>

      {/* engine, frame, tank, seat, tail */}
      <mesh position={[0, 0.58, 0.05]}>
        <boxGeometry args={[0.36, 0.38, 0.55]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.8, 0.12]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.9]} />
        {body}
      </mesh>
      <mesh position={[0, 0.98, 0.22]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.42, 0.26, 0.55]} />
        {body}
      </mesh>
      <mesh position={[0, 0.96, -0.3]}>
        <boxGeometry args={[0.34, 0.1, 0.5]} />
        <meshStandardMaterial color="#14161f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.98, -0.66]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.3, 0.12, 0.38]} />
        {body}
      </mesh>
      <mesh position={[0, 0.99, -0.86]}>
        <boxGeometry args={[0.22, 0.06, 0.04]} />
        <meshBasicMaterial color="#ff2340" toneMapped={false} />
      </mesh>
      {/* exhaust */}
      <mesh position={[-0.24, 0.42, -0.42]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.7, 10]} />
        {chrome}
      </mesh>

      {/* steering head: rake group → steer group → fork + front wheel */}
      <group position={[0, 1.04, 0.5]} rotation={[RAKE, 0, 0]}>
        <group ref={steer}>
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x, -FORK / 2, 0]}>
              <cylinderGeometry args={[0.03, 0.03, FORK, 8]} />
              {chrome}
            </mesh>
          ))}
          <group position={[0, -FORK, 0]}>
            <Wheel wheelRef={front} />
          </group>
          <mesh position={[0, -FORK + 0.4, 0.02]}>
            <boxGeometry args={[0.2, 0.05, 0.5]} />
            {body}
          </mesh>
          {/* handlebar */}
          <mesh position={[0, 0.12, -0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.72, 8]} />
            {dark}
          </mesh>
          {/* headlight */}
          <mesh position={[0, -0.02, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.09, 0.12, 14]} />
            {chrome}
          </mesh>
          <mesh position={[0, -0.02, 0.205]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.095, 16]} />
            <meshBasicMaterial color="#fff6d8" toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* rider */}
      <group ref={rider}>
        <group position={[0, 1.02, -0.22]}>
          {/* legs */}
          {[-0.14, 0.14].map((x) => (
            <group key={x}>
              <mesh position={[x * 1.25, -0.02, 0.2]} rotation={[0.25, 0, 0]}>
                <boxGeometry args={[0.15, 0.16, 0.48]} />
                <meshStandardMaterial color="#20243a" />
              </mesh>
              <mesh position={[x * 1.35, -0.3, 0.38]} rotation={[-0.45, 0, 0]}>
                <boxGeometry args={[0.13, 0.48, 0.14]} />
                <meshStandardMaterial color="#20243a" />
              </mesh>
            </group>
          ))}
          <group ref={torso} rotation={[0.6, 0, 0]}>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.44, 0.6, 0.26]} />
              <meshStandardMaterial color={palette.rider} roughness={0.6} />
            </mesh>
            {/* arms reaching to the bars */}
            {[-0.25, 0.25].map((x) => (
              <mesh key={x} position={[x, 0.42, 0.24]} rotation={[-1.25, 0, 0]}>
                <boxGeometry args={[0.11, 0.52, 0.11]} />
                <meshStandardMaterial color={palette.rider} roughness={0.6} />
              </mesh>
            ))}
            {/* helmet + visor */}
            <group position={[0, 0.74, 0.02]} rotation={[-0.45, 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.19, 16, 12]} />
                <meshStandardMaterial color={palette.helmet} roughness={0.3} metalness={0.1} />
              </mesh>
              <mesh position={[0, 0.0, 0.11]} scale={[1, 0.55, 0.6]}>
                <sphereGeometry args={[0.16, 14, 10]} />
                <meshStandardMaterial color="#0d1222" roughness={0.1} metalness={0.6} />
              </mesh>
              <mesh position={[0, 0.06, -0.02]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.04, 0.03, 0.4]} />
                <meshBasicMaterial color={palette.pink} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
