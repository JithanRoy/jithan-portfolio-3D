import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useCursor } from '@react-three/drei';
import { landmarks } from './layout.js';
import { pointBeside, ahead, ROAD_LENGTH, ROAD_WIDTH } from './roadPath.js';
import { profile, skills, projects, experience, contact } from '../content.js';
import { palette } from '../theme.js';
import { ride } from '../store.js';

/** True while the rider is within `range` meters of progress t (re-renders only on change). */
function useNear(t, range = 140) {
  const [near, setNear] = useState(false);
  const last = useRef(false);
  useFrame(() => {
    const n = Math.abs(ride.progress - t) * ROAD_LENGTH < range;
    if (n !== last.current) {
      last.current = n;
      setNear(n);
    }
  });
  return near;
}

/** Positions children beside the road at progress t, facing the approaching rider. */
function Placed({ t, side, children }) {
  const { position, rotation } = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.copy(pointBeside(t, side));
    o.lookAt(pointBeside(Math.max(t - 45 / ROAD_LENGTH, 0), side * 0.15));
    return { position: o.position.clone(), rotation: o.rotation.clone() };
  }, [t, side]);
  return (
    <group position={position} rotation={rotation}>
      {children}
    </group>
  );
}

/** In-world HTML label sized to a board of `w` × `h` world units (400px wide). */
function Label({ w, h, position, className = '', children }) {
  // Pin the portal to the canvas wrapper: by default <Html> mounts into ScrollControls'
  // scroll container once it is connected, which offsets labels by the scroll position.
  const gl = useThree((s) => s.gl);
  const portal = useMemo(() => ({ current: gl.domElement.parentNode }), [gl]);
  return (
    <Html transform distanceFactor={w} position={position} pointerEvents="none" zIndexRange={[20, 0]} portal={portal}>
      <div className={`label ${className}`} style={{ width: 400, height: (400 * h) / w }}>
        {children}
      </div>
    </Html>
  );
}

function Post({ x = 0, h, r = 0.12, color = '#2b3048' }) {
  return (
    <mesh position={[x, h / 2, 0]}>
      <cylinderGeometry args={[r, r * 1.2, h, 8]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
    </mesh>
  );
}

function Glow({ args, position, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/* ── 1. Start gate ──────────────────────────────────────────────────────── */
function Gate({ t, near }) {
  const span = ROAD_WIDTH / 2 + 1.4;
  return (
    <Placed t={t} side={0}>
      <Post x={-span} h={7.2} r={0.3} color="#2a2f4a" />
      <Post x={span} h={7.2} r={0.3} color="#2a2f4a" />
      <mesh position={[0, 6.4, 0]}>
        <boxGeometry args={[span * 2 + 0.8, 2.6, 0.3]} />
        <meshStandardMaterial color={palette.navy} />
      </mesh>
      <Glow args={[span * 2 + 1, 0.12, 0.34]} position={[0, 5.05, 0]} color={palette.cyan} />
      <Glow args={[span * 2 + 1, 0.12, 0.34]} position={[0, 7.75, 0]} color={palette.pink} />
      {near && (
        <Label w={span * 2} h={2.4} position={[0, 6.4, 0.17]} className="label--gate">
          <strong>{profile.name}</strong>
          <span>{profile.role} · Welcome aboard</span>
        </Label>
      )}
    </Placed>
  );
}

/* ── 2. About: roadside garage ──────────────────────────────────────────── */
function Garage({ t, side, near }) {
  return (
    <Placed t={t} side={side}>
      <mesh position={[0, 2.6, -3.5]}>
        <boxGeometry args={[10, 5.2, 7]} />
        <meshStandardMaterial color="#3b3150" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.4, -3.2]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[10.8, 0.35, 7.8]} />
        <meshStandardMaterial color="#232338" />
      </mesh>
      {/* roll-up door */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 0.3 + i * 0.5, 0.02]}>
          <boxGeometry args={[5.4, 0.42, 0.08]} />
          <meshStandardMaterial color="#9aa3c7" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <Glow args={[5.8, 0.1, 0.1]} position={[0, 3.75, 0.05]} color={palette.orange} />
      <mesh position={[0, 4.55, 0.06]}>
        <boxGeometry args={[7.2, 1.2, 0.12]} />
        <meshStandardMaterial color={palette.navy} />
      </mesh>
      {/* oil drum & tyre stack for character */}
      <mesh position={[4, 0.55, 0.9]}>
        <cylinderGeometry args={[0.45, 0.45, 1.1, 12]} />
        <meshStandardMaterial color={palette.pink} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-4, 0.17 + i * 0.32, 1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.17, 6, 14]} />
          <meshStandardMaterial color="#14161f" />
        </mesh>
      ))}
      {near && (
        <Label w={7.2} h={1.2} position={[0, 4.55, 0.13]} className="label--neon">
          <strong>About · {profile.name.split(' ')[0]}&apos;s Garage</strong>
        </Label>
      )}
    </Placed>
  );
}

/* ── 3. Skills: a row of road signs ─────────────────────────────────────── */
function SkillSigns({ t, side, near }) {
  return skills.map((g, i) => (
    <Placed key={g.group} t={ahead(t, i * 11)} side={side + (i % 2) * 0.6}>
      <Post x={-2.4} h={2.6} />
      <Post x={2.4} h={2.6} />
      <mesh position={[0, 4.6, 0]}>
        <boxGeometry args={[6.2, 4.3, 0.15]} />
        <meshStandardMaterial color={palette.orange} />
      </mesh>
      <mesh position={[0, 4.6, 0.06]}>
        <boxGeometry args={[5.9, 4, 0.06]} />
        <meshStandardMaterial color="#123a5a" />
      </mesh>
      {near && (
        <Label w={5.9} h={4} position={[0, 4.6, 0.1]} className="label--sign">
          <strong>{g.group}</strong>
          <ul>
            {g.items.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Label>
      )}
    </Placed>
  ));
}

/* ── 4. Projects: one clickable billboard each ──────────────────────────── */
function Billboard({ t, side, near, project, index }) {
  const [hover, setHover] = useState(false);
  useCursor(hover && !!project.link);
  const frame = index % 2 ? palette.cyan : palette.pink;
  const open = (e) => {
    e.stopPropagation();
    if (project.link) window.open(project.link, '_blank', 'noopener,noreferrer');
  };
  return (
    <Placed t={t} side={side}>
      <Post x={-3.6} h={4.2} r={0.18} />
      <Post x={3.6} h={4.2} r={0.18} />
      <mesh position={[0, 7, -0.05]}>
        <boxGeometry args={[10.6, 6.1, 0.2]} />
        <meshBasicMaterial color={frame} toneMapped={false} />
      </mesh>
      <mesh
        position={[0, 7, 0.06]}
        onClick={open}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[10, 5.6, 0.1]} />
        <meshStandardMaterial color={palette.navy} emissive={frame} emissiveIntensity={hover ? 0.18 : 0.04} />
      </mesh>
      {near && (
        <Label w={10} h={5.6} position={[0, 7, 0.12]} className="label--billboard">
          <small>Project {String(index + 1).padStart(2, '0')}</small>
          <strong>{project.name}</strong>
          <p>{project.summary}</p>
          <div className="chips">
            {project.tech.slice(0, 4).map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          {project.link && <em>Click to visit ↗</em>}
        </Label>
      )}
    </Placed>
  );
}

/* ── 5. Experience: milestone markers ───────────────────────────────────── */
function Milestone({ t, side, near, job }) {
  return (
    <Placed t={t} side={side}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[2.4, 3, 0.6]} />
        <meshStandardMaterial color="#e8ecff" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.3, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.25, 0.8, 4]} />
        <meshStandardMaterial color={palette.pink} flatShading />
      </mesh>
      <Glow args={[2.42, 0.12, 0.62]} position={[0, 0.25, 0]} color={palette.cyan} />
      {near && (
        <Label w={2.2} h={2.6} position={[0, 1.6, 0.31]} className="label--milestone">
          <strong>{job.year}</strong>
          <span>{job.role}</span>
          <small>{job.company}</small>
        </Label>
      )}
    </Placed>
  );
}

/* ── 6. Finish line + rest stop ─────────────────────────────────────────── */
function useChecker() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 4;
    const g = c.getContext('2d');
    for (let x = 0; x < 16; x++)
      for (let y = 0; y < 4; y++) {
        g.fillStyle = (x + y) % 2 ? '#111' : '#f5f7ff';
        g.fillRect(x, y, 1, 1);
      }
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function Finish({ t, near }) {
  const checker = useChecker();
  const span = ROAD_WIDTH / 2 + 1.4;
  return (
    <Placed t={t} side={0}>
      <Post x={-span} h={7} r={0.3} color="#2a2f4a" />
      <Post x={span} h={7} r={0.3} color="#2a2f4a" />
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[span * 2 + 0.6, 1.6, 0.2]} />
        <meshBasicMaterial map={checker} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_WIDTH, 1.2]} />
        <meshBasicMaterial map={checker} />
      </mesh>
      {near && (
        <Label w={8} h={1.4} position={[0, 7.8, 0]} className="label--neon">
          <strong>Finish · Let&apos;s talk</strong>
        </Label>
      )}
    </Placed>
  );
}

function RestStop({ t, side, near }) {
  const stripes = [palette.pink, '#f5f7ff', palette.cyan, '#f5f7ff', palette.pink, '#f5f7ff'];
  return (
    <Placed t={t} side={side}>
      <mesh position={[0, 2, -3]}>
        <boxGeometry args={[9, 4, 6]} />
        <meshStandardMaterial color="#2a2f4a" />
      </mesh>
      <mesh position={[0, 1.6, 0.02]}>
        <boxGeometry args={[5, 2, 0.05]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffb347" emissiveIntensity={0.9} />
      </mesh>
      {stripes.map((c, i) => (
        <mesh key={i} position={[-3.75 + i * 1.5, 3.2, 0.9]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[1.5, 0.08, 2]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
      <mesh position={[3, 0.45, 2.2]}>
        <boxGeometry args={[2.2, 0.12, 0.6]} />
        <meshStandardMaterial color="#8a5a3c" />
      </mesh>
      {near && (
        <Label w={8} h={2} position={[0, 5, -0.1]} className="label--gate">
          <strong>Rest stop</strong>
          <span>{contact.email}</span>
        </Label>
      )}
    </Placed>
  );
}

function LandmarkItem({ l }) {
  const near = useNear(l.t, l.type === 'skills' ? 180 : 140);
  switch (l.type) {
    case 'gate':
      return <Gate t={l.t} near={near} />;
    case 'garage':
      return <Garage t={l.t} side={l.side} near={near} />;
    case 'skills':
      return <SkillSigns t={l.t} side={l.side} near={near} />;
    case 'billboard':
      return <Billboard t={l.t} side={l.side} near={near} project={projects[l.stop.index]} index={l.stop.index} />;
    case 'milestone':
      return <Milestone t={l.t} side={l.side} near={near} job={experience[l.stop.index]} />;
    case 'finish':
      return <Finish t={l.t} near={near} />;
    case 'restStop':
      return <RestStop t={l.t} side={l.side} near={near} />;
    default:
      return null;
  }
}

export function Landmarks() {
  return landmarks.map((l, i) => <LandmarkItem key={`${l.type}-${i}`} l={l} />);
}
