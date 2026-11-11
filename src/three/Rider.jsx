import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { curve, ROAD_LENGTH, LANE_CENTER, LANE_LIMIT } from './roadPath.js';
import { offsetToProgress, nearestStop, stops, STOP_WINDOW } from '../route.js';
import { ride, store } from '../store.js';
import { updateEngine } from '../audio/engine.js';
import { Bike } from './bike/Bike.jsx';
import { bikeConfig } from './bike/bikeConfig.js';
import { atmo } from './Atmosphere.jsx';

const { damp, clamp } = THREE.MathUtils;
const UP = new THREE.Vector3(0, 1, 0);

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

function useKeyboard() {
  useEffect(() => {
    const set = (down) => (e) => {
      const k = KEYMAP[e.code];
      if (!k || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      ride.keys[k] = down;
    };
    const down = set(true);
    const up = set(false);
    const blur = () => Object.keys(ride.keys).forEach((k) => (ride.keys[k] = false));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);
}

/** Soft radial texture for the headlight's pool of light on the road. */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
}

export function Rider() {
  const scroll = useScroll();
  const { camera, size } = useThree();
  useKeyboard();

  const rig = useRef();
  const leanGroup = useRef();
  const spot = useRef();
  const beam = useRef();
  const spotTarget = useMemo(() => new THREE.Object3D(), []);
  const glowTex = useGlowTexture();

  // Shared animation state read by the bike model.
  const anim = useMemo(() => ({ wheel: 0, steer: 0, speed: 0, lean: 0 }), []);
  const local = useMemo(
    () => ({
      kb: 0, kbAcc: 0, lateral: 0, prevLateral: 0, init: false, active: -2,
      camPos: new THREE.Vector3(), look: new THREE.Vector3(),
      pos: new THREE.Vector3(), tan: new THREE.Vector3(), tan2: new THREE.Vector3(),
      left: new THREE.Vector3(), tmp: new THREE.Vector3(),
    }),
    []
  );

  useEffect(() => {
    ride.scrollEl = scroll.el;
    return () => {
      if (ride.scrollEl === scroll.el) ride.scrollEl = null;
    };
  }, [scroll.el]);

  useFrame((state, rawDt) => {
    const dt = Math.min(Math.max(rawDt, 1e-3), 0.05); // first frame can report 0
    const reduced = ride.reducedMotion;
    const k = ride.keys;
    const el = scroll.el;

    // ── Throttle (W/S, arrows) drives the same scroll container as the wheel/touch.
    local.kb = damp(local.kb, (k.up ? 1 : 0) - (k.down ? 0.7 : 0), 2.5, dt);
    if (el && Math.abs(local.kb) > 0.002) {
      local.kbAcc += local.kb * dt * el.clientHeight * 1.1;
      const whole = Math.trunc(local.kbAcc);
      if (whole) {
        el.scrollTop += whole;
        local.kbAcc -= whole;
      }
    }

    // ── Progress along the road (eased near stops via offsetToProgress).
    const target = offsetToProgress(scroll.offset);
    const prev = ride.progress;
    const p = reduced ? target : damp(prev, target, 5, dt);
    ride.progress = p;
    const moved = (p - prev) * ROAD_LENGTH;
    anim.wheel += moved / bikeConfig.wheelRadius;
    anim.speed = damp(anim.speed, clamp(Math.abs(moved) / dt / 40, 0, 1), 4, dt);
    ride.speed = anim.speed;

    // ── Lateral steering within the lane (A/D, arrows).
    const steerIn = (k.left ? 1 : 0) - (k.right ? 1 : 0);
    local.lateral = clamp(local.lateral + steerIn * dt * 2.4, -LANE_LIMIT, LANE_LIMIT);
    if (!steerIn) local.lateral = damp(local.lateral, 0, 0.35, dt);
    const latVel = (local.lateral - local.prevLateral) / dt;
    local.prevLateral = local.lateral;

    // ── Pose on the curve.
    curve.getPointAt(p, local.pos);
    curve.getTangentAt(p, local.tan);
    curve.getTangentAt(Math.min(p + 8 / ROAD_LENGTH, 1), local.tan2);
    local.left.crossVectors(UP, local.tan).normalize();
    local.pos.addScaledVector(local.left, LANE_CENTER + local.lateral);
    rig.current.position.copy(local.pos);
    rig.current.lookAt(local.tmp.copy(local.pos).add(local.tan));

    // Turn > 0 means the road bends left. Lean into it (negative roll = left).
    const turn = local.tan.z * local.tan2.x - local.tan.x * local.tan2.z;
    const leanTarget = clamp(-(turn * 9 * (0.25 + anim.speed)) - latVel * 0.12, -0.45, 0.45);
    anim.lean = damp(anim.lean, reduced ? leanTarget * 0.4 : leanTarget, 5, dt);
    leanGroup.current.rotation.z = anim.lean;
    anim.steer = damp(anim.steer, clamp(turn * 3 + steerIn * 0.22, -0.4, 0.4), 6, dt);

    // ── Headlight brightens as night falls.
    const night = atmo.night;
    spot.current.intensity = 6 + night * 70;
    beam.current.material.opacity = night * 0.55;

    // ── Chase camera: behind & above, slight speed FOV.
    const portrait = size.width < size.height;
    const back = portrait ? 9 : 7.2;
    const height = portrait ? 3.8 : 3.0;
    const desired = local.tmp.copy(local.pos).addScaledVector(local.tan, -back).addScaledVector(UP, height);
    if (!local.init) {
      local.camPos.copy(desired);
      local.look.copy(local.pos);
      local.init = true;
    }
    const follow = reduced ? 1 : 1 - Math.exp(-5 * dt);
    local.camPos.lerp(desired, follow);
    const lookAt = desired.copy(local.pos).addScaledVector(local.tan, 6).addScaledVector(UP, 1.1);
    local.look.lerp(lookAt, follow);
    camera.position.copy(local.camPos);
    camera.lookAt(local.look);
    const baseFov = portrait ? 70 : 55;
    const fov = baseFov + (reduced ? 0 : anim.speed * 9);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = damp(camera.fov, fov, 3, dt);
      camera.updateProjectionMatrix();
    }

    updateEngine(anim.speed);

    // ── Which stop's panel is up?
    const near = nearestStop(p);
    const active = Math.abs(stops[near].t - p) < STOP_WINDOW ? near : -1;
    if (active !== local.active) {
      local.active = active;
      store.set({ activeStop: active });
    }
  });

  return (
    <group ref={rig}>
      <group ref={leanGroup}>
        <Bike anim={anim} />
        <spotLight
          ref={spot}
          position={bikeConfig.headlight}
          target={spotTarget}
          angle={0.42}
          penumbra={0.6}
          distance={45}
          decay={1.2}
          color="#fff1cc"
        />
        <primitive object={spotTarget} position={[0, 0, 14]} />
        {/* headlight pool on the road (cheap fake glow) */}
        <mesh ref={beam} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 7]} scale={[5, 11, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={glowTex} color="#fff1cc" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>
      {/* blob shadow (cheaper than real shadows) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.9, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
