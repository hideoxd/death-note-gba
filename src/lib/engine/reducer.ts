import { ACTIVITIES } from '$lib/data';
import { evaluateCanonTimeline } from '$lib/engine/canon';
import { evaluateRequirements, listUnmetRequirements } from '$lib/engine/conditions';
import { getCurrentNode, getDialogueTree, visitNode } from '$lib/engine/dialogue';
import { applyEffects } from '$lib/engine/effects';
import { evaluateStoryProgression } from '$lib/engine/progression';
import { createInitialGameState } from '$lib/engine/stateFactory';
import { recalculateSuspicion } from '$lib/engine/suspicion';
import { advanceClock } from '$lib/engine/time';
import type { GameAction } from '$lib/types/engine';
import type { GameState, TimeBlock } from '$lib/types/game';

const createLogId = (state: GameState): string => {
  return `${state.clock.totalBlocksElapsed}-${state.log.length + 1}`;
};

const pushLog = (
  state: GameState,
  kind: 'system' | 'action' | 'story',
  text: string,
  day = state.clock.day,
  block: TimeBlock = state.clock.block
): GameState => {
  return {
    ...state,
    log: [
      ...state.log,
      {
        id: createLogId(state),
        kind,
        text,
        day,
        block
      }
    ]
  };
};

const advanceTimeStep = (state: GameState, blocks = 1): GameState => {
  const nextClock = advanceClock(state.clock, blocks);

  let next = {
    ...state,
    clock: nextClock,
    actionEconomy: {
      ...state.actionEconomy,
      actionsRemaining: state.actionEconomy.actionsPerBlock
    }
  };

  next = recalculateSuspicion(next);
  next = evaluateCanonTimeline(next);

  return next;
};

const autoTraverseLinearNodes = (state: GameState): GameState => {
  let next = state;
  let guard = 0;

  while (guard < 12) {
    guard += 1;

    const node = getCurrentNode(next);
    if (!node) {
      return next;
    }

    const hasChoices = (node.choices?.length ?? 0) > 0;
    if (hasChoices || !node.next) {
      return next;
    }

    next = visitNode(next, node.next, true);
  }

  return next;
};

const startNewGame = (mode: GameState['mode']): GameState => {
  let next = createInitialGameState(mode, 'playing');
  next = visitNode(next, next.narrative.currentNodeId, true);
  next = autoTraverseLinearNodes(next);
  next = evaluateCanonTimeline(next);
  next = applyProgression(next);
  next = pushLog(
    next,
    'system',
    mode === 'anime-canon'
      ? 'Canon puzzle mode initialized. Keep strict timeline integrity.'
      : 'Divergent mode initialized. Branch outcomes adapt to your profile.'
  );
  return next;
};

const applyProgression = (state: GameState): GameState => {
  const result = evaluateStoryProgression(state);
  if (result.message) {
    return pushLog(result.state, 'system', result.message);
  }

  return result.state;
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (action.type !== 'START_NEW_GAME' && state.phase === 'game-over') {
    return state;
  }

  switch (action.type) {
    case 'START_NEW_GAME': {
      return startNewGame(action.mode);
    }

    case 'SET_PHASE': {
      return {
        ...state,
        phase: action.phase
      };
    }

    case 'ADVANCE_TIME': {
      const blocks = action.blocks ?? 1;
      let next = advanceTimeStep(state, blocks);
      next = applyProgression(next);
      next = pushLog(next, 'system', `Time advanced by ${blocks} block(s).`);
      return next;
    }

    case 'CONTINUE_NODE': {
      const node = getCurrentNode(state);
      if (!node || !node.next || (node.choices?.length ?? 0) > 0) {
        return pushLog(state, 'system', 'No auto-continue available on this node.');
      }

      let next = visitNode(state, node.next, true);
      next = autoTraverseLinearNodes(next);
      next = evaluateCanonTimeline(next);
      next = applyProgression(next);
      next = pushLog(next, 'story', 'Continued dialogue.');
      return next;
    }

    case 'PERFORM_ACTIVITY': {
      if (state.phase !== 'playing') {
        return state;
      }

      const activity = ACTIVITIES.find((entry) => entry.id === action.activityId);
      if (!activity) {
        return pushLog(state, 'system', `Unknown activity: ${action.activityId}`);
      }

      if (state.actionEconomy.actionsRemaining <= 0) {
        return pushLog(state, 'system', 'No actions left in this time block. Skip block to continue.');
      }

      if (!evaluateRequirements(activity.requirements, state)) {
        const unmet = listUnmetRequirements(activity.requirements, state);
        const message = unmet.length > 0 ? unmet.join(' | ') : 'requirements missing';
        return pushLog(state, 'system', `Cannot do ${activity.label}: ${message}.`);
      }

      let next: GameState = {
        ...state,
        actionEconomy: {
          ...state.actionEconomy,
          actionsRemaining: state.actionEconomy.actionsRemaining - 1
        }
      };

      next = applyEffects(next, activity.effects);
      next = evaluateCanonTimeline(next);
      next = applyProgression(next);
      next = pushLog(next, 'action', `Activity: ${activity.label}`);

      if (next.phase !== 'game-over' && next.actionEconomy.actionsRemaining <= 0) {
        next = advanceTimeStep(next, 1);
        next = applyProgression(next);
        next = pushLog(next, 'system', 'Time block ended. Moving to next block.');
      }

      return next;
    }

    case 'SELECT_CHOICE': {
      if (state.phase !== 'playing') {
        return state;
      }

      const node = getCurrentNode(state);
      if (!node) {
        return pushLog(state, 'system', 'No active dialogue node.');
      }

      const nodeChoices = node.choices ?? [];
      const choice = nodeChoices.find((entry) => entry.id === action.choiceId);

      if (!choice) {
        return pushLog(state, 'system', `Choice unavailable: ${action.choiceId}`);
      }

      const unmet = listUnmetRequirements(choice.requirements, state);
      if (unmet.length > 0) {
        return pushLog(state, 'system', `Choice locked: ${unmet.join(' | ')}.`);
      }

      let next: GameState = {
        ...state,
        narrative: {
          ...state.narrative,
          choiceHistory: [
            ...state.narrative.choiceHistory,
            {
              nodeId: node.id,
              choiceId: choice.id,
              day: state.clock.day,
              block: state.clock.block
            }
          ]
        }
      };

      if (choice.effects?.length) {
        next = applyEffects(next, choice.effects);
      }

      if (next.phase !== 'game-over') {
        next = visitNode(next, choice.next, true);
        next = autoTraverseLinearNodes(next);
        next = evaluateCanonTimeline(next);
        next = applyProgression(next);
      }

      next = pushLog(next, 'story', `Choice: ${choice.label}`);
      return next;
    }

    case 'APPLY_EFFECTS': {
      let next = applyEffects(state, action.effects);
      next = evaluateCanonTimeline(next);
      next = applyProgression(next);
      return next;
    }

    case 'SET_NODE': {
      let next = state;

      if (action.treeId && action.treeId !== state.narrative.activeTreeId) {
        const tree = getDialogueTree(action.treeId);
        if (!tree) {
          return pushLog(state, 'system', `Unknown tree: ${action.treeId}`);
        }

        next = {
          ...next,
          narrative: {
            ...next.narrative,
            activeTreeId: tree.meta.id,
            currentNodeId: tree.meta.startNodeId
          }
        };
      }

      next = visitNode(next, action.nodeId, action.addSeen ?? true);
      next = autoTraverseLinearNodes(next);
      next = applyProgression(next);
      return next;
    }

    case 'PUSH_LOG': {
      return pushLog(state, action.kind, action.text, action.day, action.block);
    }

    case 'TRIGGER_GAME_OVER': {
      return {
        ...state,
        phase: 'game-over',
        gameOver: {
          reason: action.reason,
          detail: action.detail,
          day: state.clock.day,
          block: state.clock.block
        }
      };
    }

    case 'UPDATE_MILESTONE': {
      return {
        ...state,
        canon: {
          ...state.canon,
          activeMilestoneId: action.setActive
            ? action.milestoneId
            : state.canon.activeMilestoneId,
          milestoneState: {
            ...state.canon.milestoneState,
            [action.milestoneId]: action.status
          }
        }
      };
    }

    default:
      return state;
  }
};
