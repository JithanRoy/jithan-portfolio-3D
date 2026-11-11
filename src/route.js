/**
 * Builds the list of stops along the ride from content.js and the
 * scroll ↔ progress mapping that makes the bike ease near each stop.
 * (No three.js in here, so the 2D UI can import it cheaply.)
 */
import { projects, experience, skills, sectionLabels } from './content.js';

const START = 0.025;
const END = 0.9; // leave road beyond the last stop for the finish line & rest stop

const raw = [
  { section: 'start', key: 'start', title: sectionLabels.start },
  { section: 'about', key: 'about', title: sectionLabels.about },
  { section: 'skills', key: 'skills', title: sectionLabels.skills, weight: Math.max(1, skills.length / 3) },
  ...projects.map((p, i) => ({ section: 'projects', key: `project-${i}`, title: p.name, index: i })),
  ...experience.map((e, i) => ({ section: 'experience', key: `exp-${i}`, title: `${e.role} · ${e.year}`, index: i })),
  { section: 'contact', key: 'contact', title: sectionLabels.contact },
];

// Distribute stops along the route; section changes get a bit more road than sub-stops.
const gaps = raw.map((s, i) => (i === 0 ? 0 : s.section !== raw[i - 1].section ? 1.25 : 1) * (s.weight || 1));
const totalGap = gaps.reduce((a, b) => a + b, 0);
let acc = 0;
export const stops = raw.map((s, i) => {
  acc += gaps[i];
  return { ...s, i, t: START + (END - START) * (acc / totalGap) };
});

/** First stop of each top-level section — used by the menu and progress bar. */
export const sections = Object.keys(sectionLabels).map((id) => {
  const first = stops.find((s) => s.section === id);
  return { id, label: sectionLabels[id], t: first.t, stop: first.i };
});

/** How close (in progress units) the bike must be for a stop's panel to show. */
export const STOP_WINDOW = Math.min(0.028, ((END - START) / stops.length) * 0.4);

export function nearestStop(p) {
  let best = 0;
  for (const s of stops) if (Math.abs(s.t - p) < Math.abs(stops[best].t - p)) best = s.i;
  return best;
}

/* ── Scroll offset (0..1) ↔ ride progress (0..1) ───────────────────────────
 * Near stops, one unit of scroll moves the bike less, so it "eases in"
 * and the panel stays up for a while before the ride continues. */
const N = 2000;
// The ride ends just past the last stop (the finish line sits ahead, in view).
export const MAX_PROGRESS = Math.min(stops[stops.length - 1].t + 0.006, 1);
const SLOW = 0.78; // 0 = no easing, 0.9 = almost a full stop
const SIGMA = STOP_WINDOW * 0.75;
const offsetAt = new Float32Array(N + 1); // offsetAt[i] = scroll offset where progress = i/N
{
  let sum = 0;
  offsetAt[0] = 0;
  for (let i = 1; i <= N; i++) {
    const p = (i / N) * MAX_PROGRESS;
    let slow = 0;
    for (const s of stops) slow = Math.max(slow, Math.exp(-(((p - s.t) / SIGMA) ** 2)));
    const speed = 1 - SLOW * slow; // progress per scroll
    sum += 1 / speed / N;
    offsetAt[i] = sum;
  }
  for (let i = 1; i <= N; i++) offsetAt[i] /= sum;
}

export function progressToOffset(p) {
  const x = (Math.min(Math.max(p, 0), MAX_PROGRESS) / MAX_PROGRESS) * N;
  const i = Math.floor(x);
  if (i >= N) return 1;
  return offsetAt[i] + (offsetAt[i + 1] - offsetAt[i]) * (x - i);
}

export function offsetToProgress(o) {
  o = Math.min(Math.max(o, 0), 1);
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (offsetAt[mid] < o) lo = mid;
    else hi = mid;
  }
  const span = offsetAt[hi] - offsetAt[lo] || 1;
  return ((lo + (o - offsetAt[lo]) / span) / N) * MAX_PROGRESS;
}

/** Scroll length in screen heights. More stops → longer ride. */
export const SCROLL_PAGES = Math.round(stops.length * 1.5);
