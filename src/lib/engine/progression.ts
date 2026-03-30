import { DIALOGUE_TREES } from '$lib/data';
import { evaluateRequirements } from '$lib/engine/conditions';
import { visitNode } from '$lib/engine/dialogue';

import type { GameState, TimeBlock } from '$lib/types/game';

interface ProgressionResult {
  state: GameState;
  message?: string;
}

const switchToTreeStart = (state: GameState, treeId: string): GameState => {
  const tree = DIALOGUE_TREES[treeId];
  if (!tree) {
    return state;
  }

  const withTree: GameState = {
    ...state,
    narrative: {
      ...state.narrative,
      activeTreeId: treeId,
      currentNodeId: tree.meta.startNodeId
    }
  };

  return visitNode(withTree, tree.meta.startNodeId, true);
};

const blockOrder: TimeBlock[] = ['morning', 'afternoon', 'night'];

const blockToNumber = (block: TimeBlock): number => {
  return blockOrder.indexOf(block);
};

const hasReached = (
  state: GameState,
  targetDay: number,
  targetBlock: TimeBlock
): boolean => {
  if (state.clock.day > targetDay) {
    return true;
  }

  if (state.clock.day < targetDay) {
    return false;
  }

  return blockToNumber(state.clock.block) >= blockToNumber(targetBlock);
};

const evaluateCanonProgression = (state: GameState): ProgressionResult => {
  const firstExecutionDone = Boolean(state.flags.first_execution_done);
  const surveillanceResolved = Boolean(state.flags.surveillance_evaded);
  const episode2Started = Boolean(state.flags.canon_episode_02_started);
  const episode3Started = Boolean(state.flags.canon_episode_03_started);

  if (
    firstExecutionDone &&
    surveillanceResolved &&
    !episode2Started &&
    state.narrative.activeTreeId === 'canon-episode-01' &&
    hasReached(state, 2, 'morning')
  ) {
    const next = switchToTreeStart(
      {
        ...state,
        flags: {
          ...state.flags,
          canon_episode_02_started: true
        }
      },
      'canon-episode-02'
    );

    return {
      state: next,
      message: 'Canon Episode 2 unlocked: Raye Penber operation and Misa escalation begin.'
    };
  }

  const rayeComplete = state.canon.milestoneState.RAYE_PENBER_INCIDENT === 'completed';

  if (
    rayeComplete &&
    !episode3Started &&
    state.narrative.activeTreeId === 'canon-episode-02' &&
    hasReached(state, 8, 'morning')
  ) {
    const next = switchToTreeStart(
      {
        ...state,
        flags: {
          ...state.flags,
          canon_episode_03_started: true
        }
      },
      'canon-episode-03'
    );

    return {
      state: next,
      message:
        'Canon Episode 3 unlocked: memory-loss gamble, Yotsuba recovery, and successor-era endgame.'
    };
  }

  const markedStable = Boolean(state.flags.canon_route_stable);

  const finalConfrontationComplete =
    state.canon.milestoneState.YELLOW_BOX_CONFRONTATION === 'completed';

  if (finalConfrontationComplete && !markedStable) {
    return {
      state: {
        ...state,
        flags: {
          ...state.flags,
          canon_route_stable: true
        }
      },
      message: 'Canon route reached final resolution: Yellow Box exposes Light and Ryuk ends the game.'
    };
  }

  return { state };
};

const evaluateDivergentProgression = (state: GameState): ProgressionResult => {
  const chapter2Started = Boolean(state.flags.divergent_ch2_started);
  const chapter2Complete = Boolean(state.flags.divergent_ch2_complete);

  if (
    !chapter2Started &&
    state.narrative.activeTreeId === 'divergent-chapter-01' &&
    state.clock.day >= 4 &&
    state.stats.intel >= 4
  ) {
    const tree = DIALOGUE_TREES['divergent-chapter-02'];
    const startNode = tree?.nodes[tree.meta.startNodeId];
    const canEnter = startNode ? evaluateRequirements(startNode.requirements, state) : false;

    if (tree && canEnter) {
      const next = switchToTreeStart(
        {
          ...state,
          flags: {
            ...state.flags,
            divergent_ch2_started: true
          }
        },
        'divergent-chapter-02'
      );

      return {
        state: next,
        message: 'Divergent Chapter 2 unlocked: L escalates counter-strategy.'
      };
    }
  }

  if (
    !chapter2Complete &&
    state.narrative.activeTreeId === 'divergent-chapter-02' &&
    state.narrative.currentNodeId === 'div2_exit_001'
  ) {
    return {
      state: {
        ...state,
        flags: {
          ...state.flags,
          divergent_ch2_complete: true
        }
      },
      message: 'Divergent Chapter 2 complete. Sandbox pressure profile updated.'
    };
  }

  return { state };
};

export const evaluateStoryProgression = (state: GameState): ProgressionResult => {
  if (state.phase === 'game-over') {
    return { state };
  }

  if (state.mode === 'anime-canon') {
    return evaluateCanonProgression(state);
  }

  return evaluateDivergentProgression(state);
};
