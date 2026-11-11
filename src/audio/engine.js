/**
 * Synthesized engine + horn (Web Audio, no audio files needed).
 * The AudioContext is created lazily on the first user gesture.
 */
let ctx = null;
let engineGain = null;
let oscA = null;
let oscB = null;
let filter = null;
let enabled = false;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function startEngine() {
  if (!ensureCtx() || oscA) return;
  engineGain = ctx.createGain();
  engineGain.gain.value = 0;
  filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  oscA = ctx.createOscillator();
  oscA.type = 'sawtooth';
  oscA.frequency.value = 42;
  oscB = ctx.createOscillator();
  oscB.type = 'square';
  oscB.frequency.value = 21;
  const bGain = ctx.createGain();
  bGain.gain.value = 0.5;
  oscA.connect(filter);
  oscB.connect(bGain).connect(filter);
  filter.connect(engineGain).connect(ctx.destination);
  oscA.start();
  oscB.start();
}

export function setSound(on) {
  enabled = on;
  if (on) {
    startEngine();
    ctx?.resume();
  } else if (engineGain && ctx) {
    engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }
}

/** Called every frame with speed 0..1 and engine rpm 0..1 (rpm drops on each gear shift). */
export function updateEngine(speed, rpm = speed) {
  if (!enabled || !oscA || !ctx) return;
  const t = ctx.currentTime;
  oscA.frequency.setTargetAtTime(38 + rpm * 150, t, 0.05);
  oscB.frequency.setTargetAtTime(19 + rpm * 75, t, 0.05);
  filter.frequency.setTargetAtTime(350 + rpm * 1100 + speed * 300, t, 0.08);
  engineGain.gain.setTargetAtTime(0.03 + rpm * 0.05 + speed * 0.02, t, 0.1);
}

export function honk() {
  if (!ensureCtx()) return;
  ctx.resume();
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.02);
  g.gain.setValueAtTime(0.12, t + 0.32);
  g.gain.linearRampToValueAtTime(0, t + 0.4);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  lp.connect(g).connect(ctx.destination);
  for (const f of [392, 494]) {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    o.connect(lp);
    o.start(t);
    o.stop(t + 0.42);
  }
}
