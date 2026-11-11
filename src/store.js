import { useSyncExternalStore } from 'react';
import { progressToOffset } from './route.js';

/**
 * `ride` is a mutable per-frame object (no React re-renders) written by the 3D
 * rider and read by rAF-driven UI (progress bar, minimap, speed lines).
 */
export const ride = {
  progress: 0, // 0..1 along the road (smoothed)
  speed: 0, // 0..1 normalized
  scrollEl: null, // ScrollControls' scroll container
  reducedMotion: false,
  keys: { up: false, down: false, left: false, right: false },
};

/** Small React store for UI-level state that changes rarely. */
let state = {
  activeStop: 0, // index into stops, or -1 when between stops
  soundOn: false,
  ready: false,
  simple: false,
};
const listeners = new Set();
export const store = {
  get: () => state,
  set(patch) {
    const next = { ...state, ...patch };
    if (Object.keys(patch).every((k) => Object.is(state[k], next[k]))) return;
    state = next;
    listeners.forEach((l) => l());
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
export const useStore = (selector) => useSyncExternalStore(store.subscribe, () => selector(state));

/** Smoothly ride (scroll) to a given progress value. */
export function rideTo(t) {
  const el = ride.scrollEl;
  if (!el) return;
  const max = el.scrollHeight - el.clientHeight;
  el.scrollTo({ top: progressToOffset(t) * max, behavior: ride.reducedMotion ? 'auto' : 'smooth' });
}
