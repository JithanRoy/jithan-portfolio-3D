import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { samples, ROAD_WIDTH, ROAD_LENGTH, curve } from './roadPath.js';
import { palette } from '../theme.js';

/** Flat strip following the road between two side offsets (left-positive). */
function ribbon(a, b, y) {
  const n = samples.length;
  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  const idx = [];
  samples.forEach((s, i) => {
    const A = s.point.clone().addScaledVector(s.left, a);
    const B = s.point.clone().addScaledVector(s.left, b);
    pos.set([A.x, y, A.z, B.x, y, B.z], i * 6);
    uv.set([0, s.dist / ROAD_WIDTH, 1, s.dist / ROAD_WIDTH], i * 4);
    if (i < n - 1) {
      const a0 = i * 2;
      idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function Dashes() {
  const ref = useRef();
  const spacing = 7;
  const count = Math.floor(ROAD_LENGTH / spacing);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    const tan = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const t = (i * spacing) / ROAD_LENGTH;
      curve.getPointAt(t, m.position);
      curve.getTangentAt(t, tan);
      m.position.y = 0.035;
      m.lookAt(m.position.clone().add(tan));
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[null, null, count]} frustumCulled={false}>
      <boxGeometry args={[0.18, 0.02, 2.6]} />
      <meshBasicMaterial color={palette.roadDash} toneMapped={false} />
    </instancedMesh>
  );
}

export function Road() {
  const half = ROAD_WIDTH / 2;
  const geo = useMemo(
    () => ({
      shoulder: ribbon(half + 1.6, -half - 1.6, 0.0),
      road: ribbon(half, -half, 0.015),
      edgeL: ribbon(half - 0.25, half - 0.45, 0.03),
      edgeR: ribbon(-half + 0.45, -half + 0.25, 0.03),
    }),
    [half]
  );
  return (
    <group>
      <mesh geometry={geo.shoulder}>
        <meshStandardMaterial color={palette.shoulder} roughness={1} />
      </mesh>
      <mesh geometry={geo.road}>
        <meshStandardMaterial color={palette.road} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh geometry={geo.edgeL}>
        <meshBasicMaterial color={palette.cyan} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.edgeR}>
        <meshBasicMaterial color={palette.pink} toneMapped={false} />
      </mesh>
      <Dashes />
    </group>
  );
}
