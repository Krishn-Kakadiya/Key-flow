/**
 * Synthesised sound (Web Audio) — no audio files to ship. Everything is
 * gated behind the user's sound setting and only created after a user gesture.
 */
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let enabled = false;
let volume = 0.6;

export function configureAudio(opts: { enabled: boolean; volume: number }) {
  enabled = opts.enabled;
  volume = Math.max(0, Math.min(1, opts.volume));
}

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    if (!noise) {
      const len = Math.floor(ctx.sampleRate * 0.06);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Mechanical key click with a little random pitch so it never sounds robotic. */
export function playKey() {
  const c = getCtx();
  if (!c || !noise) return;
  const t = c.currentTime;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.28 * volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

  const src = c.createBufferSource();
  src.buffer = noise;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800 + Math.random() * 1600;
  filter.Q.value = 0.9;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
  src.stop(t + 0.05);

  // low "thock" body
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150 + Math.random() * 50, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.05);
  og.gain.setValueAtTime(0.16 * volume, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.connect(og).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.07);
}

export function playError() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(58, t + 0.12);
  g.gain.setValueAtTime(0.3 * volume, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.15);
}

function tone(freq: number, start: number, dur: number, peak: number, type: OscillatorType = 'sine') {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak * volume, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Small milestone chime (combo milestones, badges). */
export function playChime() {
  tone(880, 0, 0.35, 0.18);
  tone(1318.5, 0.09, 0.45, 0.14);
}

/** Personal-best sting. */
export function playPB() {
  tone(523.25, 0, 0.3, 0.2);
  tone(659.25, 0.1, 0.3, 0.2);
  tone(783.99, 0.2, 0.3, 0.2);
  tone(1046.5, 0.32, 0.7, 0.22);
}

export function playLevelUp() {
  [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.5, 0.18, 'triangle'));
  tone(1318.5, 0.5, 0.9, 0.16);
}

export function playCountdown(final = false) {
  tone(final ? 880 : 520, 0, final ? 0.3 : 0.14, 0.15);
}
