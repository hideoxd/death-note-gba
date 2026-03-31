import { browser } from '$app/environment';
import { get } from 'svelte/store';

import { uiState } from '$lib/stores/uiState';

type PlayToneArgs = {
  frequency: number;
  durationMs: number;
  type: OscillatorType;
  gain: number;
};

let audioContext: AudioContext | null = null;
let listenersAttached = false;
let lastBlipAt = 0;

const ensureContext = (): AudioContext | null => {
  if (!browser) {
    return null;
  }

  if (!audioContext) {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      return null;
    }

    audioContext = new Ctx();
  }

  return audioContext;
};

const unlockContext = (): void => {
  const ctx = ensureContext();
  if (!ctx) {
    return;
  }

  if (ctx.state !== 'running') {
    void ctx.resume();
  }
};

const attachUnlockListeners = (): void => {
  if (!browser || listenersAttached) {
    return;
  }

  listenersAttached = true;
  window.addEventListener('pointerdown', unlockContext, { passive: true, once: true });
  window.addEventListener('keydown', unlockContext, { passive: true, once: true });
};

const getSfxGain = (): number => {
  return Math.max(0, Math.min(1, get(uiState).sfxVolume));
};

const playTone = ({ frequency, durationMs, type, gain }: PlayToneArgs): void => {
  const ctx = ensureContext();
  if (!ctx) {
    return;
  }

  attachUnlockListeners();
  unlockContext();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  amp.gain.setValueAtTime(0, now);
  amp.gain.linearRampToValueAtTime(gain, now + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  osc.connect(amp);
  amp.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.01);
};

export const playTextBlip = (): void => {
  const now = Date.now();
  if (now - lastBlipAt < 22) {
    return;
  }

  lastBlipAt = now;
  const level = getSfxGain();
  if (level <= 0) {
    return;
  }

  const pitch = 680 + Math.random() * 180;
  playTone({
    frequency: pitch,
    durationMs: 36,
    type: 'square',
    gain: 0.03 * level
  });
};

export const playNotebookScribble = (): void => {
  const level = getSfxGain();
  if (level <= 0) {
    return;
  }

  const burstCount = 4;

  for (let i = 0; i < burstCount; i += 1) {
    window.setTimeout(() => {
      const pitch = 300 + Math.random() * 260;
      playTone({
        frequency: pitch,
        durationMs: 50,
        type: 'sawtooth',
        gain: (0.022 - i * 0.003) * level
      });
    }, i * 24);
  }
};
