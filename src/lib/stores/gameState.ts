import { writable } from 'svelte/store';
import { browser } from '$app/environment';

import { gameReducer } from '$lib/engine/reducer';
import { createInitialGameState } from '$lib/engine/stateFactory';
import { clearSnapshot, loadSnapshot, saveSnapshot } from '$lib/stores/persistence';

import type { GameAction } from '$lib/types/engine';
import type { DeathCause, GameMode, GameState, Phase } from '$lib/types/game';

const isDeathCause = (value: unknown): value is DeathCause => {
  return value === 'heart-attack' || value === 'accident' || value === 'poisoning' || value === 'suicide';
};

const normalizeSnapshot = (snapshot: GameState): GameState => {
  const base = createInitialGameState(snapshot.mode ?? 'anime-canon', snapshot.phase ?? 'playing');
  const partial = snapshot as Partial<GameState>;

  const stats = partial.stats ?? base.stats;
  const rawInvestigation = partial.investigation;
  const hasTargets = Array.isArray(rawInvestigation?.targets) && rawInvestigation.targets.length > 0;
  const targets = hasTargets ? rawInvestigation.targets : base.investigation.targets;
  const maxTargetIndex = Math.max(0, targets.length - 1);

  const selectedCause = isDeathCause(rawInvestigation?.selectedCause)
    ? rawInvestigation.selectedCause
    : base.investigation.selectedCause;

  const next: GameState = {
    ...base,
    ...snapshot,
    version: Math.max(snapshot.version ?? 1, 2),
    stats: {
      ...base.stats,
      ...stats,
      willpower:
        typeof stats.willpower === 'number'
          ? Math.max(0, Math.min(100, stats.willpower))
          : base.stats.willpower
    },
    investigation: {
      ...base.investigation,
      ...(rawInvestigation ?? {}),
      activeTargetIndex: Math.max(0, Math.min(rawInvestigation?.activeTargetIndex ?? 0, maxTargetIndex)),
      selectedCause,
      targets,
      eliminationLog: Array.isArray(rawInvestigation?.eliminationLog)
        ? rawInvestigation.eliminationLog
        : base.investigation.eliminationLog
    }
  };

  return next;
};

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

    writeJudgment: () => update((state) => gameReducer(state, { type: 'WRITE_JUDGMENT' })),

    investigateTargetName: () =>
      update((state) => gameReducer(state, { type: 'INVESTIGATE_TARGET_NAME' })),

    investigateTargetFace: (source: 'news-clip' | 'social-feed') =>
      update((state) => gameReducer(state, { type: 'INVESTIGATE_TARGET_FACE', source })),

    setInvestigationTarget: (index: number) =>
      update((state) => gameReducer(state, { type: 'SELECT_INVESTIGATION_TARGET', index })),

    setJudgmentCause: (cause: DeathCause) =>
      update((state) => gameReducer(state, { type: 'SET_JUDGMENT_CAUSE', cause })),

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

    hydrate: (snapshot: GameState) => set(normalizeSnapshot(snapshot)),

    continueFromSave: (): boolean => {
      const snapshot = loadSnapshot();
      if (!snapshot) {
        return false;
      }

      set(normalizeSnapshot(snapshot));
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
