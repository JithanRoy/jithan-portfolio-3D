import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { skyKeys } from '../theme.js';
import { ride } from '../store.js';

/** Shared day→night state, read by other scene parts each frame. */
export const atmo = { night: 0, ground: new THREE.Color(skyKeys[0].ground) };

const WHITE = new THREE.Color('#ffffff');
const keys = skyKeys.map((k) => ({
  ...k,
  top: new THREE.Color(k.top),
  horizon: new THREE.Color(k.horizon),
  ground: new THREE.Color(k.ground),
  sun: new THREE.Color(k.sun),
}));

function sample(p, out) {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].at) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const f = THREE.MathUtils.clamp((p - a.at) / (b.at - a.at), 0, 1);
  out.top.copy(a.top).lerp(b.top, f);
  out.horizon.copy(a.horizon).lerp(b.horizon, f);
  out.ground.copy(a.ground).lerp(b.ground, f);
  out.sun.copy(a.sun).lerp(b.sun, f);
  out.sunIntensity = THREE.MathUtils.lerp(a.sunIntensity, b.sunIntensity, f);
  out.ambient = THREE.MathUtils.lerp(a.ambient, b.ambient, f);
  return out;
}

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const skyFrag = /* glsl */ `
  uniform vec3 top; uniform vec3 horizon; uniform vec3 ground;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 c = h > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.6, h), 0.8)) : mix(horizon, ground, smoothstep(0.0, 0.08, -h));
    gl_FragColor = vec4(c, 1.0);
  }`;

function makeStars(count = 700) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = 0.08 + Math.random() * 0.9; // upper hemisphere only
    const r = 480;
    pos[i * 3] = Math.cos(u) * Math.sqrt(1 - v * v) * r;
    pos[i * 3 + 1] = v * r;
    pos[i * 3 + 2] = Math.sin(u) * Math.sqrt(1 - v * v) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return g;
}

export function Atmosphere() {
  const { scene } = useThree();
  const sky = useRef();
  const sun = useRef();
  const sunDisc = useRef();
  const hemi = useRef();
  const stars = useRef();
  const cur = useMemo(
    () => ({ top: new THREE.Color(), horizon: new THREE.Color(), ground: new THREE.Color(), sun: new THREE.Color() }),
    []
  );
  const uniforms = useMemo(
    () => ({ top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, ground: { value: new THREE.Color() } }),
    []
  );
  const starGeo = useMemo(() => makeStars(), []);
  const fog = useMemo(() => new THREE.Fog('#000', 70, 300), []);
  const sunDir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    const p = ride.progress;
    sample(p, cur);
    atmo.night = THREE.MathUtils.smoothstep(p, 0.3, 0.9);
    atmo.ground.copy(cur.ground);

    uniforms.top.value.copy(cur.top);
    uniforms.horizon.value.copy(cur.horizon);
    uniforms.ground.value.copy(cur.ground);
    sky.current.position.copy(camera.position);
    stars.current.position.copy(camera.position);
    stars.current.material.opacity = atmo.night * 0.9;

    scene.fog = fog;
    fog.color.copy(cur.horizon).lerp(cur.ground, 0.35);
    scene.background = fog.color;

    hemi.current.color.copy(cur.top).lerp(WHITE, 0.5);
    hemi.current.groundColor.copy(cur.ground);
    hemi.current.intensity = cur.ambient * 1.6;

    // The sun hangs ahead of the ride and sinks below the horizon as it progresses.
    const elev = THREE.MathUtils.lerp(0.16, -0.12, THREE.MathUtils.smoothstep(p, 0, 0.75));
    sunDir.set(0.35, elev, -1).normalize();
    sun.current.position.copy(camera.position).addScaledVector(sunDir, 100);
    sun.current.target.position.copy(camera.position);
    sun.current.target.updateMatrixWorld();
    sun.current.color.copy(cur.sun);
    sun.current.intensity = cur.sunIntensity;
    sunDisc.current.position.copy(camera.position).addScaledVector(sunDir, 420);
    sunDisc.current.lookAt(camera.position);
    sunDisc.current.material.color.copy(cur.sun).multiplyScalar(1.6);
  });

  return (
    <>
      <mesh ref={sky} renderOrder={-1}>
        <sphereGeometry args={[500, 32, 16]} />
        <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={sunDisc}>
        <circleGeometry args={[26, 40]} />
        <meshBasicMaterial toneMapped={false} fog={false} depthWrite={false} />
      </mesh>
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} transparent opacity={0} fog={false} depthWrite={false} />
      </points>
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} />
    </>
  );
}
