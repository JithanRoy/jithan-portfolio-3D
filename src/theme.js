/**
 * Colors & look. Change the palette here — the scene, sky and UI all read from it.
 * UI colors are also exposed as CSS variables (see applyCssVars) so styles.css stays in sync.
 */
export const palette = {
  navy: '#0b1020',
  cyan: '#22d3ee',
  pink: '#ff3d81',
  orange: '#ff9f43',
  ink: '#e8ecff',
  muted: '#9aa3c7',

  road: '#1c2133',
  roadEdge: '#e8ecff',
  roadDash: '#ffd27a',
  shoulder: '#3a3346',
  ground: '#2a2f4a',
  trunk: '#5a3b2e',
  foliage: '#2f6b5a',
  hill: '#3b3f66',
  bike: '#ff3d81',
  bikeDark: '#1a1d2b',
  chrome: '#c9d1e6',
  rider: '#22d3ee',
  helmet: '#f5f7ff',
};

/**
 * Sky over the ride: progress 0 = golden sunset, 1 = deep neon night.
 * Each key: { at, top, horizon, ground, sun, sunIntensity, ambient }
 */
export const skyKeys = [
  { at: 0.0, top: '#3d2a6b', horizon: '#ff9f43', ground: '#4a3a52', sun: '#ffb86b', sunIntensity: 2.2, ambient: 0.9 },
  { at: 0.35, top: '#2a1f5c', horizon: '#ff5e7a', ground: '#3a3150', sun: '#ff7a6b', sunIntensity: 1.5, ambient: 0.7 },
  { at: 0.65, top: '#141a42', horizon: '#7a3f9c', ground: '#272a48', sun: '#b06bff', sunIntensity: 0.7, ambient: 0.5 },
  { at: 1.0, top: '#05081a', horizon: '#1d2a5e', ground: '#1c2244', sun: '#6b8bff', sunIntensity: 0.3, ambient: 0.55 },
];

export function applyCssVars() {
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(palette)) root.setProperty(`--c-${k}`, v);
}
