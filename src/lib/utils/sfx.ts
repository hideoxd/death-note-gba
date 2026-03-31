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
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatStep = 0;
let heartbeatDeadlineMs = 0;
let lVoiceLastAt = 0;

const vibrate = (durationMs = 14): void => {
  if (!browser || typeof navigator === 'undefined') {
    return;
  }

  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(durationMs);
  }
};

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

export const vibrateTap = (durationMs = 14): void => {
  vibrate(durationMs);
};

export const playPlasticClick = (): void => {
  const level = getSfxGain();
  if (level <= 0) {
    return;
  }

  vibrate(12);
  playTone({
    frequency: 180 + Math.random() * 40,
    durationMs: 42,
    type: 'triangle',
    gain: 0.02 * level
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

export const playInkScratch = (): void => {
  const now = Date.now();
  if (now - lastBlipAt < 16) {
    return;
  }

  lastBlipAt = now;
  const level = getSfxGain();
  if (level <= 0) {
    return;
  }

  const base = 920 + Math.random() * 220;
  playTone({
    frequency: base,
    durationMs: 14,
    type: 'sawtooth',
    gain: 0.008 * level
  });
  playTone({
    frequency: base * 0.45,
    durationMs: 18,
    type: 'square',
    gain: 0.004 * level
  });
};

export const playGlitchBoot = (): void => {
  const level = getSfxGain();
  if (level <= 0) {
    return;
  }

  const sequence = [220, 310, 440, 370, 520];
  for (let i = 0; i < sequence.length; i += 1) {
    window.setTimeout(() => {
      playTone({
        frequency: sequence[i],
        durationMs: 45,
        type: i % 2 === 0 ? 'square' : 'triangle',
        gain: 0.028 * level
      });
    }, i * 52);
  }
};

export const playHeartbeatLoop = (deadlineMs?: number): void => {
  const level = getSfxGain();
  if (level <= 0) {
    return;
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  heartbeatDeadlineMs = typeof deadlineMs === 'number' ? deadlineMs : 0;

  heartbeatStep = 0;

  const tick = () => {
    const runtimeGain = getSfxGain();
    if (runtimeGain <= 0 || !heartbeatInterval) {
      return;
    }

    const now = Date.now();
    const remainingRatio =
      heartbeatDeadlineMs > 0
        ? Math.max(0, Math.min(1, (heartbeatDeadlineMs - now) / 40_000))
        : 1;
    const urgency = 1 - remainingRatio;
    const bpm = 72 + urgency * 88;
    const intervalMs = Math.max(280, Math.round(60_000 / bpm));
    const gain = (0.015 + urgency * 0.022) * runtimeGain;
    const accent = heartbeatStep % 2 === 0 ? 1.08 : 0.82;

    playTone({
      frequency: 86 + urgency * 24 + (heartbeatStep % 2) * 3,
      durationMs: Math.max(54, Math.round(84 - urgency * 18)),
      type: 'sine',
      gain: gain * accent
    });

    if (heartbeatStep % 2 === 0) {
      playTone({
        frequency: 58 + urgency * 12,
        durationMs: 110,
        type: 'triangle',
        gain: gain * 0.36
      });
    }

    heartbeatStep += 1;
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(tick, intervalMs);
  };

  heartbeatInterval = setInterval(tick, 620);
  tick();
};

export const stopHeartbeatLoop = (): void => {
  if (!heartbeatInterval) {
    return;
  }

  clearInterval(heartbeatInterval);
  heartbeatInterval = null;
  heartbeatStep = 0;
  heartbeatDeadlineMs = 0;
};

export const playHeartbeatThud = (): void => {
  const level = getSfxGain();
  if (level <= 0) {
    return;
  }

  playTone({
    frequency: 58,
    durationMs: 180,
    type: 'triangle',
    gain: 0.045 * level
  });
  vibrate(24);
};

export const playLInterventionVoice = (): void => {
  const now = Date.now();
  if (now - lVoiceLastAt < 1600) {
    return;
  }

  lVoiceLastAt = now;
  const level = getSfxGain();
  if (level <= 0) {
    return;
  }

  const steps = [130, 120, 112, 106];
  for (let i = 0; i < steps.length; i += 1) {
    window.setTimeout(() => {
      playTone({
        frequency: steps[i],
        durationMs: 170,
        type: 'sawtooth',
        gain: 0.016 * level
      });
      playTone({
        frequency: steps[i] * 1.5,
        durationMs: 120,
        type: 'square',
        gain: 0.008 * level
      });
    }, i * 130);
  }
};
