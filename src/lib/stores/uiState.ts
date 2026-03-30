import { writable } from 'svelte/store';

export interface UiState {
  showPauseMenu: boolean;
  showLogPanel: boolean;
  textSpeed: 'slow' | 'normal' | 'fast';
  sfxVolume: number;
  musicVolume: number;
}

const initialUiState: UiState = {
  showPauseMenu: false,
  showLogPanel: true,
  textSpeed: 'normal',
  sfxVolume: 0.75,
  musicVolume: 0.6
};

const createUiStore = () => {
  const { subscribe, set, update } = writable<UiState>(initialUiState);

  return {
    subscribe,
    togglePauseMenu: () =>
      update((state) => ({
        ...state,
        showPauseMenu: !state.showPauseMenu
      })),
    toggleLogPanel: () =>
      update((state) => ({
        ...state,
        showLogPanel: !state.showLogPanel
      })),
    setTextSpeed: (textSpeed: UiState['textSpeed']) => update((state) => ({ ...state, textSpeed })),
    setSfxVolume: (sfxVolume: number) =>
      update((state) => ({ ...state, sfxVolume: Math.max(0, Math.min(1, sfxVolume)) })),
    setMusicVolume: (musicVolume: number) =>
      update((state) => ({ ...state, musicVolume: Math.max(0, Math.min(1, musicVolume)) })),
    reset: () => set(initialUiState)
  };
};

export const uiState = createUiStore();
