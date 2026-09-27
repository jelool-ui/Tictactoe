/**
 * Audio engine — all sounds are synthesized with the Web Audio API:
 * zero audio files to load, instant start, tiny footprint, works offline.
 */

let ctx = null;
let sfxGain = null;
let musicGain = null;

const state = { sound: true, music: true, volume: 0.8, visible: true };

const MUSIC_LEVEL = 0.22; // music stays far below effects

function ensureContext() {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  sfxGain = ctx.createGain();
  sfxGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(ctx.destination);
  applyVolumes();
  return ctx;
}

function applyVolumes() {
  if (!ctx) return;
  const now = ctx.currentTime;
  sfxGain.gain.setTargetAtTime(state.sound ? state.volume : 0, now, 0.02);
  const musicOn = state.music && state.visible;
  musicGain.gain.setTargetAtTime(musicOn ? MUSIC_LEVEL * Math.max(0.25, state.volume) : 0, now, 0.4);
}

/** Must be called from a user gesture at least once (autoplay policies). */
export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  if (state.music) startMusic();
}

export function configureAudio({ sound, music, volume }) {
  state.sound = !!sound;
  state.music = !!music;
  state.volume = Math.min(1, Math.max(0, Number(volume) || 0));
  applyVolumes();
  if (state.music && ctx) startMusic();
  if (!state.music) stopMusic();
}

export function setAppVisible(visible) {
  state.visible = visible;
  if (!ctx) return;
  if (visible) {
    ctx.resume().catch(() => {});
    applyVolumes();
  } else {
    applyVolumes();
    // Suspend shortly after fading out to save battery.
    setTimeout(() => !state.visible && ctx.suspend().catch(() => {}), 600);
  }
}

// ---------------------------------------------------------------- effects

function tone({ freq, to, type = 'sine', start = 0, dur = 0.15, gain = 0.3, attack = 0.005 }) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  x: () => {
    tone({ freq: 620, to: 920, type: 'triangle', dur: 0.09, gain: 0.35 });
    tone({ freq: 1240, type: 'sine', start: 0.01, dur: 0.06, gain: 0.08 });
  },
  o: () => {
    tone({ freq: 360, to: 520, type: 'sine', dur: 0.16, gain: 0.4 });
    tone({ freq: 720, type: 'sine', start: 0.02, dur: 0.1, gain: 0.07 });
  },
  click: () => tone({ freq: 1100, to: 900, type: 'sine', dur: 0.045, gain: 0.15 }),
  win: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', start: i * 0.1, dur: i === 3 ? 0.5 : 0.16, gain: 0.3 }),
    );
    tone({ freq: 1567.98, type: 'sine', start: 0.32, dur: 0.45, gain: 0.08 });
  },
  loss: () => {
    [392, 311.13, 261.63].forEach((f, i) =>
      tone({ freq: f, to: f * 0.97, type: 'sine', start: i * 0.18, dur: i === 2 ? 0.5 : 0.2, gain: 0.3 }),
    );
  },
  draw: () => {
    tone({ freq: 440, type: 'sine', dur: 0.16, gain: 0.25 });
    tone({ freq: 440, type: 'sine', start: 0.2, dur: 0.16, gain: 0.25 });
    tone({ freq: 554.37, type: 'triangle', start: 0.4, dur: 0.3, gain: 0.18 });
  },
  trophy: () => {
    [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => {
      tone({ freq: f, type: 'sine', start: i * 0.07, dur: 0.35, gain: 0.18 });
      tone({ freq: f * 2, type: 'sine', start: i * 0.07, dur: 0.2, gain: 0.04 });
    });
  },
};

/** Plays a named sound effect: x, o, click, win, loss, draw, trophy. */
export function playSound(name) {
  if (!state.sound || state.volume <= 0) return;
  if (!ensureContext() || ctx.state !== 'running') {
    ctx?.resume().catch(() => {});
    if (!ctx || ctx.state !== 'running') return;
  }
  try {
    SOUNDS[name]?.();
  } catch {
    /* never let audio break the game */
  }
}

// ---------------------------------------------------------------- ambient music

// Gentle Am – F – C – G pad, 4 s per chord, low-passed so it stays in the background.
const CHORDS = [
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 261.63, 329.63],
  [196.0, 246.94, 293.66],
];
const CHORD_SECONDS = 4;
let musicTimer = null;
let nextChordTime = 0;
let chordIndex = 0;
let musicFilter = null;

function scheduleChord(time, notes) {
  for (const f of notes) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.12, time + 1.2);
    g.gain.linearRampToValueAtTime(0.0001, time + CHORD_SECONDS + 0.8);
    osc.connect(g).connect(musicFilter);
    osc.start(time);
    osc.stop(time + CHORD_SECONDS + 1);
  }
  // soft bell on top
  const bell = ctx.createOscillator();
  const bg = ctx.createGain();
  bell.type = 'sine';
  bell.frequency.value = notes[2] * 2;
  bg.gain.setValueAtTime(0.0001, time + 0.5);
  bg.gain.exponentialRampToValueAtTime(0.03, time + 0.55);
  bg.gain.exponentialRampToValueAtTime(0.0001, time + 2.5);
  bell.connect(bg).connect(musicFilter);
  bell.start(time + 0.5);
  bell.stop(time + 2.6);
}

function musicTick() {
  if (!ctx || !state.music || !state.visible || ctx.state !== 'running') return;
  while (nextChordTime < ctx.currentTime + 1.5) {
    scheduleChord(nextChordTime, CHORDS[chordIndex % CHORDS.length]);
    chordIndex += 1;
    nextChordTime += CHORD_SECONDS;
  }
}

export function startMusic() {
  if (!ensureContext() || musicTimer) return;
  if (!musicFilter) {
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 900;
    musicFilter.connect(musicGain);
  }
  nextChordTime = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    if (nextChordTime < ctx.currentTime) nextChordTime = ctx.currentTime + 0.1; // after a pause
    musicTick();
  }, 500);
  musicTick();
  applyVolumes();
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  applyVolumes();
}
