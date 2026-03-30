import { writable } from 'svelte/store';
import { browser } from '$app/environment';

import { gameReducer } from '$lib/engine/reducer';
import { createInitialGameState } from '$lib/engine/stateFactory';
import { clearSnapshot, loadSnapshot, saveSnapshot } from '$lib/stores/persistence';

import type { GameAction } from '$lib/types/engine';
import type { GameMode, GameState, Phase } from '$lib/types/game';

const createGameStateStore = () => {
  const { subscribe, set, update } = writable<GameState>(createInitialGameState());

  if (browser) {
    subscribe((state) => {
      if (state.phase !== 'title') {
        saveSnapshot(state);
      }
    });
  }

  return {
    subscribe,

    dispatch: (action: GameAction) => update((state) => gameReducer(state, action)),

    startNewGame: (mode: GameMode) => {
      clearSnapshot();
      update((state) => gameReducer(state, { type: 'START_NEW_GAME', mode }));
    },

    setPhase: (phase: Phase) => update((state) => gameReducer(state, { type: 'SET_PHASE', phase })),

    selectModeAtTitle: (mode: GameMode) =>
      update((state) => {
        if (state.phase !== 'title') {
          return state;
        }

        return createInitialGameState(mode, 'title');
      }),

    performActivity: (activityId: string) =>
      update((state) => gameReducer(state, { type: 'PERFORM_ACTIVITY', activityId })),

    selectChoice: (choiceId: string) =>
      update((state) => gameReducer(state, { type: 'SELECT_CHOICE', choiceId })),

    advanceTime: (blocks = 1) => update((state) => gameReducer(state, { type: 'ADVANCE_TIME', blocks })),

    continueNode: () => update((state) => gameReducer(state, { type: 'CONTINUE_NODE' })),

    setNode: (nodeId: string, treeId?: string) =>
      update((state) =>
        gameReducer(state, {
          type: 'SET_NODE',
          treeId,
          nodeId,
          addSeen: true
        })
      ),

    hydrate: (snapshot: GameState) => set(snapshot),

    continueFromSave: (): boolean => {
      const snapshot = loadSnapshot();
      if (!snapshot) {
        return false;
      }

      set(snapshot);
      return true;
    },

    clearSave: () => clearSnapshot(),

    reset: () => {
      clearSnapshot();
      set(createInitialGameState());
    }
  };
};

export const gameState = createGameStateStore();
