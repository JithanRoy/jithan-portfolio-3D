/**
 * THE ROAD.
 * Edit CONTROL_POINTS to reshape the route ([x, z] pairs, y is always 0).
 * The ride goes from the first point to the last. Keep consecutive points
 * ~60–110 units apart and avoid folding the road back over itself, otherwise
 * scenery may spawn on top of another stretch of road.
 */
import * as THREE from 'three';

export const ROAD_WIDTH = 8; // asphalt width in world units
export const LANE_CENTER = 1.9; // rider's lane, left of the center line (drive on the left, like Dhaka)
export const LANE_LIMIT = 1.1; // how far the rider may steer either side of the lane center

const CONTROL_POINTS = [
  [0, 40],
  [0, 0],
  [6, -80],
  [36, -160],
  [10, -250],
  [-46, -320],
  [-40, -410],
  [8, -480],
  [64, -540],
  [70, -630],
  [24, -700],
  [-36, -760],
  [-44, -850],
  [-6, -930],
  [30, -1010],
  [30, -1080],
  [6, -1160],
  [-20, -1240],
  [-20, -1330],
];

export const curve = new THREE.CatmullRomCurve3(
  CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'centripetal'
);
export const ROAD_LENGTH = curve.getLength();

/** Evenly spaced samples along the road, shared by road mesh, scenery & minimap. */
const SAMPLE_COUNT = 900;
export const samples = (() => {
  const out = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const t = i / SAMPLE_COUNT;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const left = new THREE.Vector3().crossVectors(up, tangent).normalize();
    out.push({ t, point, tangent, left, dist: t * ROAD_LENGTH });
  }
  return out;
})();

/** Position `side` units to the left (+) / right (−) of the center line at progress t. */
export function pointBeside(t, side, y = 0) {
  const tc = THREE.MathUtils.clamp(t, 0, 1);
  const p = curve.getPointAt(tc);
  const tan = curve.getTangentAt(tc);
  const left = new THREE.Vector3(tan.z, 0, -tan.x).normalize(); // up × tangent
  return p.addScaledVector(left, side).setY(y);
}

/** Progress value `meters` further along the road from t. */
export const ahead = (t, meters) => THREE.MathUtils.clamp(t + meters / ROAD_LENGTH, 0, 1);

/** Squared distance from (x, z) to the nearest road sample. */
export function distToRoadSq(x, z) {
  let best = Infinity;
  for (let i = 0; i < samples.length; i += 3) {
    const p = samples[i].point;
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < best) best = d;
  }
  return best;
}
