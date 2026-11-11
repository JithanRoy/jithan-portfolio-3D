/**
 * Simple motorbike longitudinal model.
 * Scrolling sets WHERE the rider wants to be; the bike gets there with
 * inertia: it accelerates (throttle), coasts, and brakes smoothly to a stop.
 * Units are scene units ≈ meters, seconds.
 */
export const RIDE = {
  cruise: 38, // top speed for normal scrolling (m/s ≈ 137 km/h)
  warp: 260, // top speed when jumping across the map
  throttle: 9, // m/s² base acceleration
  brake: 13, // m/s² base braking
  drag: 0.6, // m/s² rolling/air drag when coasting
};

// Gear top speeds (m/s). RPM sweeps within each band → audible shifts.
const GEARS = [0, 7, 14, 22, 31, 42];

/**
 * Advance the bike one step toward `target` (meters along the road).
 * Mutates and returns `s` = { pos, vel, gear, rpm }.
 */
export function stepBike(s, target, dt) {
  const d = target - s.pos;
  const dist = Math.abs(d);
  const dir = Math.sign(d);

  // Far jumps (menu / map clicks) unlock a "warp" top speed so they don't take forever.
  const cap = Math.min(RIDE.cruise + Math.max(0, dist - 60) * 0.9, RIDE.warp);
  const accel = RIDE.throttle + cap * 0.25;
  const brake = RIDE.brake + cap * 0.3;

  // Fastest speed from which we can still stop exactly at the target.
  const desired = dist < 0.02 ? 0 : dir * Math.min(cap, Math.sqrt(2 * brake * dist));
  const dv = desired - s.vel;
  // Speeding up in the travel direction uses throttle; everything else is braking.
  const speedingUp = Math.sign(dv) === Math.sign(s.vel || dv) && Math.abs(desired) > Math.abs(s.vel);
  const limit = (speedingUp ? accel : brake) * dt;
  s.vel += Math.max(-limit, Math.min(limit, dv));
  if (desired === 0) s.vel -= Math.sign(s.vel) * Math.min(Math.abs(s.vel), RIDE.drag * dt);

  let next = s.pos + s.vel * dt;
  // Never overshoot the target.
  if ((target - next) * dir < 0) {
    next = target;
    s.vel = 0;
  }
  s.pos = next;

  // Gearbox → RPM 0..1 (used by the engine sound and rider tuck).
  const v = Math.abs(s.vel);
  let g = 1;
  while (g < GEARS.length - 1 && v > GEARS[g]) g++;
  const lo = GEARS[g - 1];
  const hi = GEARS[g];
  s.gear = g;
  s.rpm = Math.min(1, 0.25 + (0.75 * (v - lo)) / (hi - lo));
  if (v < 0.3) s.rpm = 0.12; // idle
  return s;
}

/** Physically-based lean: tan(θ) = v²·κ / g, softened for looks. */
export function leanAngle(vel, curvature) {
  return Math.atan((vel * vel * curvature) / 9.81) * 0.55;
}
