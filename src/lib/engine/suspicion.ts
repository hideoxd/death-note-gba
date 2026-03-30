import { SUSPICION_RULES } from '$lib/data';
import type { GameState, SuspicionBreakdown } from '$lib/types/game';
import { clamp } from '$lib/utils/clamp';

const emptyBreakdown = (): SuspicionBreakdown => ({
  patternRisk: 0,
  socialCover: 0,
  policeHeat: 0,
  mistakes: 0
});

export const recalculateSuspicion = (state: GameState): GameState => {
  const intelPressure = Math.max(0, state.stats.intel - Math.floor(state.stats.alibi / 2));
  const patternRisk = intelPressure * SUSPICION_RULES.weights.intelSpike;
  const socialCover =
    Math.min(6, Math.floor(state.stats.alibi / 3)) * SUSPICION_RULES.weights.socialCover;
  const policeHeat =
    state.mode === 'anime-canon'
      ? state.suspicion.meter >= SUSPICION_RULES.thresholds.activeInvestigation
        ? 2.2
        : 1.6
      : state.suspicion.meter >= SUSPICION_RULES.thresholds.watchlist
        ? 1.2
        : 0.7;
  const mistakes =
    Math.max(0, state.stats.stress - 35) * (SUSPICION_RULES.weights.mistakePenalty / 22);

  const rawDelta =
    patternRisk +
    socialCover +
    policeHeat +
    mistakes -
    SUSPICION_RULES.baseDecayPerBlock;

  const nextMeter = clamp(
    Math.round((state.suspicion.meter + rawDelta) * 100) / 100,
    SUSPICION_RULES.minMeter,
    SUSPICION_RULES.maxMeter
  );

  const nextState: GameState = {
    ...state,
    suspicion: {
      meter: nextMeter,
      trend: Math.round(rawDelta * 100) / 100,
      breakdown: {
        patternRisk: Math.round(patternRisk * 100) / 100,
        socialCover: Math.round(socialCover * 100) / 100,
        policeHeat: Math.round(policeHeat * 100) / 100,
        mistakes: Math.round(mistakes * 100) / 100
      }
    }
  };

  if (nextState.suspicion.meter >= 100) {
    return {
      ...nextState,
      phase: 'game-over',
      gameOver: {
        reason: 'suspicion-max',
        detail: "L's investigation has fully exposed Kira.",
        day: nextState.clock.day,
        block: nextState.clock.block
      }
    };
  }

  return nextState;
};

export const applySuspicionDelta = (
  state: GameState,
  delta: number,
  reason?: string
): GameState => {
  const nextMeter = clamp(
    state.suspicion.meter + delta,
    SUSPICION_RULES.minMeter,
    SUSPICION_RULES.maxMeter
  );

  const breakdown = {
    ...state.suspicion.breakdown
  };

  if (reason?.includes('cover') || reason?.includes('routine')) {
    breakdown.socialCover = Math.round((breakdown.socialCover + delta) * 100) / 100;
  } else if (reason?.includes('execution') || reason?.includes('intel')) {
    breakdown.patternRisk = Math.round((breakdown.patternRisk + delta) * 100) / 100;
  } else if (reason?.includes('mistake')) {
    breakdown.mistakes = Math.round((breakdown.mistakes + delta) * 100) / 100;
  } else {
    breakdown.policeHeat = Math.round((breakdown.policeHeat + delta) * 100) / 100;
  }

  const next = {
    ...state,
    suspicion: {
      meter: nextMeter,
      trend: delta,
      breakdown
    }
  };

  if (nextMeter >= 100) {
    return {
      ...next,
      phase: 'game-over',
      gameOver: {
        reason: 'suspicion-max',
        detail: "L's investigation has fully exposed Kira.",
        day: state.clock.day,
        block: state.clock.block
      }
    };
  }

  return next;
};

export const createInitialSuspicionBreakdown = emptyBreakdown;
