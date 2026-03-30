import { browser } from '$app/environment';

import type { GameState } from '$lib/types/game';

const SAVE_KEY = 'death-note-gba-save-v1';
const SAVE_DEBOUNCE_MS = 120;

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSnapshot: string | null = null;
let lastSavedSnapshot: string | null = null;

const flushSnapshot = (): void => {
  if (!browser || !pendingSnapshot) {
    saveTimeout = null;
    return;
  }

  try {
    localStorage.setItem(SAVE_KEY, pendingSnapshot);
    lastSavedSnapshot = pendingSnapshot;
  } catch {
    // Ignore storage write failures (private mode/quota).
  } finally {
    pendingSnapshot = null;
    saveTimeout = null;
  }
};

const globalScope = globalThis as typeof globalThis & {
  __deathNoteSaveListenersAttached?: boolean;
};

if (browser && !globalScope.__deathNoteSaveListenersAttached) {
  globalScope.__deathNoteSaveListenersAttached = true;
  window.addEventListener('beforeunload', flushSnapshot);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSnapshot();
    }
  });
}

export const hasSnapshot = (): boolean => {
  if (!browser) return false;
  return Boolean(localStorage.getItem(SAVE_KEY));
};

export const saveSnapshot = (state: GameState): void => {
  if (!browser) return;

  const serialized = JSON.stringify(state);
  if (serialized === lastSavedSnapshot || serialized === pendingSnapshot) {
    return;
  }

  pendingSnapshot = serialized;

  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(flushSnapshot, SAVE_DEBOUNCE_MS);
};

export const loadSnapshot = (): GameState | null => {
  if (!browser) return null;

  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    lastSavedSnapshot = raw;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
};

export const clearSnapshot = (): void => {
  if (!browser) return;

  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  pendingSnapshot = null;
  lastSavedSnapshot = null;
  localStorage.removeItem(SAVE_KEY);
};
