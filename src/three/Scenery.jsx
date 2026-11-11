import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { samples, distToRoadSq, ROAD_WIDTH, pointBeside } from './roadPath.js';
import { keepOut } from './layout.js';
import { palette } from '../theme.js';
import { atmo } from './Atmosphere.jsx';
import { ride } from '../store.js';

/** Deterministic random so the scenery is identical on every visit. */
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clearOfRoad = (x, z, margin) => distToRoadSq(x, z) > (ROAD_WIDTH / 2 + margin) ** 2;
const clearOfLandmarks = (x, z) => keepOut.every((k) => (k.x - x) ** 2 + (k.z - z) ** 2 > k.r * k.r);

function useInstances(ref, items, apply) {
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    items.forEach((it, i) => {
      m.position.set(0, 0, 0);
      m.rotation.set(0, 0, 0);
      m.scale.set(1, 1, 1);
      apply(m, it, i);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ── Trees (instanced, foliage sways in the vertex shader) ───────────────── */
function Trees() {
  const trunks = useRef();
  const leaves = useRef();
  const items = useMemo(() => {
    const r = rng(7);
    const out = [];
    let guard = 0;
    while (out.length < 320 && guard++ < 4000) {
      const s = samples[Math.floor(r() * samples.length)];
      const side = (r() < 0.5 ? -1 : 1) * (ROAD_WIDTH / 2 + 4 + r() ** 1.6 * 70);
      const x = s.point.x + s.left.x * side + (r() - 0.5) * 6;
      const z = s.point.z + s.left.z * side + (r() - 0.5) * 6;
      if (!clearOfRoad(x, z, 3.5) || !clearOfLandmarks(x, z)) continue;
      out.push({ x, z, s: 0.8 + r() * 0.9, rot: r() * Math.PI });
    }
    return out;
  }, []);

  useInstances(trunks, items, (m, it) => {
    m.position.set(it.x, 0.9 * it.s, it.z);
    m.scale.setScalar(it.s);
  });
  useInstances(leaves, items, (m, it) => {
    m.position.set(it.x, 3.2 * it.s, it.z);
    m.rotation.y = it.rot;
    m.scale.setScalar(it.s);
  });

  const shader = useRef();
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: palette.foliage, flatShading: true, roughness: 0.9 });
    mat.onBeforeCompile = (s) => {
      s.uniforms.uTime = { value: 0 };
      shader.current = s;
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float phase = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.07;
           float sway = sin(uTime * 1.4 + phase) * 0.12 * max(position.y + 1.2, 0.0);
           transformed.x += sway;
           transformed.z += sway * 0.5;`
        );
    };
    return mat;
  }, []);

  useFrame((state) => {
    if (shader.current) shader.current.uniforms.uTime.value = ride.reducedMotion ? 0 : state.clock.elapsedTime;
  });

  return (
    <>
      <instancedMesh ref={trunks} args={[null, null, items.length]}>
        <cylinderGeometry args={[0.18, 0.26, 1.8, 6]} />
        <meshStandardMaterial color={palette.trunk} flatShading />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[null, null, items.length]} material={material}>
        <coneGeometry args={[1.5, 3.8, 7]} />
      </instancedMesh>
    </>
  );
}

/* ── Distant low-poly hills ─────────────────────────────────────────────── */
function Hills() {
  const ref = useRef();
  const items = useMemo(() => {
    const r = rng(21);
    const out = [];
    let guard = 0;
    while (out.length < 70 && guard++ < 3000) {
      const s = samples[Math.floor(r() * samples.length)];
      const side = (r() < 0.5 ? -1 : 1) * (70 + r() * 150);
      const x = s.point.x + s.left.x * side;
      const z = s.point.z + s.left.z * side;
      const size = 20 + r() * 40;
      if (!clearOfRoad(x, z, size + 15)) continue;
      out.push({ x, z, size, h: 0.4 + r() * 0.8, rot: r() * 6 });
    }
    return out;
  }, []);
  useInstances(ref, items, (m, it) => {
    m.position.set(it.x, 0, it.z);
    m.scale.set(it.size, it.size * it.h, it.size);
    m.rotation.y = it.rot;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, items.length]}>
      <coneGeometry args={[1, 1, 6, 1]} />
      <meshStandardMaterial color={palette.hill} flatShading roughness={1} />
    </instancedMesh>
  );
}

/* ── Street lamps with fake light pools that fade in at night ───────────── */
function Lamps() {
  const poles = useRef();
  const bulbs = useRef();
  const pools = useRef();
  const items = useMemo(() => {
    const out = [];
    for (let i = 3; i < samples.length - 3; i += 34) {
      const s = samples[i];
      const side = (i / 34) % 2 ? 1 : -1;
      const off = side * (ROAD_WIDTH / 2 + 1.1);
      const x = s.point.x + s.left.x * off;
      const z = s.point.z + s.left.z * off;
      if (!clearOfLandmarks(x, z)) continue;
      out.push({ x, z, lx: s.point.x + s.left.x * side * (ROAD_WIDTH / 2 - 0.6), lz: s.point.z + s.left.z * side * (ROAD_WIDTH / 2 - 0.6) });
    }
    return out;
  }, []);
  useInstances(poles, items, (m, it) => m.position.set(it.x, 2.6, it.z));
  useInstances(bulbs, items, (m, it) => m.position.set(it.lx, 5.1, it.lz));
  useInstances(pools, items, (m, it) => {
    m.position.set(it.lx, 0.05, it.lz);
    m.rotation.x = -Math.PI / 2;
  });
  useFrame(() => {
    pools.current.material.opacity = atmo.night * 0.32;
  });
  return (
    <>
      <instancedMesh ref={poles} args={[null, null, items.length]}>
        <cylinderGeometry args={[0.07, 0.1, 5.2, 6]} />
        <meshStandardMaterial color="#2b3048" metalness={0.5} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[null, null, items.length]}>
        <boxGeometry args={[0.5, 0.14, 1.4]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[null, null, items.length]}>
        <circleGeometry args={[3.4, 20]} />
        <meshBasicMaterial color="#ffcf8a" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </>
  );
}

/* ── Floating clouds (instanced puffs drifting slowly) ──────────────────── */
function Clouds() {
  const ref = useRef();
  const puffs = useMemo(() => {
    const r = rng(99);
    const out = [];
    for (let c = 0; c < 22; c++) {
      const s = samples[Math.floor(r() * samples.length)];
      const side = (r() - 0.5) * 220;
      const cx = s.point.x + s.left.x * side;
      const cz = s.point.z + s.left.z * side;
      const cy = 38 + r() * 30;
      const speed = 0.6 + r() * 1.2;
      for (let k = 0; k < 4; k++) {
        out.push({ x: cx + (k - 1.5) * 5 + r() * 2, y: cy + r() * 2, z: cz + (r() - 0.5) * 4, s: 4 + r() * 3.5, speed });
      }
    }
    return out;
  }, []);
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const t = ride.reducedMotion ? 0 : state.clock.elapsedTime;
    puffs.forEach((p, i) => {
      m.position.set(p.x + Math.sin(t * 0.02 * p.speed + p.speed * 9) * 40, p.y, p.z);
      m.scale.set(p.s * 1.5, p.s * 0.7, p.s);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, puffs.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#ffd7e6" flatShading roughness={1} emissive="#5a3a7a" emissiveIntensity={0.25} />
    </instancedMesh>
  );
}

/* ── Neon city blocks near the end of the ride ──────────────────────────── */
function windowTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 64, 128);
  const r = rng(5);
  for (let y = 4; y < 124; y += 10) {
    for (let x = 4; x < 60; x += 12) {
      if (r() < 0.55) {
        g.fillStyle = r() < 0.25 ? palette.pink : r() < 0.5 ? palette.cyan : '#ffd9a0';
        g.fillRect(x, y, 7, 5);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function City() {
  const ref = useRef();
  const tex = useMemo(windowTexture, []);
  const items = useMemo(() => {
    const r = rng(42);
    const out = [];
    let guard = 0;
    while (out.length < 60 && guard++ < 3000) {
      const t = 0.72 + r() * 0.28;
      const side = (r() < 0.5 ? -1 : 1) * (ROAD_WIDTH / 2 + 18 + r() * 60);
      const p = pointBeside(t, side);
      const w = 6 + r() * 8;
      const h = 10 + r() ** 2 * 40;
      if (!clearOfRoad(p.x, p.z, w + 6) || !clearOfLandmarks(p.x, p.z)) continue;
      out.push({ x: p.x, z: p.z, w, h, d: 6 + r() * 8, rot: r() * 3 });
    }
    return out;
  }, []);
  useInstances(ref, items, (m, it) => {
    m.position.set(it.x, it.h / 2, it.z);
    m.scale.set(it.w, it.h, it.d);
    m.rotation.y = it.rot;
  });
  useFrame(() => {
    ref.current.material.emissiveIntensity = 0.2 + atmo.night * 1.6;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, items.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1b1f36" emissive="#ffffff" emissiveMap={tex} roughness={0.8} />
    </instancedMesh>
  );
}

/* ── Ground plane, recoloured as the sun sets ───────────────────────────── */
function Ground() {
  const ref = useRef();
  const center = useMemo(() => pointBeside(0.5, 0), []);
  useFrame(() => ref.current.material.color.copy(atmo.ground).multiplyScalar(0.9));
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.02, center.z]}>
      <planeGeometry args={[2400, 2400]} />
      <meshStandardMaterial color={palette.ground} roughness={1} />
    </mesh>
  );
}

export function Scenery() {
  return (
    <>
      <Ground />
      <Hills />
      <Trees />
      <Lamps />
      <Clouds />
      <City />
    </>
  );
}
