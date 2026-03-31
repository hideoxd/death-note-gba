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

const regions = ['kanto', 'kansai', 'tohoku', 'kyushu'] as const;

const isRegion = (value: unknown): value is (typeof regions)[number] => {
  return typeof value === 'string' && (regions as readonly string[]).includes(value);
};

const normalizeFlagValue = (value: unknown): boolean | number | string | undefined => {
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value;
  }

  return undefined;
};

const normalizeSnapshot = (snapshot: GameState): GameState => {
  const base = createInitialGameState(snapshot.mode ?? 'anime-canon', snapshot.phase ?? 'playing');
  const partial = snapshot as Partial<GameState>;

  const stats = partial.stats ?? base.stats;
  const rawInvestigation = partial.investigation;
  const hasTargets = Array.isArray(rawInvestigation?.targets) && rawInvestigation.targets.length > 0;
  const targets = hasTargets
    ? rawInvestigation.targets.map((target, index) => ({
        ...target,
        isDecoy: Boolean((target as { isDecoy?: unknown }).isDecoy),
        region: isRegion((target as { region?: unknown }).region)
          ? (target as { region: (typeof regions)[number] }).region
          : regions[index % regions.length]
      }))
    : base.investigation.targets;
  const maxTargetIndex = Math.max(0, targets.length - 1);

  const selectedCause = isDeathCause(rawInvestigation?.selectedCause)
    ? rawInvestigation.selectedCause
    : base.investigation.selectedCause;

  const pendingCauseTarget = normalizeFlagValue(partial.flags?.pending_cause_target);
  const pendingCauseBlocks = normalizeFlagValue(partial.flags?.pending_cause_blocks);
  const pendingCauseDeadlineMs = normalizeFlagValue(partial.flags?.pending_cause_deadline_ms);
  const shinigamiEyeActive = normalizeFlagValue(partial.flags?.shinigami_eye_active);
  const suspicionAlertSeq = normalizeFlagValue(partial.flags?.suspicion_alert_seq);
  const suspicionAlertReason = normalizeFlagValue(partial.flags?.suspicion_alert_reason);
  const deathFlashSeq = normalizeFlagValue(partial.flags?.death_flash_seq);

  const next: GameState = {
    ...base,
    ...snapshot,
    version: Math.max(snapshot.version ?? 1, 2),
    flags: {
      ...base.flags,
      ...(partial.flags ?? {}),
      pending_cause_target: typeof pendingCauseTarget === 'string' ? pendingCauseTarget : '',
      pending_cause_blocks: typeof pendingCauseBlocks === 'number' ? Math.max(0, Math.floor(pendingCauseBlocks)) : 0,
      pending_cause_deadline_ms:
        typeof pendingCauseDeadlineMs === 'number' ? Math.max(0, Math.floor(pendingCauseDeadlineMs)) : 0,
      shinigami_eye_active: typeof shinigamiEyeActive === 'boolean' ? shinigamiEyeActive : false,
      suspicion_alert_seq: typeof suspicionAlertSeq === 'number' ? Math.max(0, Math.floor(suspicionAlertSeq)) : 0,
      suspicion_alert_reason: typeof suspicionAlertReason === 'string' ? suspicionAlertReason : '',
      death_flash_seq: typeof deathFlashSeq === 'number' ? Math.max(0, Math.floor(deathFlashSeq)) : 0
    },
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
        ? rawInvestigation.eliminationLog.map((entry, index) => ({
            ...entry,
            decoy: Boolean((entry as { decoy?: unknown }).decoy),
            region: isRegion((entry as { region?: unknown }).region)
              ? (entry as { region: (typeof regions)[number] }).region
              : regions[index % regions.length]
          }))
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

    primeJudgmentName: (enteredName: string, deadlineMs: number) =>
      update((state) => gameReducer(state, { type: 'PRIME_JUDGMENT_NAME', enteredName, deadlineMs })),

    resolvePendingCauseTimeout: (nowMs: number) =>
      update((state) => gameReducer(state, { type: 'RESOLVE_PENDING_CAUSE_TIMEOUT', nowMs })),

    toggleShinigamiEye: () => update((state) => gameReducer(state, { type: 'TOGGLE_SHINIGAMI_EYE' })),

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
