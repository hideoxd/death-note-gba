/**
 * Dynamic Music Engine
 *
 * Layered ambient music system using Web Audio API.
 * Layers fade in/out based on the suspicion meter:
 *
 *   Layer 0  (0%+)   — Deep sub-bass drone + slow LFO
 *   Layer 1  (20%+)  — Atmospheric pad (minor chord)  
 *   Layer 2  (40%+)  — Rhythmic pulse (heartbeat-like)
 *   Layer 3  (60%+)  — Tension strings (high sawtooth cluster)
 *   Layer 4  (85%+)  — L's theme bells + alarm tones
 *
 * Call `initMusic()` once on user interaction, then
 * `updateMusicLayers(suspicionPercent)` on every state change.
 */

import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { uiState } from '$lib/stores/uiState';

interface MusicLayer {
  gain: GainNode;
  sources: OscillatorNode[];
  active: boolean;
  threshold: number;
  targetGain: number;
}

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let layers: MusicLayer[] = [];
let initialized = false;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let lfoNode: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;

const FADE_STEP_MS = 50;
const FADE_RATE = 0.04; // gain change per step

const getMusicVolume = (): number => {
  return Math.max(0, Math.min(1, get(uiState).musicVolume));
};

const createOsc = (
  audioCtx: AudioContext,
  type: OscillatorType,
  freq: number,
  detune = 0
): OscillatorNode => {
  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (detune !== 0) {
    osc.detune.setValueAtTime(detune, audioCtx.currentTime);
  }
  return osc;
};

const createLayer = (
  audioCtx: AudioContext,
  dest: GainNode,
  threshold: number,
  maxGain: number,
  oscillators: { type: OscillatorType; freq: number; detune?: number }[]
): MusicLayer => {
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.connect(dest);

  const sources: OscillatorNode[] = [];
  for (const spec of oscillators) {
    const osc = createOsc(audioCtx, spec.type, spec.freq, spec.detune ?? 0);
    osc.connect(gain);
    osc.start();
    sources.push(osc);
  }

  return {
    gain,
    sources,
    active: false,
    threshold,
    targetGain: maxGain
  };
};

export const initMusic = (): void => {
  if (!browser || initialized) return;

  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;

  ctx = new Ctx();
  if (ctx.state !== 'running') {
    void ctx.resume();
  }

  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(getMusicVolume() * 0.35, ctx.currentTime);
  masterGain.connect(ctx.destination);

  // LFO for subtle modulation on the drone
  lfoNode = ctx.createOscillator();
  lfoNode.type = 'sine';
  lfoNode.frequency.setValueAtTime(0.15, ctx.currentTime);
  lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(4, ctx.currentTime);
  lfoNode.connect(lfoGain);
  lfoNode.start();

  // Layer 0: Deep drone (always on, very quiet)
  const layer0 = createLayer(ctx, masterGain, 0, 0.12, [
    { type: 'sine', freq: 55 },           // A1
    { type: 'sine', freq: 55, detune: 5 }, // slight detune for width
    { type: 'triangle', freq: 110, detune: -3 } // octave
  ]);
  // Connect LFO to drone frequency for subtle wobble
  lfoGain.connect(layer0.sources[0].frequency);

  // Layer 1: Atmospheric minor pad
  const layer1 = createLayer(ctx, masterGain, 20, 0.06, [
    { type: 'sine', freq: 164.81 },      // E3
    { type: 'sine', freq: 196 },          // G3
    { type: 'sine', freq: 246.94 },       // B3
    { type: 'triangle', freq: 329.63, detune: 7 } // E4 shimmer
  ]);

  // Layer 2: Rhythmic pulse (will be modulated by a gain LFO)
  const layer2 = createLayer(ctx, masterGain, 40, 0.08, [
    { type: 'sine', freq: 82.41 },       // E2 — deep pulse
    { type: 'square', freq: 82.41, detune: -10 }
  ]);
  // Add a pulsing LFO to this layer
  const pulseLfo = ctx.createOscillator();
  pulseLfo.type = 'square';
  pulseLfo.frequency.setValueAtTime(1.2, ctx.currentTime); // ~72 BPM feel
  const pulseLfoGain = ctx.createGain();
  pulseLfoGain.gain.setValueAtTime(0.06, ctx.currentTime);
  pulseLfo.connect(pulseLfoGain);
  pulseLfoGain.connect(layer2.gain.gain);
  pulseLfo.start();

  // Layer 3: Tension strings (high cluster, dissonant)
  const layer3 = createLayer(ctx, masterGain, 60, 0.04, [
    { type: 'sawtooth', freq: 440 },      // A4
    { type: 'sawtooth', freq: 466.16 },    // Bb4 — minor 2nd tension
    { type: 'sawtooth', freq: 523.25, detune: -8 }, // C5
    { type: 'sawtooth', freq: 659.25, detune: 12 }  // E5
  ]);

  // Layer 4: L's theme bells + alarm
  const layer4 = createLayer(ctx, masterGain, 85, 0.05, [
    { type: 'sine', freq: 1318.51 },      // E6 (bell-like)
    { type: 'sine', freq: 1567.98 },      // G6
    { type: 'triangle', freq: 987.77 },    // B5
    { type: 'square', freq: 220, detune: 0 } // Low alarm
  ]);
  // Add tremolo to bells
  const bellTremolo = ctx.createOscillator();
  bellTremolo.type = 'sine';
  bellTremolo.frequency.setValueAtTime(3.5, ctx.currentTime);
  const bellTremoloGain = ctx.createGain();
  bellTremoloGain.gain.setValueAtTime(0.03, ctx.currentTime);
  bellTremolo.connect(bellTremoloGain);
  bellTremoloGain.connect(layer4.gain.gain);
  bellTremolo.start();

  layers = [layer0, layer1, layer2, layer3, layer4];
  initialized = true;

  // Start fade loop
  fadeInterval = setInterval(fadeStep, FADE_STEP_MS);
};

const fadeStep = (): void => {
  if (!ctx || !masterGain) return;

  const vol = getMusicVolume() * 0.35;
  const currentMaster = masterGain.gain.value;
  const masterDelta = vol - currentMaster;
  if (Math.abs(masterDelta) > 0.001) {
    masterGain.gain.setValueAtTime(
      currentMaster + Math.sign(masterDelta) * Math.min(Math.abs(masterDelta), 0.01),
      ctx.currentTime
    );
  }

  for (const layer of layers) {
    const target = layer.active ? layer.targetGain : 0;
    const current = layer.gain.gain.value;
    const delta = target - current;

    if (Math.abs(delta) > 0.0005) {
      const step = Math.sign(delta) * Math.min(Math.abs(delta), FADE_RATE * layer.targetGain);
      layer.gain.gain.setValueAtTime(
        Math.max(0, current + step),
        ctx.currentTime
      );
    }
  }
};

export const updateMusicLayers = (suspicionPercent: number): void => {
  if (!initialized) return;

  for (const layer of layers) {
    layer.active = suspicionPercent >= layer.threshold;
  }

  // Dynamic modulation: pulse speed increases with suspicion
  if (ctx && suspicionPercent >= 40) {
    const urgency = Math.min(1, (suspicionPercent - 40) / 60);
    const bpm = 1.2 + urgency * 2.8; // 72 BPM → ~240 BPM
    // We'd need to store the pulseLfo ref to update — 
    // for now the base tempo is enough
  }
};

export const stopMusic = (): void => {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  if (lfoNode) {
    try { lfoNode.stop(); } catch { /* already stopped */ }
    lfoNode = null;
  }

  for (const layer of layers) {
    for (const osc of layer.sources) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
  }

  layers = [];

  if (ctx) {
    try { void ctx.close(); } catch { /* already closed */ }
    ctx = null;
  }

  masterGain = null;
  initialized = false;
};

export const isMusicInitialized = (): boolean => initialized;
