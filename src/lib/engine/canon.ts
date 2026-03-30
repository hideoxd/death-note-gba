import { CANON_MILESTONES } from '$lib/data';
import type { GameClock, GameState, MilestoneStatus, TimeBlock } from '$lib/types/game';

const blockOrder: TimeBlock[] = ['morning', 'afternoon', 'night'];

const blockIndex = (block: TimeBlock): number => blockOrder.indexOf(block);

const isAfterWindow = (
  clock: GameClock,
  window: { dayMin: number; dayMax: number; blocks: TimeBlock[] }
): boolean => {
  if (clock.day > window.dayMax) return true;
  if (clock.day < window.dayMax) return false;

  const latestWindowBlock = Math.max(...window.blocks.map((block) => blockIndex(block)));
  return blockIndex(clock.block) > latestWindowBlock;
};

const isWithinWindow = (
  clock: GameClock,
  window: { dayMin: number; dayMax: number; blocks: TimeBlock[] }
): boolean => {
  return (
    clock.day >= window.dayMin &&
    clock.day <= window.dayMax &&
    window.blocks.includes(clock.block)
  );
};

const completeMilestoneLocally = (state: GameState, milestoneId: string): GameState => {
  const currentStatus = state.canon.milestoneState[milestoneId];
  if (currentStatus === 'completed') {
    return state;
  }

  const nextMilestoneState: Record<string, MilestoneStatus> = {
    ...state.canon.milestoneState,
    [milestoneId]: 'completed'
  };

  let activeMilestoneId: string | null = state.canon.activeMilestoneId;

  if (activeMilestoneId === milestoneId) {
    const nextMilestone = CANON_MILESTONES.find(
      (milestone) => nextMilestoneState[milestone.id] === 'locked'
    );

    if (nextMilestone) {
      nextMilestoneState[nextMilestone.id] = 'active';
      activeMilestoneId = nextMilestone.id;
    } else {
      activeMilestoneId = null;
    }
  }

  return {
    ...state,
    canon: {
      ...state.canon,
      milestoneState: nextMilestoneState,
      activeMilestoneId
    }
  };
};

export const markMilestoneCompleted = (state: GameState, milestoneId: string): GameState => {
  if (state.mode !== 'anime-canon') {
    return state;
  }

  return completeMilestoneLocally(state, milestoneId);
};

const ensureActiveMilestone = (state: GameState): GameState => {
  if (state.mode !== 'anime-canon') {
    return state;
  }

  if (state.canon.activeMilestoneId) {
    return state;
  }

  const activeCandidate = CANON_MILESTONES.find(
    (milestone) => state.canon.milestoneState[milestone.id] === 'active'
  );
  if (activeCandidate) {
    return {
      ...state,
      canon: {
        ...state.canon,
        activeMilestoneId: activeCandidate.id
      }
    };
  }

  const lockedCandidate = CANON_MILESTONES.find(
    (milestone) => state.canon.milestoneState[milestone.id] === 'locked'
  );
  if (!lockedCandidate) {
    return state;
  }

  return {
    ...state,
    canon: {
      ...state.canon,
      activeMilestoneId: lockedCandidate.id,
      milestoneState: {
        ...state.canon.milestoneState,
        [lockedCandidate.id]: 'active'
      }
    }
  };
};

export const evaluateCanonTimeline = (state: GameState): GameState => {
  if (state.mode !== 'anime-canon' || state.phase === 'game-over' || state.canon.fractured) {
    return state;
  }

  const stateWithActive = ensureActiveMilestone(state);
  const activeId = stateWithActive.canon.activeMilestoneId;
  if (!activeId) {
    return stateWithActive;
  }

  const milestone = CANON_MILESTONES.find((entry) => entry.id === activeId);
  if (!milestone) {
    return stateWithActive;
  }

  const currentStatus = stateWithActive.canon.milestoneState[activeId];
  if (currentStatus === 'completed') {
    return stateWithActive;
  }

  const requiredFlagsMet = milestone.requiredFlags.every((flag) => Boolean(stateWithActive.flags[flag]));
  if (isWithinWindow(stateWithActive.clock, milestone.window) && requiredFlagsMet) {
    return completeMilestoneLocally(stateWithActive, milestone.id);
  }

  if (isAfterWindow(stateWithActive.clock, milestone.window)) {
    return {
      ...stateWithActive,
      phase: 'game-over',
      canon: {
        ...stateWithActive.canon,
        fractured: milestone.onFail.fracture,
        failureReason: milestone.onFail.reason,
        milestoneState: {
          ...stateWithActive.canon.milestoneState,
          [milestone.id]: 'failed'
        }
      },
      gameOver: {
        reason: 'canon-failure',
        detail: milestone.onFail.reason,
        day: stateWithActive.clock.day,
        block: stateWithActive.clock.block
      }
    };
  }

  return stateWithActive;
};
